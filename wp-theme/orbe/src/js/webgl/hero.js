// Front page hero scenes: liquid blob, particle sphere, flowing gradient.
// Each scene reacts to the mouse (optional) and pauses when the hero is off screen.
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  IcosahedronGeometry,
  Mesh,
  NormalBlending,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
} from 'three';
import { simplex3 } from './glsl.js';
import { createRenderer, cssColor, whenVisible } from './utils.js';

/* ------------------------------------------------------------------ blob */

function blobScene({ colorA, colorB, intensity }) {
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 6;

  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAmp: { value: 0.15 + 0.45 * intensity },
      uMouse: { value: new Vector2() },
      uColorA: { value: new Color(colorA) },
      uColorB: { value: new Color(colorB) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uAmp;
      uniform vec2 uMouse;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vNoise;
      ${simplex3}
      void main() {
        vec3 p = position;
        float n = snoise(p * 1.2 + vec3(uTime * 0.25, uMouse * 0.6));
        float n2 = snoise(p * 3.0 - uTime * 0.15) * 0.25;
        float d = (n + n2) * uAmp;
        p += normal * d;
        vNoise = d;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vNoise;
      void main() {
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), vView), 0.0), 2.0);
        vec3 color = mix(uColorA, uColorB, smoothstep(-0.3, 0.4, vNoise + vNormal.y * 0.3));
        color += fresnel * 0.35;
        float light = 0.75 + 0.25 * dot(normalize(vNormal), normalize(vec3(0.4, 0.8, 0.6)));
        gl_FragColor = vec4(color * light, 1.0);
      }
    `,
  });

  const mesh = new Mesh(new IcosahedronGeometry(1.35, 48), material);
  scene.add(mesh);

  return {
    scene,
    camera,
    resize(w, h) {
      camera.aspect = w / h;
      // Keep the blob on the right on wide screens, centered on phones.
      const wide = w > 900;
      mesh.position.x = wide ? 1.4 : 0;
      mesh.position.y = wide ? 0 : 0.9;
      // Portrait screens: shrink with the aspect ratio so the blob stays inside.
      mesh.scale.setScalar(wide ? 1 : Math.min(0.8, Math.max(0.45, (w / h) * 1.05)));
      camera.updateProjectionMatrix();
    },
    update(t, mouse) {
      material.uniforms.uTime.value = t;
      material.uniforms.uMouse.value.lerp(mouse, 0.05);
      mesh.rotation.y = t * 0.08 + material.uniforms.uMouse.value.x * 0.4;
      mesh.rotation.x = -material.uniforms.uMouse.value.y * 0.3;
    },
  };
}

/* ------------------------------------------------------------- particles */

function particlesScene({ colorA, colorB, intensity }) {
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 7;

  const count = window.innerWidth < 700 ? 4000 : 9000;
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count);
  // Fibonacci sphere: even distribution of points.
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    positions[i * 3] = Math.cos(theta) * r * 1.8;
    positions[i * 3 + 1] = y * 1.8;
    positions[i * 3 + 2] = Math.sin(theta) * r * 1.8;
    randoms[i] = Math.random();
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aRandom', new BufferAttribute(randoms, 1));

  const dark = cssColor('--bg', '#efede8').getHSL({ h: 0, s: 0, l: 0 }).l < 0.4;
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: dark ? AdditiveBlending : NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uAmp: { value: 0.2 + 0.8 * intensity },
      uMouse: { value: new Vector2() },
      uPixel: { value: Math.min(window.devicePixelRatio, 2) },
      uColorA: { value: new Color(colorA) },
      uColorB: { value: new Color(colorB) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uAmp;
      uniform vec2 uMouse;
      uniform float uPixel;
      attribute float aRandom;
      varying float vMix;
      varying float vAlpha;
      ${simplex3}
      void main() {
        vec3 p = position;
        float n = snoise(p * 0.8 + uTime * 0.2);
        p += normalize(p) * n * 0.35 * uAmp;
        // Mouse "pushes" the facing points outwards.
        vec3 m = vec3(uMouse * 1.8, 1.6);
        float d = distance(normalize(p) * 1.8, m);
        p += normalize(p) * smoothstep(1.6, 0.0, d) * 0.6 * uAmp;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (2.0 + aRandom * 3.0) * uPixel * (5.0 / -mv.z);
        vMix = n * 0.5 + 0.5;
        // Points on the far side of the sphere fade out.
        vAlpha = 0.25 + 0.75 * smoothstep(-9.0, -5.0, mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vMix;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.1, d) * vAlpha;
        gl_FragColor = vec4(mix(uColorA, uColorB, vMix), a);
      }
    `,
  });

  const points = new Points(geometry, material);
  scene.add(points);

  return {
    scene,
    camera,
    resize(w, h) {
      camera.aspect = w / h;
      const wide = w > 900;
      points.position.x = wide ? 1.6 : 0;
      points.position.y = wide ? 0 : 0.9;
      points.scale.setScalar(wide ? 1 : Math.min(0.75, Math.max(0.4, w / h)));
      camera.updateProjectionMatrix();
    },
    update(t, mouse) {
      material.uniforms.uTime.value = t;
      material.uniforms.uMouse.value.lerp(mouse, 0.06);
      points.rotation.y = t * 0.05;
      points.rotation.x = Math.sin(t * 0.1) * 0.1;
    },
  };
}

