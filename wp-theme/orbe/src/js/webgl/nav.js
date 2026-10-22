// WebGL navigation: hovering a menu link reveals its image on a plane that follows
// the pointer. The pointer velocity drives the distortion (wave, RGB shift or liquid),
// and switching links cross-fades the two images through a noise displacement.
import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2 } from 'three';
import { coverUv, simplex3 } from './glsl.js';
import { createRenderer, loadTexture } from './utils.js';

const EFFECTS = { wave: 0, rgb: 1, liquid: 2 };

const vertex = /* glsl */ `
  uniform vec2 uVelocity;
  uniform vec2 uSize;
  uniform float uStrength;
  varying vec2 vUv;
  const float PI = 3.141592653589793;
  void main() {
    vUv = uv;
    vec3 p = position;
    // The plane bends against the direction of travel (velocity in px, plane in units).
    vec2 bend = clamp(uVelocity * 0.6 * uStrength, -60.0, 60.0) / uSize;
    p.x -= sin(uv.y * PI) * bend.x;
    p.y -= sin(uv.x * PI) * bend.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D tPrev;
  uniform sampler2D tNext;
  uniform vec2 uPrevSize;
  uniform vec2 uNextSize;
  uniform vec2 uSize;
  uniform float uMix;
  uniform float uAlpha;
  uniform float uTime;
  uniform vec2 uVelocity;
  uniform float uStrength;
  uniform int uEffect;
  varying vec2 vUv;
  ${simplex3}
  ${coverUv}

  vec4 sampleRgb(sampler2D tex, vec2 uv, vec2 shift) {
    return vec4(
      texture2D(tex, uv + shift).r,
      texture2D(tex, uv).g,
      texture2D(tex, uv - shift).b,
      1.0
    );
  }

  vec4 sampleImage(sampler2D tex, vec2 uv, vec2 size) {
    vec2 st = coverUv(uv, uSize, size);
    vec2 v = uVelocity * 0.0015 * uStrength;
    if (uEffect == 0) {
      st.x += sin(st.y * 12.0 + uTime * 3.0) * length(v) * 0.4;
      st.y += sin(st.x * 10.0 + uTime * 2.0) * length(v) * 0.25;
      return texture2D(tex, st);
    }
    if (uEffect == 1) {
      return sampleRgb(tex, st, v * 0.6);
    }
    float n = snoise(vec3(st * 3.0, uTime * 0.5));
    st += n * (0.01 + length(v) * 0.5);
    return texture2D(tex, st);
  }

  void main() {
    // Noise-driven transition between the previous and the next image.
    float n = snoise(vec3(vUv * 2.5, uTime * 0.3)) * 0.5 + 0.5;
    float edge = smoothstep(uMix - 0.2, uMix + 0.2, n * 0.8 + 0.1);
    vec2 offset = vec2(0.0, (1.0 - uMix) * 0.08 * (1.0 - edge));
    vec4 prev = sampleImage(tPrev, vUv + offset, uPrevSize);
    vec4 next = sampleImage(tNext, vUv - offset, uNextSize);
    vec4 color = mix(next, prev, edge);
    gl_FragColor = vec4(color.rgb, uAlpha);
  }
`;

