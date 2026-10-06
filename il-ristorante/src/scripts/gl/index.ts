// Couche WebGL unique (three.js), persistante entre les pages.
// Chaque <img data-gl> du DOM devient un plan synchronisé sur sa position à l'écran.
import * as THREE from 'three';
import gsap from 'gsap';
import {
  mediaVertex, mediaFragment, heroFragment, flowFragment, quadVertex, followVertex, followFragment,
} from './shaders';

const TINTS = ['#ff3636', '#a5d2f5', '#fb71ad', '#11573b'].map((c) => new THREE.Color(c));
const CAMERA_Z = 800;

type Pointer = { x: number; y: number; vx: number; vy: number; moved: number };

export class GL {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
  medias: Media[] = [];
  flow: Flowmap;
  follow: Follow;
  pointer: Pointer = { x: -1, y: -1, vx: 0, vy: 0, moved: 0 };
  w = 0;
  h = 0;
  time = 0;
  private textures = new Map<string, Promise<THREE.Texture>>();
  private loader = new THREE.TextureLoader();

  constructor(public canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.camera = new THREE.PerspectiveCamera(45, 1, 10, 4000);
    this.camera.position.z = CAMERA_Z;
    this.flow = new Flowmap(this.renderer);
    this.follow = new Follow(this);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('pointermove', (e) => this.onPointer(e), { passive: true });
  }

  static supported() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  }

  texture(src: string) {
    let t = this.textures.get(src);
    if (!t) {
      t = this.loader.loadAsync(src).then((tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        return tex;
      });
      this.textures.set(src, t);
    }
    return t;
  }

  resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.camera.fov = (2 * Math.atan(this.h / 2 / CAMERA_Z) * 180) / Math.PI;
    this.camera.updateProjectionMatrix();
    this.flow.aspect = this.w / this.h;
    this.medias.forEach((m) => m.measure());
  }

  private onPointer(e: PointerEvent) {
    const p = this.pointer;
    if (p.x >= 0) {
      p.vx += (e.clientX - p.x - p.vx) * 0.5;
      p.vy += (e.clientY - p.y - p.vy) * 0.5;
    }
    p.x = e.clientX;
    p.y = e.clientY;
    p.moved = performance.now();
  }

  scan(root: ParentNode) {
    root.querySelectorAll<HTMLImageElement>('img[data-gl]').forEach((img) => {
      if (!this.medias.some((m) => m.img === img)) this.medias.push(new Media(this, img));
    });
    this.follow.bind(root);
  }

  clear() {
    this.medias.forEach((m) => m.dispose());
    this.medias = [];
    this.follow.unbind();
  }

  heroes() {
    return this.medias.filter((m) => m.kind === 'hero');
  }

  update(dt: number, velocity: number) {
    this.time += dt;
    const p = this.pointer;
    if (performance.now() - p.moved > 60) {
      p.vx *= 0.85;
      p.vy *= 0.85;
    }
    this.flow.update(p, this.w, this.h);
    this.medias.forEach((m) => m.update(velocity));
    this.follow.update();
    this.renderer.render(this.scene, this.camera);
  }
}

class Media {
  kind: 'hero' | 'base';
  mesh: THREE.Mesh;
  uniforms: Record<string, THREE.IUniform>;
  rect = { x: 0, y: 0, w: 0, h: 0 };
  hover = 0;
  hoverTarget = 0;
  private io?: IntersectionObserver;
  private ac = new AbortController();

  constructor(private gl: GL, public img: HTMLImageElement) {
    this.kind = img.dataset.gl === 'hero' ? 'hero' : 'base';
    this.uniforms = {
      uTex: { value: null },
      uFlow: { value: null },
      uImg: { value: new THREE.Vector2(1, 1) },
      uPlane: { value: new THREE.Vector2(1, 1) },
      uViewport: { value: new THREE.Vector2(gl.w, gl.h) },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uRadius: { value: new THREE.Vector4() },
      uTint: { value: TINTS[gl.medias.length % TINTS.length] },
      uReveal: { value: 0 },
      uHover: { value: 0 },
      uScroll: { value: 0 },
      uTime: { value: 0 },
      uVel: { value: 0 },
      uLoaded: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: mediaVertex,
      fragmentShader: this.kind === 'hero' ? heroFragment : mediaFragment,
      uniforms: this.uniforms,
      transparent: true,
      depthTest: false,
    });
    this.mesh = new THREE.Mesh(gl.geometry, material);
    this.mesh.visible = false;
    this.mesh.renderOrder = this.kind === 'hero' ? 0 : 1;
    gl.scene.add(this.mesh);

