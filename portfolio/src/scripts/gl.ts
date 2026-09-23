// Rendu WebGL (OGL) des visuels de projets, synchronisé avec le DOM :
// courbure selon la vitesse de défilement, perspective au survol,
// et « vol » d'un visuel d'une position à une autre (zoom d'ouverture / de fermeture).
import gsap from 'gsap';
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';

export type Rect = { x: number; y: number; w: number; h: number };

export type GLItem = {
  id: string;
  el: HTMLElement | null; // élément DOM suivi (null pendant un vol)
  mesh: Mesh;
  program: Program;
  rect: Rect;
  mouse: { x: number; y: number; tx: number; ty: number };
  unbind: () => void;
};

const vertex = /* glsl */ `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform vec2 uSize;
  uniform float uVelocity;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uProgress;
  varying vec2 vUv;
  const float PI = 3.141592653589793;

  void main() {
    vUv = uv;
    vec3 p = position * vec3(uSize, 1.0);

    // Apparition : légère montée et mise à l'échelle
    float hidden = 1.0 - uProgress;
    p.xy *= 1.0 - 0.06 * hidden;
    p.y -= 40.0 * hidden;

    // Courbure : le centre du visuel « traîne » selon la vitesse de défilement
    p.y -= sin(uv.x * PI) * uVelocity;

    // Inclinaison vers le curseur
    float ay = uMouse.x * 0.07 * uHover;
    float ax = -uMouse.y * 0.07 * uHover;
    vec3 r = p;
    r.x = p.x * cos(ay) + p.z * sin(ay);
    r.z = -p.x * sin(ay) + p.z * cos(ay);
    p = r;
    r.y = p.y * cos(ax) - p.z * sin(ax);
    r.z = p.y * sin(ax) + p.z * cos(ax);
    p = r;

    // Perspective appliquée à la main (la caméra reste orthographique, en pixels)
    float persp = 1600.0;
    p.xy *= persp / (persp - p.z);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p.xy, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform vec2 uImage;
  uniform vec2 uSize;
  uniform float uHover;
  uniform float uProgress;
  uniform float uAlpha;
  varying vec2 vUv;

  void main() {
    // Équivalent de object-fit: cover
    vec2 ratio = vec2(
      min((uSize.x / uSize.y) / (uImage.x / uImage.y), 1.0),
      min((uSize.y / uSize.x) / (uImage.y / uImage.x), 1.0)
    );
    vec2 uv = vUv * ratio + (1.0 - ratio) * 0.5;

    // Zoom discret au survol, léger dézoom pendant l'apparition
    float zoom = 1.0 - 0.03 * uHover - 0.08 * (1.0 - uProgress);
    uv = (uv - 0.5) * zoom + 0.5;

    vec3 color = texture2D(tMap, uv).rgb;
    gl_FragColor = vec4(color, uAlpha * uProgress);
  }
`;

