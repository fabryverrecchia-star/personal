// Composition WebGL du logo SADIK au défilement : les papiers découpés (fond, lettres, fissures)
// partent éparpillés et viennent se poser exactement sur le SVG, qui prend le relais à la fin.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import { LETTERS, LETTER_BASE, PIECES, VIEW, type LetterId, type Piece } from '../brand/sadik';

gsap.registerPlugin(ScrollTrigger);

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform vec2 uRes;
  uniform float uSeed;
  uniform float uAlpha;
  uniform float uReveal;
  uniform float uGrain;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  void main() {
    vec4 c = texture2D(tMap, vUv); // prémultiplié
    // Tracé dévoilé de haut en bas (fissures)
    c *= 1.0 - smoothstep(uReveal - 0.04, uReveal, 1.0 - vUv.y);

    // Grain de papier peint : attaché à la pièce, il bouge avec elle
    vec2 p = vUv * uRes + uSeed * 91.7;
    float fine = hash(floor(p)) - 0.5;
    float fibre = noise(p * vec2(0.02, 0.09)) - 0.5;
    float cloud = noise(p * 0.012) - 0.5;
    c.rgb += (fine * 0.05 + fibre * 0.05 + cloud * 0.06) * uGrain * c.a;

    gl_FragColor = c * uAlpha;
  }