    gl.texture(img.currentSrc || img.src).then((tex) => {
      if (this.ac.signal.aborted) return;
      const image = tex.image as HTMLImageElement;
      this.uniforms.uTex.value = tex;
      this.uniforms.uImg.value.set(image.naturalWidth || image.width, image.naturalHeight || image.height);
      this.uniforms.uLoaded.value = 1;
      img.classList.add('gl-ready');
    });

    this.measure();

    // Révélation à l'entrée dans l'écran (le hero est déclenché par l'intro de page)
    if (this.kind === 'base') {
      this.io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          gsap.to(this.uniforms.uReveal, { value: 1, duration: 1.8, ease: 'power2.out', delay: 0.05 });
          this.io?.disconnect();
        },
        { rootMargin: '0px 0px -12% 0px' },
      );
      this.io.observe(img);

      const target = img.closest<HTMLElement>('a, [data-hover-zone]') ?? img.parentElement!;
      const opts = { signal: this.ac.signal, passive: true };
      target.addEventListener('pointerenter', () => (this.hoverTarget = 1), opts);
      target.addEventListener('pointerleave', () => (this.hoverTarget = 0), opts);
      target.addEventListener('pointermove', (e) => {
        const r = img.getBoundingClientRect();
        this.uniforms.uMouse.value.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
      }, opts);
    }
  }

  /** Rayons de bordure du conteneur, pour reproduire les arches et arrondis en WebGL. */
  measure() {
    const box = this.img.parentElement;
    if (!box) return;
    const cs = getComputedStyle(box);
    const r = this.img.getBoundingClientRect();
    const max = Math.min(r.width, r.height) / 2;
    const px = (v: string) => Math.min(parseFloat(v) || 0, max);
    this.uniforms.uRadius.value.set(
      px(cs.borderTopRightRadius), px(cs.borderBottomRightRadius),
      px(cs.borderTopLeftRadius), px(cs.borderBottomLeftRadius),
    );
    this.uniforms.uViewport.value.set(this.gl.w, this.gl.h);
    const dpr = this.gl.renderer.getPixelRatio();
    this.uniforms.uResolution.value.set(this.gl.w * dpr, this.gl.h * dpr);
  }

  /** Révélation pilotée de l'extérieur (hero). */
  reveal(delay = 0) {
    return gsap.to(this.uniforms.uReveal, { value: 1, duration: 2.2, ease: 'power3.out', delay });
  }

  update(velocity: number) {
    const r = this.img.getBoundingClientRect();
    const { w, h } = this.gl;
    const visible = r.bottom > -50 && r.top < h + 50 && r.right > -50 && r.left < w + 50 && r.width > 0;
    this.mesh.visible = visible && this.uniforms.uLoaded.value > 0;
    if (!visible) return;

    this.hover += (this.hoverTarget - this.hover) * 0.08;
    this.mesh.scale.set(r.width, r.height, 1);
    this.mesh.position.set(r.left + r.width / 2 - w / 2, -(r.top + r.height / 2) + h / 2, 0);
    const u = this.uniforms;
    u.uPlane.value.set(r.width, r.height);
    u.uTime.value = this.gl.time;
    u.uHover.value = this.hover;
    u.uVel.value += (velocity - u.uVel.value) * 0.12;
    if (this.kind === 'hero') {
      u.uFlow.value = this.gl.flow.texture;
      u.uScroll.value = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
    }
  }

  dispose() {
    this.ac.abort();
    this.io?.disconnect();
    gsap.killTweensOf(this.uniforms.uReveal);
    this.gl.scene.remove(this.mesh);
    (this.mesh.material as THREE.Material).dispose();
    this.img.classList.remove('gl-ready');
  }
}

/** Champ de déplacement (ping-pong) alimenté par la vitesse du pointeur. */
class Flowmap {
  private targets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private uniforms: Record<string, THREE.IUniform>;
  private vel = new THREE.Vector2();
  aspect = 1;

  constructor(private renderer: THREE.WebGLRenderer) {
    const opts = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    this.targets = [new THREE.WebGLRenderTarget(128, 128, opts), new THREE.WebGLRenderTarget(128, 128, opts)];
    this.uniforms = {
      tMap: { value: this.targets[0].texture },
      uMouse: { value: new THREE.Vector2(-1, -1) },
      uVelocity: { value: this.vel },
      uAspect: { value: 1 },
      uFalloff: { value: 0.22 },
      uAlpha: { value: 1 },
      uDissipation: { value: 0.965 },
    };
    const mat = new THREE.ShaderMaterial({ vertexShader: quadVertex, fragmentShader: flowFragment, uniforms: this.uniforms, depthTest: false });
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  }