const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export class GL {
  private renderer: Renderer;
  private gl: Renderer['gl'];
  private camera: Camera;
  private scene = new Transform();
  private geometry: Plane;
  private items: GLItem[] = [];
  private textures = new Map<string, { texture: Texture; size: [number, number] }>();
  private velocity = 0;

  static create(root: HTMLElement, getVelocity: () => number): GL | null {
    try {
      return new GL(root, getVelocity);
    } catch {
      return null; // pas de WebGL : on garde les visuels DOM
    }
  }

  private constructor(
    private root: HTMLElement,
    private getVelocity: () => number,
  ) {
    this.renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true, antialias: true });
    this.gl = this.renderer.gl;
    if (!this.gl) throw new Error('WebGL indisponible');
    this.gl.clearColor(0, 0, 0, 0);
    root.appendChild(this.gl.canvas);
    this.camera = new Camera(this.gl, { left: -1, right: 1, top: 1, bottom: -1, near: -10, far: 10 });
    this.geometry = new Plane(this.gl, { widthSegments: 24, heightSegments: 24 });
    this.resize();
    window.addEventListener('resize', () => this.resize());
    gsap.ticker.add(() => this.tick());
  }

  private resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.orthographic({ left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2, near: -10, far: 10 });
  }

  /* ---------------------------------------------------------------- textures */

  private textureFor(el: HTMLElement) {
    const id = el.dataset.glId!;
    const cached = this.textures.get(id);
    if (cached) return cached;

    // Aplat de couleur + titre (en attendant les vraies images)
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = el.dataset.glColor || '#bbb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Taille ajustée pour rester lisible même recadré en portrait
    let size = 120;
    const setFont = () => (ctx.font = `italic 300 ${size}px "Garamond Swash", "Cormorant Garamond", Georgia, serif`);
    setFont();
    while (ctx.measureText(el.dataset.glTitle || '').width > canvas.width * 0.6 && size > 40) {
      size -= 4;
      setFont();
    }
    ctx.fillText(el.dataset.glTitle || '', canvas.width / 2, canvas.height / 2);

    const entry = {
      texture: new Texture(this.gl, { image: canvas, generateMipmaps: false }),
      size: [canvas.width, canvas.height] as [number, number],
    };
    this.textures.set(id, entry);

    const img = el.querySelector('img');
    if (img) {
      const image = new Image();
      image.decoding = 'async';
      image.src = img.currentSrc || img.src;
      image.decode().then(() => {
        entry.texture.image = image;
        entry.size = [image.naturalWidth, image.naturalHeight];
        this.items.filter((i) => i.id === id).forEach((i) => (i.program.uniforms.uImage.value = entry.size));
      }, () => {});
    }
    return entry;
  }

  /* ------------------------------------------------------------ suivi du DOM */

  attach(skip?: Element | null) {
    document.querySelectorAll<HTMLElement>('[data-gl]').forEach((el) => {
      if (el === skip || this.has(el)) return;
      const { texture, size } = this.textureFor(el);
      const program = new Program(this.gl, {
        vertex,
        fragment,
        transparent: true,
        depthTest: false,
        uniforms: {
          tMap: { value: texture },
          uImage: { value: size },
          uSize: { value: [1, 1] },
          uVelocity: { value: 0 },
          uMouse: { value: [0, 0] },
          uHover: { value: 0 },
          uProgress: { value: 1 },
          uAlpha: { value: 1 },
        },
      });
      const mesh = new Mesh(this.gl, { geometry: this.geometry, program });
      mesh.renderOrder = this.items.length;
      // La taille réelle est appliquée dans le shader : le test de visibilité d'OGL
      // (basé sur un plan 1×1) masquerait à tort les visuels à cheval sur un bord.
      mesh.frustumCulled = false;
      mesh.setParent(this.scene);
      const item: GLItem = {
        id: el.dataset.glId!,
        el: null,
        mesh,
        program,
        rect: rectOf(el),
        mouse: { x: 0, y: 0, tx: 0, ty: 0 },
        unbind: () => {},
      };
      this.items.push(item);
      this.land(item, el);
    });
  }

  /** Retire tous les visuels sauf `keep` (celui en vol entre deux pages). */
  detach(keep?: GLItem | null) {
    this.items = this.items.filter((item) => {
      if (item === keep) return true;
      item.unbind();
      this.scene.removeChild(item.mesh);
      return false;
    });
  }

  rect(el: Element) {
    return rectOf(el);
  }

  has(el: Element) {
    return this.items.some((i) => i.el === el);
  }

  uniform(el: Element, name: string): { value: number } | null {
    return this.items.find((i) => i.el === el)?.program.uniforms[name] ?? null;
  }

  /** Détache un visuel de son élément : il reste figé et peut « voler ». */
  take(el: Element): GLItem | null {
    const item = this.items.find((i) => i.el === el);
    if (!item) return null;
    item.unbind();
    item.el = null;
    item.mesh.renderOrder = 2000;
    gsap.to(item.program.uniforms.uHover, { value: 0, duration: 0.4 });
    gsap.to(item.program.uniforms.uProgress, { value: 1, duration: 0.3 });
    return item;
  }

  /** Rattache un visuel à un élément du DOM (qui devient invisible). */
  land(item: GLItem, el: HTMLElement) {
    item.el = el;
    const order = this.items.indexOf(item);
    item.mesh.renderOrder = order;
    el.style.opacity = '0';
    if (el.dataset.glHover === 'off') return;

    const target = el.closest('a') ?? el;
    const uHover = item.program.uniforms.uHover;
    const onEnter = () => {
      item.mesh.renderOrder = 1000;
      gsap.to(uHover, { value: 1, duration: 1, ease: 'power3.out' });
    };
    const onLeave = () => {
      item.mesh.renderOrder = order;
      gsap.to(uHover, { value: 0, duration: 1, ease: 'power3.out' });
      item.mouse.tx = item.mouse.ty = 0;
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      item.mouse.tx = gsap.utils.clamp(-1, 1, ((e.clientX - r.left) / r.width) * 2 - 1);
      item.mouse.ty = gsap.utils.clamp(-1, 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    };
    target.addEventListener('pointerenter', onEnter);
    target.addEventListener('pointerleave', onLeave);
    target.addEventListener('pointermove', onMove as EventListener);
    item.unbind = () => {
      target.removeEventListener('pointerenter', onEnter);
      target.removeEventListener('pointerleave', onLeave);
      target.removeEventListener('pointermove', onMove as EventListener);
      item.unbind = () => {};
    };
  }

  /** Anime un visuel de sa position actuelle vers une cible (recalculée à chaque image). */
  flyTo(item: GLItem, target: () => Rect, duration = 1.1) {
    const from = { ...item.rect };
    const state = { t: 0 };
    return gsap
      .to(state, {
        t: 1,
        duration,
        ease: 'expo.inOut',
        onUpdate: () => {
          const to = target();
          item.rect = {
            x: lerp(from.x, to.x, state.t),
            y: lerp(from.y, to.y, state.t),
            w: lerp(from.w, to.w, state.t),
            h: lerp(from.h, to.h, state.t),
          };
        },
      })
      .then(() => {});
  }

  /** Fondu de tous les visuels sauf `except`. */
  fade(except: GLItem | null, to: number, duration = 0.6, from?: number) {
    const uniforms = this.items.filter((i) => i !== except).map((i) => i.program.uniforms.uAlpha);
    if (from !== undefined) uniforms.forEach((u) => (u.value = from));
    return gsap.to(uniforms, { value: to, duration, ease: 'power2.out' }).then(() => {});
  }

  dispose(item: GLItem) {
    this.items = this.items.filter((i) => i !== item);
    this.scene.removeChild(item.mesh);
  }

  /* ------------------------------------------------------------------ rendu */

  private tick() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Vitesse lissée, convertie en amplitude de courbure (px)
    const target = gsap.utils.clamp(-18, 18, this.getVelocity() * 0.6);
    this.velocity += (target - this.velocity) * 0.08;

    for (const item of this.items) {
      if (item.el) item.rect = rectOf(item.el);
      const { x, y, w, h } = item.rect;
      const visible = w > 0 && h > 0 && y < vh + 200 && y + h > -200 && x < vw && x + w > 0;
      item.mesh.visible = visible;
      if (!visible) continue;

      item.mesh.position.set(x + w / 2 - vw / 2, vh / 2 - y - h / 2, 0);
      item.mouse.x += (item.mouse.tx - item.mouse.x) * 0.06;
      item.mouse.y += (item.mouse.ty - item.mouse.y) * 0.06;

      const u = item.program.uniforms;
      u.uSize.value = [w, h];
      u.uMouse.value = [item.mouse.x, item.mouse.y];
      u.uVelocity.value = item.el ? this.velocity : 0;
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
  }
}