/* -------------------------------------------------------------- gradient */

function gradientScene({ colorA, colorB, intensity }) {
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAmp: { value: 0.3 + 0.7 * intensity },
      uMouse: { value: new Vector2() },
      uAspect: { value: 1 },
      uColorA: { value: new Color(colorA) },
      uColorB: { value: new Color(colorB) },
      uColorBg: { value: cssColor('--bg', '#efede8') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uAmp;
      uniform vec2 uMouse;
      uniform float uAspect;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorBg;
      varying vec2 vUv;
      ${simplex3}
      void main() {
        vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
        vec2 m = uMouse * 0.5 * vec2(uAspect, 1.0);
        float t = uTime * 0.08;
        // Domain warping: noise of noise for a liquid, silky flow.
        vec2 q = vec2(snoise(vec3(p * 1.2, t)), snoise(vec3(p * 1.2 + 4.0, t)));
        q += (m - p) * 0.35 * smoothstep(0.8, 0.0, length(p - m));
        float n = snoise(vec3(p * 1.4 + q * uAmp, t * 1.5));
        vec3 color = mix(uColorBg, uColorA, smoothstep(-0.2, 0.7, n));
        color = mix(color, uColorB, smoothstep(0.1, 0.9, snoise(vec3(p * 0.9 - q * 0.5, t + 10.0))));
        // Film grain.
        float grain = fract(sin(dot(vUv * 1000.0 + uTime, vec2(12.9898, 78.233))) * 43758.5453);
        color += (grain - 0.5) * 0.04;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  scene.add(new Mesh(new PlaneGeometry(2, 2), material));
  return {
    scene,
    camera,
    resize(w, h) {
      material.uniforms.uAspect.value = w / h;
    },
    update(t, mouse) {
      material.uniforms.uTime.value = t;
      material.uniforms.uMouse.value.lerp(mouse, 0.04);
    },
  };
}

/* ----------------------------------------------------------------- setup */

const SCENES = { blob: blobScene, particles: particlesScene, gradient: gradientScene };

export function initHero(options, reduceMotion) {
  const container = document.querySelector('[data-hero-gl]');
  const factory = SCENES[options.effect];
  if (!container || !factory) return;

  const renderer = createRenderer(container);
  const scene = factory(options);
  const mouse = new Vector2();
  let running = false;
  let raf = 0;
  const start = performance.now();

  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height, false);
    scene.resize(width, height);
    if (!running) render();
  };
  const render = () => {
    // Reduced motion: a single still frame.
    const t = reduceMotion ? 12 : (performance.now() - start) / 1000;
    scene.update(t, mouse);
    renderer.render(scene.scene, scene.camera);
  };
  const loop = () => {
    render();
    raf = requestAnimationFrame(loop);
  };

  if (options.mouse && !reduceMotion) {
    window.addEventListener(
      'pointermove',
      (e) => mouse.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1)),
      { passive: true },
    );
  }
  new ResizeObserver(resize).observe(container);
  resize();
  container.classList.add('is-ready');

  if (reduceMotion) return;
  whenVisible(container, (visible) => {
    if (visible && !running) {
      running = true;
      loop();
    } else if (!visible && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  });
}