  get texture() {
    return this.targets[0].texture;
  }

  update(p: Pointer, w: number, h: number) {
    const u = this.uniforms;
    u.uAspect.value = this.aspect;
    if (p.x >= 0) u.uMouse.value.set(p.x / w, 1 - p.y / h);
    this.vel.x += (Math.max(-1, Math.min(1, (p.vx / w) * 12)) - this.vel.x) * 0.2;
    this.vel.y += (Math.max(-1, Math.min(1, (p.vy / h) * 12)) - this.vel.y) * 0.2;
    u.tMap.value = this.targets[0].texture;
    this.renderer.setRenderTarget(this.targets[1]);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.targets.reverse();
  }
}

/** Image qui suit le pointeur au survol d'une liste ([data-follow] avec data-img). */
class Follow {
  mesh: THREE.Mesh;
  uniforms: Record<string, THREE.IUniform>;
  pos = new THREE.Vector2();
  active = false;
  private ac?: AbortController;
  private size = new THREE.Vector2(300, 380);

  constructor(private gl: GL) {
    this.uniforms = {
      uTex: { value: null },
      uImg: { value: new THREE.Vector2(1, 1) },
      uPlane: { value: this.size },
      uVelocity: { value: new THREE.Vector2() },
      uAlpha: { value: 0 },
      uSwap: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({ vertexShader: followVertex, fragmentShader: followFragment, uniforms: this.uniforms, transparent: true, depthTest: false });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 24, 24), mat);
    this.mesh.renderOrder = 5;
    this.mesh.visible = false;
    gl.scene.add(this.mesh);
  }

  bind(root: ParentNode) {
    this.unbind();
    if (matchMedia('(hover: none)').matches) return;
    const items = root.querySelectorAll<HTMLElement>('[data-follow] [data-img]');
    if (!items.length) return;
    this.ac = new AbortController();
    const opts = { signal: this.ac.signal };
    items.forEach((el) => {
      const src = el.dataset.img!;
      this.gl.texture(src);
      el.addEventListener('pointerenter', () => this.show(src), opts);
      el.addEventListener('pointerleave', () => this.hide(), opts);
    });
  }

  unbind() {
    this.ac?.abort();
    this.hide();
  }

  private async show(src: string) {
    const tex = await this.gl.texture(src);
    const img = tex.image as HTMLImageElement;
    this.uniforms.uTex.value = tex;
    this.uniforms.uImg.value.set(img.naturalWidth || img.width, img.naturalHeight || img.height);
    if (!this.active) {
      const p = this.gl.pointer;
      this.pos.set(p.x, p.y);
    }
    this.active = true;
    gsap.to(this.uniforms.uAlpha, { value: 1, duration: 0.9, ease: 'power3.out', overwrite: true });
    gsap.fromTo(this.uniforms.uSwap, { value: 1 }, { value: 0, duration: 1, ease: 'power3.out', overwrite: true });
  }

  private hide() {
    this.active = false;
    gsap.to(this.uniforms.uAlpha, { value: 0, duration: 0.6, ease: 'power3.out', overwrite: true });
  }

  update() {
    const a = this.uniforms.uAlpha.value as number;
    this.mesh.visible = a > 0.001 && !!this.uniforms.uTex.value;
    if (!this.mesh.visible) return;
    const p = this.gl.pointer;
    const prevX = this.pos.x;
    const prevY = this.pos.y;
    this.pos.x += (p.x - this.pos.x) * 0.12;
    this.pos.y += (p.y - this.pos.y) * 0.12;
    const v = this.uniforms.uVelocity.value as THREE.Vector2;
    v.x += (this.pos.x - prevX - v.x) * 0.3;
    v.y += (this.pos.y - prevY - v.y) * 0.3;
    const s = this.gl.w < 1200 ? 0.75 : 1;
    this.mesh.scale.set(this.size.x * s, this.size.y * s, 1);
    this.mesh.position.set(this.pos.x - this.gl.w / 2 + 40, -(this.pos.y - this.gl.h / 2), 0);
    this.mesh.rotation.z = -v.x * 0.004;
  }
}