export function initNav(options, reduceMotion) {
  const container = document.querySelector('[data-nav-gl]');
  const nav = document.querySelector('[data-nav]');
  if (!container || !nav) return;

  const links = [...nav.querySelectorAll('a[data-nav-image]')];
  if (!links.length) return;

  // Preload the menu images when the visitor shows an intent to open the menu.
  const preload = () => links.forEach((l) => loadTexture(l.dataset.navImage));
  document.querySelector('[data-menu-toggle]')?.addEventListener('pointerenter', preload, { once: true });
  document.querySelector('[data-menu-toggle]')?.addEventListener('focus', preload, { once: true });

  const renderer = createRenderer(container);
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, -10, 10);
  const strength = 0.3 + options.intensity * 1.4;

  const material = new ShaderMaterial({
    transparent: true,
    uniforms: {
      tPrev: { value: null },
      tNext: { value: null },
      uPrevSize: { value: new Vector2(1, 1) },
      uNextSize: { value: new Vector2(1, 1) },
      uSize: { value: new Vector2(1, 1) },
      uMix: { value: 1 },
      uAlpha: { value: 0 },
      uTime: { value: 0 },
      uVelocity: { value: new Vector2() },
      uStrength: { value: reduceMotion ? 0 : strength },
      uEffect: { value: EFFECTS[options.effect] ?? 0 },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
  });
  const plane = new Mesh(new PlaneGeometry(1, 1, 32, 32), material);
  plane.visible = false;
  scene.add(plane);

  const state = {
    open: false,
    hover: null,
    pointer: new Vector2(innerWidth * 0.65, innerHeight / 2),
    pos: new Vector2(innerWidth * 0.65, innerHeight / 2),
    velocity: new Vector2(),
    alpha: 0,
    alphaTarget: 0,
    mix: 1,
    raf: 0,
    w: 0,
    h: 0,
  };

  const resize = () => {
    const w = innerWidth;
    const h = innerHeight;
    renderer.setSize(w, h);
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
    state.w = Math.min(w * 0.28, 460);
    state.h = state.w * 1.25;
    plane.scale.set(state.w, state.h, 1);
    material.uniforms.uSize.value.set(state.w, state.h);
  };
  window.addEventListener('resize', resize);
  resize();

  const show = async (link) => {
    state.hover = link;
    const texture = await loadTexture(link.dataset.navImage);
    if (!texture || state.hover !== link) return;
    const u = material.uniforms;
    const size = new Vector2(texture.image.width, texture.image.height);
    if (!u.tNext.value || state.alpha < 0.05) {
      // First image: no transition, just fade in.
      u.tPrev.value = u.tNext.value = texture;
      u.uPrevSize.value.copy(size);
      u.uNextSize.value.copy(size);
      state.mix = 1;
    } else if (u.tNext.value !== texture) {
      u.tPrev.value = u.tNext.value;
      u.uPrevSize.value.copy(u.uNextSize.value);
      u.tNext.value = texture;
      u.uNextSize.value.copy(size);
      state.mix = 0;
    }
    state.alphaTarget = 1;
  };

  links.forEach((link) => {
    link.addEventListener('pointerenter', () => show(link));
    link.addEventListener('focus', () => show(link));
    link.addEventListener('pointerleave', () => {
      state.hover = null;
      state.alphaTarget = 0;
    });
    link.addEventListener('blur', () => (state.alphaTarget = 0));
  });
  nav.addEventListener('pointermove', (e) => state.pointer.set(e.clientX, e.clientY), { passive: true });

  const start = performance.now();
  const loop = () => {
    const prevX = state.pos.x;
    const prevY = state.pos.y;
    state.pos.lerp(state.pointer, reduceMotion ? 1 : 0.1);
    state.velocity.lerp(new Vector2(state.pos.x - prevX, state.pos.y - prevY), 0.2);
    state.alpha += (state.alphaTarget - state.alpha) * 0.12;
    state.mix += (1 - state.mix) * 0.06;

    const u = material.uniforms;
    u.uTime.value = (performance.now() - start) / 1000;
    u.uAlpha.value = state.alpha;
    u.uMix.value = state.mix;
    u.uVelocity.value.set(state.velocity.x, -state.velocity.y);
    plane.visible = state.alpha > 0.01 && !!u.tNext.value;
    // Offset so the image sits beside the cursor and never hides the link under it.
    plane.position.set(state.pos.x - innerWidth / 2 + state.w * 0.15, innerHeight / 2 - state.pos.y, 0);
    plane.rotation.z = Math.max(-0.15, Math.min(0.15, state.velocity.x * -0.002 * strength));

    renderer.render(scene, camera);
    if (state.open || state.alpha > 0.01) state.raf = requestAnimationFrame(loop);
    else state.raf = 0;
  };

  window.Orbe.on('menu', ({ open }) => {
    state.open = open;
    if (open) {
      preload();
      if (!state.raf) loop();
    } else {
      state.alphaTarget = 0;
      state.hover = null;
    }
  });
}
