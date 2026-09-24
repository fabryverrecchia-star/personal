// Images en WebGL : chaque <figure data-gl> est redessinée sur un canvas fixe, calé chaque image sur sa
// position dans la page. Effets : révélation organique, parallaxe, courbure liée à la vitesse de défilement,
// ondulation au survol. <figure data-gl-slides> enchaîne ses images avec une transition liquide.
import { Renderer, Program, Mesh, Plane, Texture, Transform } from 'ogl';

const NOISE = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; } return v; }
vec2 cover(vec2 uv, vec2 plane, vec2 img) {
  float rp = plane.x / plane.y, ri = img.x / img.y;
  vec2 s = rp > ri ? vec2(1.0, ri / rp) : vec2(rp / ri, 1.0);
  return (uv - 0.5) * s + 0.5;
}
`;

const vertex = /* glsl */ `
attribute vec3 position;
attribute vec2 uv;
uniform vec4 uRect;   // x, y, largeur, hauteur en px (y vers le bas)
uniform vec2 uView;
uniform float uVel;   // vitesse de défilement (px / image)
varying vec2 vUv;
void main() {
  vUv = uv;
  vec2 p = vec2(position.x + 0.5, 0.5 - position.y);
  vec2 px = uRect.xy + p * uRect.zw;
  // l'image se courbe légèrement dans le sens du défilement
  px.y -= sin(p.x * 3.14159) * clamp(uVel, -30.0, 30.0) * 0.45;
  gl_Position = vec4(px.x / uView.x * 2.0 - 1.0, 1.0 - px.y / uView.y * 2.0, 0.0, 1.0);
}
`;

const imageFrag = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uImg;
uniform vec4 uRect;
uniform float uReveal;
uniform float uHover;
uniform vec2 uMouse;
uniform float uTime;
uniform float uVel;
uniform float uPar;
uniform float uAlpha;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 uv = vUv;
  // révélation : le bord monte de bas en haut, irrégulier comme un miel qui coule
  float n = fbm(vec2(vUv.x * 3.0, vUv.y * 2.0) + uTime * 0.05);
  float v = (1.0 - vUv.y) * 0.85 + n * 0.3;
  float th = 1.2 - uReveal * 1.4;
  float m = smoothstep(th - 0.04, th + 0.04, v);
  // zoom : légèrement agrandie au repos, arrive de plus près pendant la révélation
  float zoom = 1.12 + (1.0 - uReveal) * 0.25 - uHover * 0.05;
  uv = (uv - 0.5) / zoom + 0.5;
  uv.y += uPar;
  // ondulation au survol autour du pointeur
  float d = distance(vUv, uMouse);
  uv += normalize(vUv - uMouse + 1e-4) * sin(d * 26.0 - uTime * 4.0) * 0.006 * uHover * smoothstep(0.55, 0.0, d);
  vec2 c = cover(uv, uRect.zw, uImg);
  // séparation des couleurs très légère avec la vitesse
  float s = clamp(uVel, -30.0, 30.0) * 0.00008;
  vec3 col = vec3(texture2D(uTex, c + vec2(0.0, s)).r, texture2D(uTex, c).g, texture2D(uTex, c - vec2(0.0, s)).b);
  float a = m * uAlpha;
  gl_FragColor = vec4(col * a, a);
}
`;