`;

/* ----------------------------------------------------------------- outils */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// Aléatoire déterministe : la même composition à chaque visite
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Suite de Halton : positions de départ bien réparties sur la scène (pas d'amas)
function halton(i: number, base: number) {
  let f = 1, r = 0;
  while (i > 0) {
    f /= base;
    r += f * (i % base);
    i = Math.floor(i / base);
  }
  return r;
}

type Box = { x: number; y: number; w: number; h: number };
type Item = {
  piece: Piece;
  mesh: Mesh;
  program: Program;
  texture: Texture;
  box: Box; // emprise de la pièce, en unités du logo
  window: [number, number]; // début / fin de l'animation dans la progression globale
  rand: number[];
  spot: [number, number]; // position de départ (0–1 sur la scène) des pièces de lettres
  /** Aplat de la lettre, posé dessous une fois ses pièces assemblées (masque les jointures). */
  underlay?: boolean;
};

const ORDER: LetterId[] = ['S', 'A', 'D', 'I', 'K'];

/* ---------------------------------------------------------- rastérisation */
function applyClip(ctx: CanvasRenderingContext2D, d: string, rule?: 'evenodd') {
  ctx.clip(new Path2D(d), rule ?? 'nonzero');
}

/** Emprise réelle d'une pièce (intersection de ses formes), mesurée sur un petit rendu. */
function measure(piece: Piece): Box {
  const q = 0.25;
  const c = document.createElement('canvas');
  c.width = Math.ceil(VIEW.w * q);
  c.height = Math.ceil(VIEW.h * q);
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.setTransform(q, 0, 0, q, 0, 0);
  if (piece.stroke) {
    ctx.lineWidth = piece.stroke.width + 4;
    ctx.stroke(new Path2D(piece.stroke.d));
  } else {
    piece.clips.forEach((s) => applyClip(ctx, s.d, s.rule));
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++)
      if (data[(y * c.width + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  const pad = 3;
  const bx = Math.max(0, x0 / q - pad);
  const by = Math.max(0, y0 / q - pad);
  return { x: bx, y: by, w: Math.min(VIEW.w, (x1 + 1) / q + pad) - bx, h: Math.min(VIEW.h, (y1 + 1) / q + pad) - by };
}

/** Dessine une pièce seule, à la résolution `k` (pixels de texture par unité du logo). */
function paint(piece: Piece, box: Box, k: number) {
  const W = Math.max(2, Math.ceil(box.w * k));
  const H = Math.max(2, Math.ceil(box.h * k));
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const toBox = () => ctx.setTransform(k, 0, 0, k, -box.x * k, -box.y * k);
  toBox();

  if (piece.stroke) {
    ctx.strokeStyle = piece.fill;
    ctx.lineWidth = piece.stroke.width;
    ctx.lineCap = 'round';
    ctx.stroke(new Path2D(piece.stroke.d));
    return c;
  }

  piece.clips.forEach((s) => applyClip(ctx, s.d, s.rule));
  ctx.fillStyle = piece.fill;
  ctx.fillRect(box.x - 1, box.y - 1, box.w + 2, box.h + 2);
  return c;
}

/* ------------------------------------------------------------ composition */
export class SadikComposer {
  private renderer: Renderer;
  private gl: Renderer['gl'];
  private camera: Camera;
  private scene = new Transform();
  private geometry: Plane;
  private items: Item[] = [];
  private k = 0;
  private stageSize = { w: 1, h: 1 };
  private logo = { x: 0, y: 0, s: 1 }; // position (px) et échelle du logo final dans la scène
  private mobile = false;
  private progress = 0;
  private target = 0;
  private visible = true;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private time = 0;
  private intro = 0; // apparition des pièces éparpillées à l'arrivée sur la page
  private cleanups: Array<() => void> = [];

  static create(section: HTMLElement): SadikComposer | null {
    try {
      return new SadikComposer(section);
    } catch {
      return null; // pas de WebGL : le SVG reste affiché
    }
  }

  private constructor(private section: HTMLElement) {
    const stage = section.querySelector<HTMLElement>('[data-sadik-stage]')!;
    const logoEl = section.querySelector<HTMLElement>('[data-sadik-logo]')!;
    const hint = section.querySelector<HTMLElement>('[data-sadik-hint]');

    this.renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: false, antialias: true });
    this.gl = this.renderer.gl;
    if (!this.gl) throw new Error('WebGL indisponible');
    const bg = getComputedStyle(section).getPropertyValue('--sadik-bg').trim() || '#0f110e';
    const rgb = bg.match(/\w\w/g)!.map((h) => parseInt(h, 16) / 255);
    this.gl.clearColor(rgb[0], rgb[1], rgb[2], 1);
    stage.prepend(this.gl.canvas);
    this.camera = new Camera(this.gl, { left: -1, right: 1, top: 1, bottom: -1, near: -10, far: 10 });
    this.geometry = new Plane(this.gl);

    section.classList.add('is-live');

    // Pièces : fond, puis lettres dans l'ordre de lecture, puis fissures
    const r = rng(1662);
    const bgPieces = PIECES.filter((p) => p.kind === 'bg');
    const letterPieces = ORDER.flatMap((l) => PIECES.filter((p) => p.letter === l));
    const lines = PIECES.filter((p) => p.kind === 'line');
    const underlays: Piece[] = ORDER.filter((l) => LETTER_BASE[l]).map((l) => ({
      id: `${l}-base`,
      kind: 'letter',
      letter: l,
      fill: LETTER_BASE[l]!,
      clips: [LETTERS[l]],
    }));
    const sequence = [...bgPieces, ...underlays, ...letterPieces, ...lines];
    const windows = new Map<Piece, [number, number]>();

    sequence.forEach((piece, i) => {
      let window: [number, number];
      const underlay = underlays.includes(piece);
      if (underlay) {
        window = [0, 0]; // calculée plus bas, d'après les pièces de la lettre
      } else if (piece.kind === 'bg') {
        const j = bgPieces.indexOf(piece);
        window = j === 0 ? [0, 0.3] : [0.04 + j * 0.028, 0.4 + j * 0.028];
      } else if (piece.kind === 'letter') {
        const li = ORDER.indexOf(piece.letter!);
        const same = letterPieces.filter((p) => p.letter === piece.letter);
        const j = same.indexOf(piece);
        const start = 0.12 + li * 0.075 + j * 0.035 + r() * 0.03;
        window = [start, Math.min(0.9, start + 0.42)];
      } else {
        const j = lines.indexOf(piece);
        window = [0.88 + j * 0.03, 0.98 + j * 0.02];
      }
      const program = new Program(this.gl, {
        vertex,
        fragment,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          tMap: { value: null },
          uRes: { value: [1, 1] },
          uSeed: { value: r() * 10 },
          uAlpha: { value: 1 },
          uReveal: { value: 1 },
          uGrain: { value: piece.kind === 'letter' ? 1 : 0.5 },
        },
      });
      program.setBlendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
      const mesh = new Mesh(this.gl, { geometry: this.geometry, program });
      mesh.renderOrder = i;
      mesh.frustumCulled = false;
      mesh.setParent(this.scene);
      this.items.push({
        piece,
        mesh,
        program,
        texture: new Texture(this.gl, { generateMipmaps: false, premultiplyAlpha: true }),
        box: measure(piece),
        window,
        rand: Array.from({ length: 8 }, r),
        spot: [halton(letterPieces.indexOf(piece) + 3, 2), halton(letterPieces.indexOf(piece) + 3, 3)],
        underlay,
      });
      windows.set(piece, window);
    });
    // L'aplat d'une lettre apparaît juste avant que sa dernière pièce se pose
    for (const item of this.items.filter((i) => i.underlay)) {
      const end = Math.max(...letterPieces.filter((p) => p.letter === item.piece.letter).map((p) => windows.get(p)![1]));
      item.window = [end - 0.03, end];
    }

    // Mise en page (synchronisée sur l'emplacement CSS du SVG)
    const layout = () => {
      const s = stage.getBoundingClientRect();
      const l = logoEl.getBoundingClientRect();
      this.stageSize = { w: s.width, h: s.height };
      this.logo = { x: l.left - s.left, y: l.top - s.top, s: l.width / VIEW.w };
      this.mobile = s.width < 800 || s.height > s.width;
      this.renderer.setSize(s.width, s.height);
      this.camera.orthographic({ left: 0, right: s.width, top: 0, bottom: -s.height, near: -10, far: 10 });
      // Résolution des textures : de quoi rester net même quand les pièces sont agrandies au départ
      const k = Math.min(this.logo.s * this.renderer.dpr * (this.mobile ? 2.2 : 1.5), 3);
      if (!this.k || Math.abs(k - this.k) / this.k > 0.2) {
        this.k = k;
        this.paintAll();
      }
    };
    const ro = new ResizeObserver(layout);
    ro.observe(stage);
    this.cleanups.push(() => ro.disconnect());
    layout();

    // Progression pilotée par le défilement (la composition se termine à 80 % de la piste)
    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => (this.target = clamp01(self.progress / 0.8)),
      onRefresh: (self) => (this.target = clamp01(self.progress / 0.8)),
    });
    this.cleanups.push(() => st.kill());

    const io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting));
    io.observe(section);
    this.cleanups.push(() => io.disconnect());

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      this.pointer.tx = (e.clientX / innerWidth) * 2 - 1;
      this.pointer.ty = (e.clientY / innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    this.cleanups.push(() => window.removeEventListener('pointermove', onMove));

    const intro = gsap.to(this, { intro: 1, duration: 1.2, delay: 0.2, ease: 'power2.out' });
    this.cleanups.push(() => intro.kill());

    const tick = (t: number) => {
      this.time = t;
      if (!this.visible) return;
      this.progress += (this.target - this.progress) * 0.14;
      if (Math.abs(this.target - this.progress) < 1e-4) this.progress = this.target;
      this.render();
      // Le SVG (net, avec son grain) prend le relais une fois le logo composé
      logoEl.style.opacity = String(clamp01((this.progress - 0.985) / 0.015));
      if (hint) hint.style.opacity = String(1 - clamp01(this.progress / 0.08));
    };
    gsap.ticker.add(tick);
    this.cleanups.push(() => gsap.ticker.remove(tick));
    this.cleanups.push(() => {
      logoEl.style.opacity = '';
      if (hint) hint.style.opacity = '';
    });
  }

  private paintAll() {
    for (const item of this.items) {
      const k = item.piece.kind === 'bg' ? Math.min(this.k, 1) : this.k;
      const kk = Math.min(k, 4096 / Math.max(item.box.w, item.box.h));
      const canvas = paint(item.piece, item.box, kk);
      item.texture.image = canvas;
      item.texture.needsUpdate = true;
      item.program.uniforms.tMap.value = item.texture;
      item.program.uniforms.uRes.value = [item.box.w, item.box.h];
    }
  }

  /** État de départ d'une pièce (px, relatif à sa place finale) selon le format d'écran. */
  private start(item: Item) {
    const { w, h } = this.stageSize;
    const [a, b, c, d, e] = item.rand;
    const { s } = this.logo;
    const cx = this.logo.x + (item.box.x + item.box.w / 2) * s;
    const cy = this.logo.y + (item.box.y + item.box.h / 2) * s;

    if (item.piece.kind === 'bg') {
      // Les papiers du fond glissent depuis le haut ou le bas de l'écran
      const dir = a < 0.5 ? -1 : 1;
      return { dx: (b - 0.5) * w * 0.1, dy: dir * (h * 0.6 + c * h * 0.3), rot: (d - 0.5) * 0.25, scale: 1 };
    }
    if (item.piece.kind === 'line') return { dx: 0, dy: 0, rot: 0, scale: 1 };

    // Lettres : éparpillées sur toute la scène (en hauteur sur mobile), tournées et agrandies
    const mx = this.mobile ? 0.14 : 0.1;
    const my = this.mobile ? 0.12 : 0.16;
    const [sx, sy] = item.spot;
    const tx = w * (mx + sx * (1 - 2 * mx)) + (a - 0.5) * w * 0.04;
    const ty = h * (my + sy * (1 - 2 * my)) + (b - 0.5) * h * 0.04;
    const scale = this.mobile ? 1.5 + c * 1.1 : 0.7 + c * 0.6;
    return { dx: tx - cx, dy: ty - cy, rot: (d - 0.5) * 1.8, scale: lerp(scale, 1, e * 0.3) };
  }

  private render() {
    const { s } = this.logo;
    const p = this.progress;
    this.pointer.x += (this.pointer.tx - this.pointer.x) * 0.05;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * 0.05;

    for (const item of this.items) {
      const [a0, a1] = item.window;
      const t = clamp01((p - a0) / (a1 - a0));
      const kind = item.piece.kind;
      const e = kind === 'bg' ? easeOut(t) : easeInOut(t);
      const from = this.start(item);
      const free = 1 - e;

      // Dérive lente tant que la pièce n'est pas posée, et léger parallaxe au pointeur
      const [, , , , , f, g, depth] = item.rand;
      const drift = kind === 'letter' ? free : 0;
      const wob = Math.sin(this.time * (0.5 + f * 0.6) + g * 6.28);
      const par = (0.4 + depth) * 30 * drift;

      const w = item.box.w * s;
      const h = item.box.h * s;
      const cx = this.logo.x + (item.box.x + item.box.w / 2) * s + from.dx * free + wob * 8 * drift + this.pointer.x * par;
      const cy = this.logo.y + (item.box.y + item.box.h / 2) * s + from.dy * free + Math.cos(this.time * 0.7 + f * 9) * 8 * drift + this.pointer.y * par;
      const scale = lerp(from.scale, 1, e);

      item.mesh.position.set(cx, -cy, 0);
      item.mesh.rotation.z = from.rot * free + wob * 0.04 * drift;
      item.mesh.scale.set(w * scale, h * scale, 1);

      const u = item.program.uniforms;
      if (item.underlay) {
        item.mesh.position.set(this.logo.x + (item.box.x + item.box.w / 2) * s, -(this.logo.y + (item.box.y + item.box.h / 2) * s), 0);
        item.mesh.rotation.z = 0;
        item.mesh.scale.set(w, h, 1);
        u.uAlpha.value = t;
      } else if (kind === 'line') {
        u.uReveal.value = lerp(-0.05, 1.05, t);
      } else if (kind === 'bg') {
        u.uAlpha.value = clamp01(t * 2.5);
      } else {
        u.uAlpha.value = this.intro;
      }
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
  }

  dispose() {
    this.cleanups.forEach((fn) => fn());
    this.items.forEach((i) => {
      i.program.remove();
      this.gl.deleteTexture(i.texture.texture);
    });
    this.geometry.remove();
    this.gl.canvas.remove();
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.section.classList.remove('is-live');
  }
}
