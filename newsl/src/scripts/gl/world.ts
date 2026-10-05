import gsap from 'gsap';
import * as THREE from 'three';
import {
  bgFragment,
  bgVertex,
  dustFragment,
  dustVertex,
  heroFragment,
  heroVertex,
  mediaFragment,
  mediaVertex,
} from './shaders';

const CAMERA_Z = 1000;

type MediaKind = 'media' | 'cursor';

interface Media {
  el: HTMLElement;
  kind: MediaKind;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  axis: 'x' | 'y';
  revealed: boolean;
  hover: number;
}

export interface Frame {
  time: number;
  velocity: number; // vitesse Lenis (px / frame)
  audio: number; // 0..1
  scroll: number;
}

/**
 * Scène WebGL unique, plein écran, synchronisée au DOM.
 * 1 unité monde = 1 pixel CSS (caméra perspective calée sur la hauteur).
 */
export class World {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene = new THREE.Scene();
  bgScene = new THREE.Scene();
  bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
  loader = new THREE.TextureLoader();

  bg: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  dust: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  hero?: { el: HTMLElement; mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> };
  medias: Media[] = [];

  width = window.innerWidth;
  height = window.innerHeight;
  mouse = new THREE.Vector2(0, 0); // -1..1
  mouseLerp = new THREE.Vector2(0, 0);
  mousePx = new THREE.Vector2(-9999, -9999);
  mousePxLerp = new THREE.Vector2(-9999, -9999);
  tone = new THREE.Color('#12291f');
  intro = { value: 0 };
  activeCursor = -1;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x070908, 1);
    this.renderer.autoClear = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 10, 4000);
    this.camera.position.z = CAMERA_Z;

    // Fond
    const bgMat = new THREE.ShaderMaterial({
      vertexShader: bgVertex,
      fragmentShader: bgFragment,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(this.width, this.height) },
        uTone: { value: this.tone },
        uAudio: { value: 0 },
        uMouse: { value: this.mouseLerp },
        uIntro: { value: 0 },
      },
    });
    this.bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
    this.bgScene.add(this.bg);

    // Poussière dorée
    const count = window.innerWidth < 768 ? 140 : 320;
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) seeds[i] = Math.random();
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    const dustMat = new THREE.ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uAudio: { value: 0 },
        uPixel: { value: 1 },
        uScroll: { value: 0 },
        uIntro: { value: 0 },
      },
    });
    this.dust = new THREE.Points(dustGeo, dustMat);
    this.dust.frustumCulled = false;
    this.bgScene.add(this.dust);

    this.resize();
  }

  // ----------------------------------------------------------------
  // Construction
  // ----------------------------------------------------------------
  private texture(src: string, onSize: (w: number, h: number) => void): THREE.Texture {
    const tex = this.loader.load(src, (t) => {
      const img = t.image as HTMLImageElement;
      onSize(img.naturalWidth || img.width, img.naturalHeight || img.height);
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }

  addHero(video: HTMLVideoElement) {
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.ShaderMaterial({
      vertexShader: heroVertex,
      fragmentShader: heroFragment,
      transparent: true,
      premultipliedAlpha: true,
      uniforms: {
        uTex: { value: tex },
        uPlane: { value: new THREE.Vector2(1, 1) },
        uImage: { value: new THREE.Vector2(16, 9) },
        uTime: { value: 0 },
        uIntro: { value: 0 },
        uScroll: { value: 0 },
        uAudio: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseForce: { value: 0 },
        uShift: { value: 0 },
      },
    });
    const setSize = () => {
      if (video.videoWidth) mat.uniforms.uImage.value.set(video.videoWidth, video.videoHeight);
    };
    video.addEventListener('loadedmetadata', setSize);
    setSize();
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 1), mat);
    mesh.renderOrder = -1;
    this.scene.add(mesh);
    this.hero = { el: video.parentElement as HTMLElement, mesh };
  }

  addMedia(img: HTMLImageElement, kind: MediaKind = 'media') {
    const src = img.getAttribute('src');
    if (!src) return;
    const mat = new THREE.ShaderMaterial({
      vertexShader: mediaVertex,
      fragmentShader: mediaFragment,
      transparent: true,
      premultipliedAlpha: true,
      depthTest: false,
      uniforms: {
        uTex: { value: null },
        uPlane: { value: new THREE.Vector2(1, 1) },
        uImage: { value: new THREE.Vector2(1, 1) },
        uReveal: { value: kind === 'cursor' ? 1 : 0 },
        uHover: { value: 0 },
        uShift: { value: 0 },
        uTime: { value: 0 },
        uAlpha: { value: kind === 'cursor' ? 0 : 1 },
        uBend: { value: new THREE.Vector2(0, 0) },
      },
    });
    mat.uniforms.uTex.value = this.texture(src, (w, h) => mat.uniforms.uImage.value.set(w, h));
    const mesh = new THREE.Mesh(this.geometry, mat);
    mesh.visible = false;
    this.scene.add(mesh);
    const media: Media = {
      el: kind === 'cursor' ? img.parentElement! : img,
      kind,
      mesh,
      axis: img.closest('[data-hscroll]') ? 'x' : 'y',
      revealed: kind === 'cursor',
      hover: 0,
    };
    this.medias.push(media);

    if (kind === 'media') {
      const host = img.closest('.exp, .maison__fig') as HTMLElement | null;
      host?.addEventListener('mouseenter', () => gsap.to(mat.uniforms.uHover, { value: 1, duration: 1, ease: 'expo.out' }));
      host?.addEventListener('mouseleave', () => gsap.to(mat.uniforms.uHover, { value: 0, duration: 1.2, ease: 'expo.out' }));
    }
  }

  // ----------------------------------------------------------------
  // État
  // ----------------------------------------------------------------
  setTone(hex: string) {
    const c = new THREE.Color(hex);
    gsap.to(this.tone, { r: c.r, g: c.g, b: c.b, duration: 1.8, ease: 'power2.out' });
  }

  setMouse(x: number, y: number) {
    this.mousePx.set(x, y);
    this.mouse.set((x / this.width) * 2 - 1, -(y / this.height) * 2 + 1);
    if (this.mousePxLerp.x < -9000) this.mousePxLerp.copy(this.mousePx);
  }

  /** Vignette du casting qui suit le curseur (-1 = aucune) */
  showCursor(index: number) {
    if (index === this.activeCursor) return;
    const cursors = this.medias.filter((m) => m.kind === 'cursor');
    cursors.forEach((m, i) => {
      const u = m.mesh.material.uniforms;
      if (i === index) {
        gsap.to(u.uAlpha, { value: 1, duration: 0.6, ease: 'power3.out' });
        gsap.fromTo(u.uHover, { value: 1 }, { value: 0, duration: 1.2, ease: 'expo.out' });
        m.mesh.renderOrder = 10;
      } else {
        gsap.to(u.uAlpha, { value: 0, duration: 0.5, ease: 'power3.out' });
        m.mesh.renderOrder = 5;
      }
    });
    this.activeCursor = index;
  }

  playIntro(duration = 2.6) {
    const u = this.hero?.mesh.material.uniforms;
    gsap.to(this.intro, {
      value: 1,
      duration,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.bg.material.uniforms.uIntro.value = this.intro.value;
        this.dust.material.uniforms.uIntro.value = this.intro.value;
        if (u) u.uIntro.value = this.intro.value;
      },
    });
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, this.width < 768 ? 1.5 : 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.fov = (2 * Math.atan(this.height / 2 / CAMERA_Z) * 180) / Math.PI;
    this.camera.updateProjectionMatrix();
    this.bg.material.uniforms.uRes.value.set(this.width, this.height);
    this.dust.material.uniforms.uPixel.value = dpr;
  }

  // ----------------------------------------------------------------
  // Rendu
  // ----------------------------------------------------------------
  private place(mesh: THREE.Mesh, r: DOMRect | { left: number; top: number; width: number; height: number }) {
    mesh.scale.set(r.width, r.height, 1);
    mesh.position.set(r.left + r.width / 2 - this.width / 2, -(r.top + r.height / 2) + this.height / 2, 0);
  }

  render(f: Frame) {
    const { time, velocity, audio } = f;
    this.mouseLerp.lerp(this.mouse, 0.06);
    const prevX = this.mousePxLerp.x;
    const prevY = this.mousePxLerp.y;
    this.mousePxLerp.lerp(this.mousePx, 0.14);
    const mvx = this.mousePxLerp.x - prevX;
    const mvy = this.mousePxLerp.y - prevY;

    const bgU = this.bg.material.uniforms;
    bgU.uTime.value = time;
    bgU.uAudio.value = audio;
    const dU = this.dust.material.uniforms;
    dU.uTime.value = time;
    dU.uAudio.value = audio;
    dU.uScroll.value = f.scroll / this.height * 0.15;

    const shift = THREE.MathUtils.clamp(velocity * 0.0004, -0.012, 0.012);

    // Vidéo
    if (this.hero) {
      const r = this.hero.el.getBoundingClientRect();
      const mesh = this.hero.mesh;
      mesh.visible = r.bottom > 0;
      if (mesh.visible) {
        this.place(mesh, r);
        const u = mesh.material.uniforms;
        u.uPlane.value.set(r.width, r.height);
        u.uTime.value = time;
        u.uAudio.value = audio;
        u.uScroll.value = THREE.MathUtils.clamp(-r.top / r.height, 0, 1);
        u.uShift.value = shift;
        const mx = (this.mousePxLerp.x - r.left) / r.width;
        const my = 1 - (this.mousePxLerp.y - r.top) / r.height;
        u.uMouse.value.set(mx, my);
        const speed = Math.min(Math.hypot(mvx, mvy) / 12, 1);
        u.uMouseForce.value += (speed - u.uMouseForce.value) * 0.08;
      }
    }

    // Images
    for (const m of this.medias) {
      const u = m.mesh.material.uniforms;
      u.uTime.value = time;
      let r: { left: number; top: number; width: number; height: number };
      if (m.kind === 'cursor') {
        const box = m.el.getBoundingClientRect();
        r = { left: this.mousePxLerp.x - box.width / 2, top: this.mousePxLerp.y - box.height / 2, width: box.width, height: box.height };
        m.mesh.visible = u.uAlpha.value > 0.001;
        u.uBend.value.set(THREE.MathUtils.clamp(mvx * 2.2, -60, 60), THREE.MathUtils.clamp(-mvy * 2.2, -60, 60));
        u.uShift.value = THREE.MathUtils.clamp(mvx * 0.0008, -0.01, 0.01);
      } else {
        const box = m.el.getBoundingClientRect();
        r = box;
        const inView = box.bottom > -100 && box.top < this.height + 100 && box.right > -100 && box.left < this.width + 100;
        m.mesh.visible = inView && r.width > 0;
        if (!m.mesh.visible) continue;
        if (!m.revealed && r.top < this.height * 0.92 && r.left < this.width * 0.95) {
          m.revealed = true;
          gsap.to(u.uReveal, { value: 1, duration: 2, ease: 'power3.out' });
        }
        const bend = THREE.MathUtils.clamp(velocity * 1.4, -70, 70);
        // Dans la section horizontale, le défilement vertical devient un mouvement en x
        if (m.axis === 'x') u.uBend.value.set(-bend * (document.dir === 'rtl' ? -1 : 1), 0);
        else u.uBend.value.set(0, -bend);
        u.uShift.value = shift;
      }
      this.place(m.mesh, r);
      u.uPlane.value.set(r.width, r.height);
    }

    const renderer = this.renderer;
    renderer.clear();
    renderer.render(this.bgScene, this.bgCamera);
    renderer.render(this.scene, this.camera);
  }
}