const slidesFrag = /* glsl */ `
precision highp float;
uniform sampler2D uA;
uniform sampler2D uB;
uniform vec2 uImgA;
uniform vec2 uImgB;
uniform vec4 uRect;
uniform float uP;      // 0 → image A, 1 → image B
uniform float uReveal;
uniform float uTime;
uniform float uVel;
uniform float uPar;
uniform float uKen;    // lent zoom continu
varying vec2 vUv;
${NOISE}
void main() {
  float n = fbm(vUv * vec2(2.5, 3.5) + vec2(0.0, uTime * 0.06));
  // la nouvelle image monte comme un miel : front ondulé de bas en haut
  float edge = (1.0 - vUv.y) * 0.75 + n * 0.35;
  float th = 1.2 - uP * 1.4;
  float m = smoothstep(th - 0.07, th + 0.07, edge);
  vec2 base = (vUv - 0.5) / (1.08 + uKen * 0.06) + 0.5;
  base.y += uPar;
  vec2 dA = vec2((n - 0.5) * 0.18 * uP, -uP * 0.06);
  vec2 dB = vec2((n - 0.5) * 0.18 * (1.0 - uP), (1.0 - uP) * 0.06);
  vec3 a = texture2D(uA, cover(base + dA, uRect.zw, uImgA)).rgb;
  vec3 b = texture2D(uB, cover((base - 0.5) / (1.0 + (1.0 - uP) * 0.12) + 0.5 + dB, uRect.zw, uImgB)).rgb;
  vec3 col = mix(a, b, m);
  // liseré lumineux sur le front
  col += vec3(1.0, 0.85, 0.55) * (1.0 - abs(m - 0.5) * 2.0) * 0.12 * step(0.01, uP) * step(uP, 0.99);
  // entrée du hero
  float rt = 1.2 - uReveal * 1.4;
  float alpha = smoothstep(rt - 0.05, rt + 0.05, edge);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

export interface GLItem {
  el: HTMLElement;
  reveal: number;
  hover: number;
  alpha: number;
  mouse: [number, number];
  parallax: number;
  mesh: Mesh;
  loaded: boolean;
  slides?: { textures: Texture[]; sizes: [number, number][]; index: number; p: number };
}

export function initGL() {
  const canvas = document.createElement('canvas');
  canvas.className = 'gl-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  let renderer: Renderer;
  try {
    renderer = new Renderer({ canvas, alpha: true, premultipliedAlpha: true, antialias: true, dpr: Math.min(devicePixelRatio, 2) });
    if (!renderer.gl) throw new Error('webgl');
  } catch {
    canvas.remove();
    return null;
  }
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  document.documentElement.classList.add('gl');

  const scene = new Transform();
  const geometry = new Plane(gl, { widthSegments: 24, heightSegments: 24 });
  const view = [innerWidth, innerHeight];
  const resize = () => {
    view[0] = innerWidth;
    view[1] = innerHeight;
    renderer.setSize(innerWidth, innerHeight);
  };
  resize();
  addEventListener('resize', resize);

  const items: GLItem[] = [];
  const state = { vel: 0, time: 0 };

  const loadTexture = (img: HTMLImageElement, onSize: (w: number, h: number) => void) => {
    const tex = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR });
    const apply = () => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        tex.image = im;
        onSize(im.naturalWidth, im.naturalHeight);
      };
      im.src = img.currentSrc || img.src;
    };
    if (img.complete && img.naturalWidth) apply();
    else img.addEventListener('load', apply, { once: true });
    return tex;
  };

  const add = (el: HTMLElement) => {
    const imgs = [...el.querySelectorAll('img')];
    if (!imgs.length) return;
    const isSlides = el.hasAttribute('data-gl-slides');
    const common = {
      uRect: { value: [0, 0, 1, 1] },
      uView: { value: view },
      uVel: { value: 0 },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uPar: { value: 0 },
    };
    let program: Program;
    const item = { el, reveal: 0, hover: 0, alpha: 1, mouse: [0.5, 0.5], parallax: parseFloat(el.dataset.glParallax ?? '0.06') } as GLItem;
    if (isSlides) {
      const sizes: [number, number][] = imgs.map(() => [1, 1]);
      let count = 0;
      const textures = imgs.map((im, i) =>
        loadTexture(im, (w, h) => {
          sizes[i] = [w, h];
          if (++count >= Math.min(2, imgs.length)) item.loaded = true;
        }),
      );
      program = new Program(gl, {
        vertex,
        fragment: slidesFrag,
        transparent: true,
        uniforms: { ...common, uA: { value: textures[0] }, uB: { value: textures[1 % textures.length] }, uImgA: { value: [1, 1] }, uImgB: { value: [1, 1] }, uP: { value: 0 }, uKen: { value: 0 } },
      });
      item.slides = { textures, sizes, index: 0, p: 0 };
    } else {
      const size: [number, number] = [1, 1];
      const tex = loadTexture(imgs[0], (w, h) => {
        size[0] = w;
        size[1] = h;
        item.loaded = true;
      });
      program = new Program(gl, {
        vertex,
        fragment: imageFrag,
        transparent: true,
        uniforms: { ...common, uTex: { value: tex }, uImg: { value: size }, uHover: { value: 0 }, uMouse: { value: [0.5, 0.5] }, uAlpha: { value: 1 } },
      });
    }
    program.depthTest = false;
    item.mesh = new Mesh(gl, { geometry, program });
    item.mesh.setParent(scene);
    items.push(item);

    if (!isSlides && !el.hasAttribute('data-gl-nohover')) {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        item.mouse = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
        item.hover = 1;
      });
      el.addEventListener('pointerleave', () => (item.hover = 0));
    }
    return item;
  };

  document.querySelectorAll<HTMLElement>('[data-gl], [data-gl-slides]').forEach(add);

  // rendu : on recale chaque plan sur son élément
  const hoverVal = new WeakMap<GLItem, number>();
  const tick = () => {
    state.time += 1 / 60;
    for (const it of items) {
      const r = it.el.getBoundingClientRect();
      const visible = it.loaded && r.bottom > -100 && r.top < view[1] + 100 && r.width > 0 && it.alpha > 0.001;
      it.mesh.visible = visible;
      if (!visible) continue;
      const u = it.mesh.program.uniforms;
      u.uRect.value = [r.left, r.top, r.width, r.height];
      u.uVel.value = state.vel;
      u.uTime.value = state.time;
      u.uReveal.value = it.reveal;
      // parallaxe : décalage selon la position de l'image dans l'écran
      u.uPar.value = ((r.top + r.height / 2 - view[1] / 2) / view[1]) * it.parallax;
      if (it.slides) {
        const s = it.slides;
        const n = s.textures.length;
        u.uA.value = s.textures[s.index % n];
        u.uB.value = s.textures[(s.index + 1) % n];
        u.uImgA.value = s.sizes[s.index % n];
        u.uImgB.value = s.sizes[(s.index + 1) % n];
        u.uP.value = s.p;
        u.uKen.value = (Math.sin(state.time * 0.15) + 1) / 2;
      } else {
        const h = (hoverVal.get(it) ?? 0) + (it.hover - (hoverVal.get(it) ?? 0)) * 0.08;
        hoverVal.set(it, h);
        u.uHover.value = h;
        const mv = u.uMouse.value as number[];
        mv[0] += (it.mouse[0] - mv[0]) * 0.1;
        mv[1] += (it.mouse[1] - mv[1]) * 0.1;
        u.uAlpha.value = it.alpha;
      }
    }
    renderer.render({ scene });
  };

  return {
    items,
    get: (el: Element | null) => items.find((i) => i.el === el),
    setVelocity: (v: number) => (state.vel += (Math.max(-60, Math.min(60, v)) - state.vel) * 0.12),
    tick,
  };
}
export type GL = NonNullable<ReturnType<typeof initGL>>;
