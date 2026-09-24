// Miel qui coule du haut de l'écran : champ de distance (bande + coulures + gouttes) éclairé en 2D.
// Le pointeur attire le miel, le défilement allonge les coulures.
import { Renderer, Program, Mesh, Triangle } from 'ogl';

const vertex = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = (drips: number) => /* glsl */ `
precision highp float;
#define N ${drips}
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uHover;
uniform float uScroll;
uniform float uIntro;
varying vec2 vUv;

float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float noise(float x) { float i = floor(x), f = fract(x); return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f)); }
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
// capsule effilée : rayon ra en haut, rb en bas
float sdTaper(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - mix(ra, rb, h);
}

float band(float x) {
  return 1.0 - (0.055 + 0.03 * noise(x * 2.6 + uTime * 0.12) + 0.012 * sin(x * 9.0 + uTime * 0.5)) * uIntro - uScroll * 0.06;
}

float scene(vec2 p, float aspect) {
  float top = band(p.x);
  float d = top - p.y;
  for (int i = 0; i < N; i++) {
    float fi = float(i);
    float x = (fi + 0.5) / float(N) * aspect + (hash(fi * 7.1) - 0.5) * aspect / float(N) * 0.7;
    float speed = 0.035 + hash(fi * 3.7) * 0.05;
    float t = fract(uTime * speed + hash(fi * 1.3));
    float maxLen = 0.08 + hash(fi * 5.3) * 0.34;
    float grow = smoothstep(0.0, 0.78, t);
    float release = smoothstep(0.78, 0.9, t);
    float len = (maxLen * mix(grow, 0.45, release)) * uIntro + uScroll * (0.15 + hash(fi * 2.9) * 0.55);
    float r = 0.01 + hash(fi * 9.1) * 0.016;
    vec2 a = vec2(x, band(x) + 0.01);
    vec2 b = vec2(x + sin(uTime * 0.3 + fi) * 0.004, a.y - len);
    float c = sdTaper(p, a, b, r * 1.25, r * 0.55);
    float bulb = length(p - b + vec2(0.0, r * 0.4)) - r * (1.25 + 0.35 * grow);
    c = smin(c, bulb, 0.02);
    // goutte qui se détache
    float ft = clamp((t - 0.78) / 0.22, 0.0, 1.0);
    vec2 dp = vec2(b.x, a.y - maxLen - ft * ft * 1.4);
    float drop = length((p - dp) * vec2(1.0, 0.8 + 0.2 * ft)) - r * 1.3 * step(0.001, ft) * (1.0 - ft * 0.3);
    c = min(c, mix(1.0, drop, step(0.001, ft)) );
    d = smin(d, c, 0.045);
  }
  // le pointeur attire une goutte de miel
  vec2 m = vec2(uMouse.x * aspect, uMouse.y);
  float near = smoothstep(0.55, 0.0, abs(m.y - band(m.x)));
  float blob = sdTaper(p, vec2(m.x, band(m.x)), m + vec2(0.0, 0.02), 0.03 * uHover, 0.045 * uHover) ;
  d = smin(d, mix(1.0, blob, uHover * (0.25 + 0.75 * near)), 0.09);
  return d;
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(vUv.x * aspect, vUv.y);
  float px = 1.5 / uRes.y;
  float e = 0.004;
  float d = scene(p, aspect);
  if (d > px * 2.0) { gl_FragColor = vec4(0.0); return; }
  float dx = scene(p + vec2(e, 0.0), aspect);
  float dy = scene(p + vec2(0.0, e), aspect);

  // relief : épaisseur ~ sqrt de la profondeur
  float depth = 0.05;
  float h = sqrt(clamp(-d / depth, 0.0, 1.0));
  float hx = sqrt(clamp(-dx / depth, 0.0, 1.0));
  float hy = sqrt(clamp(-dy / depth, 0.0, 1.0));
  vec3 n = normalize(vec3((h - hx) * 1.4, (h - hy) * 1.4, e * 18.0));

  vec3 L = normalize(vec3(-0.45, 0.7, 0.9));
  vec3 V = vec3(0.0, 0.0, 1.0);
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-L, n), V), 0.0, 1.0), 38.0);
  float spec2 = pow(clamp(dot(reflect(-normalize(vec3(0.6, -0.2, 1.0)), n), V), 0.0, 1.0), 12.0);

  vec3 deep = vec3(0.50, 0.24, 0.05);
  vec3 honey = vec3(0.84, 0.54, 0.16);
  vec3 light = vec3(0.98, 0.80, 0.42);
  float thick = smoothstep(0.0, 1.0, h);
  vec3 col = mix(light, honey, smoothstep(0.0, 0.5, thick));
  col = mix(col, deep, smoothstep(0.55, 1.0, thick) * 0.55 + (1.0 - vUv.y) * 0.1);
  // lumière traversante (sous-surface) sur les bords fins
  col += vec3(1.0, 0.72, 0.3) * (1.0 - thick) * 0.25;
  col *= 0.78 + 0.32 * diff;
  col += vec3(1.0, 0.97, 0.9) * spec * 0.95 + vec3(1.0, 0.85, 0.55) * spec2 * 0.18;

  float alpha = smoothstep(px, -px, d);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

export function initHoney(canvas: HTMLCanvasElement) {
  let renderer: Renderer;
  try {
    renderer = new Renderer({
      canvas,
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio, 1.6),
    });
  } catch {
    document.documentElement.classList.add('no-webgl');
    return null;
  }
  const gl = renderer.gl;
  if (!gl) {
    document.documentElement.classList.add('no-webgl');
    return null;
  }
  gl.clearColor(0, 0, 0, 0);

  const mobile = window.matchMedia('(max-width: 700px)').matches;
  const program = new Program(gl, {
    vertex,
    fragment: fragment(mobile ? 6 : 12),
    uniforms: {
      uTime: { value: 0 },
      uRes: { value: [1, 1] },
      uMouse: { value: [0.5, 0.9] },
      uHover: { value: 0 },
      uScroll: { value: 0 },
      uIntro: { value: 0 },
    },
    transparent: true,
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  const state = { mx: 0.5, my: 0.9, hover: 0, scroll: 0, intro: 0, visible: true };
  const u = program.uniforms;

  const section = canvas.parentElement!;
  // on mesure la section : le canvas reçoit une taille en ligne de la part d'OGL
  const resize = () => {
    const r = { width: section.clientWidth, height: section.clientHeight };
    renderer.setSize(r.width, r.height);
    u.uRes.value = [r.width, r.height];
  };
  resize();
  new ResizeObserver(resize).observe(section);

  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    state.mx = (e.clientX - r.left) / r.width;
    state.my = 1 - (e.clientY - r.top) / r.height;
    state.hover = 1;
  };
  section.addEventListener('pointermove', onMove);
  section.addEventListener('pointerdown', onMove);
  section.addEventListener('pointerleave', () => (state.hover = 0));
  section.addEventListener('pointercancel', () => (state.hover = 0));
  section.addEventListener('pointerup', (e) => e.pointerType !== 'mouse' && (state.hover = 0));

  new IntersectionObserver(([en]) => (state.visible = en.isIntersecting)).observe(canvas);

  const mouse = u.uMouse.value as number[];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = 0;
  let last = performance.now();
  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (state.visible) {
      if (!reduced) t += dt;
      mouse[0] += (state.mx - mouse[0]) * 0.08;
      mouse[1] += (state.my - mouse[1]) * 0.08;
      u.uHover.value += (state.hover - u.uHover.value) * 0.05;
      u.uScroll.value += (state.scroll - u.uScroll.value) * 0.12;
      u.uIntro.value = state.intro;
      u.uTime.value = t;
      renderer.render({ scene: mesh });
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return state;
}
