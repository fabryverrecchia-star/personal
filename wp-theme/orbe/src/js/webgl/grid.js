// WebGL project images synced with the DOM: they bend with the scroll velocity,
// tilt in perspective towards the pointer and zoom slightly on hover.
// Each <img> stays in the page and is only hidden once its texture is ready.
import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2 } from 'three';
import { coverUv } from './glsl.js';
import { createRenderer, loadTexture } from './utils.js';

const vertex = /* glsl */ `
  uniform vec2 uSize;
  uniform float uVelocity;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uProgress;
  uniform float uTilt;
  varying vec2 vUv;
  const float PI = 3.141592653589793;

  void main() {
    vUv = uv;
    vec3 p = position * vec3(uSize, 1.0);

    // Entrance: slight rise and scale.
    float hidden = 1.0 - uProgress;
    p.xy *= 1.0 - 0.06 * hidden;
    p.y -= 40.0 * hidden;

    // Scroll bend: the middle of the image lags behind.
    p.y -= sin(uv.x * PI) * uVelocity;

    // Tilt towards the pointer.
    float ay = uMouse.x * uTilt * uHover;
    float ax = -uMouse.y * uTilt * uHover;
    vec3 r = p;
    r.x = p.x * cos(ay) + p.z * sin(ay);
    r.z = -p.x * sin(ay) + p.z * cos(ay);
    p = r;
    r.y = p.y * cos(ax) - p.z * sin(ax);
    r.z = p.y * sin(ax) + p.z * cos(ax);
    p = r;

    // Manual perspective (the camera stays orthographic, in pixels).
    float persp = 1600.0;
    p.xy *= persp / (persp - p.z);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p.xy, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D tMap;
  uniform vec2 uImage;
  uniform vec2 uSize;
  uniform float uHover;
  uniform float uProgress;
  varying vec2 vUv;
  ${coverUv}

  void main() {
    vec2 uv = coverUv(vUv, uSize, uImage);
    float zoom = 1.0 - 0.04 * uHover - 0.08 * (1.0 - uProgress);
    uv = (uv - 0.5) * zoom + 0.5;
    gl_FragColor = vec4(texture2D(tMap, uv).rgb, uProgress);
  }
`;

export function initGrid(options, reduceMotion) {
  const root = document.querySelector('[data-gl-root]');
  const elements = [...document.querySelectorAll('[data-gl]')];
  if (!root || !elements.length) return;

  const renderer = createRenderer(root);
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, -10, 10);
  const geometry = new PlaneGeometry(1, 1, 24, 24);
  const bend = 6 + 24 * options.intensity;
  const tilt = 0.03 + 0.1 * options.intensity;
  const items = [];

  const resize = () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.left = -innerWidth / 2;
    camera.right = innerWidth / 2;
    camera.top = innerHeight / 2;
    camera.bottom = -innerHeight / 2;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  const reveal = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item = items.find((i) => i.el === entry.target);
        if (item) item.progressTarget = 1;
        reveal.unobserve(entry.target);
      }),
    { rootMargin: '0px 0px -5% 0px' },
  );

  elements.forEach((el) => {
    const img = el.querySelector('img');
    if (!img) return; // Placeholders stay in the DOM.
    const url = img.currentSrc || img.src;
    loadTexture(url).then((texture) => {
      if (!texture) return;
      const material = new ShaderMaterial({
        transparent: true,
        depthTest: false,
        uniforms: {
          tMap: { value: texture },
          uImage: { value: new Vector2(texture.image.width, texture.image.height) },
          uSize: { value: new Vector2(1, 1) },
          uVelocity: { value: 0 },
          uMouse: { value: new Vector2() },
          uHover: { value: 0 },
          uProgress: { value: reduceMotion ? 1 : 0 },
          uTilt: { value: tilt },
        },
        vertexShader: vertex,
        fragmentShader: fragment,
      });
      const mesh = new Mesh(geometry, material);
      mesh.frustumCulled = false; // Real size is applied in the shader.
      scene.add(mesh);
      const item = {
        el,
        mesh,
        material,
        hover: 0,
        hoverTarget: 0,
        progress: reduceMotion ? 1 : 0,
        progressTarget: reduceMotion ? 1 : 0,
        mouse: new Vector2(),
        mouseTarget: new Vector2(),
      };
      items.push(item);
      el.classList.add('is-gl');
      reveal.observe(el);

      if (el.dataset.glHover === 'off' || reduceMotion) return;
      const target = el.closest('a') || el;
      target.addEventListener('pointerenter', () => {
        item.hoverTarget = 1;
        mesh.renderOrder = 10;
      });
      target.addEventListener('pointerleave', () => {
        item.hoverTarget = 0;
        item.mouseTarget.set(0, 0);
        mesh.renderOrder = 0;
      });
      target.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        item.mouseTarget.set(
          Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)),
          Math.max(-1, Math.min(1, -(((e.clientY - r.top) / r.height) * 2 - 1))),
        );
      });
    });
  });

  // Scroll velocity: from Lenis when available, from scroll deltas otherwise.
  let lastY = scrollY;
  let velocity = 0;
  const loop = () => {
    const lenisVelocity = window.Orbe.getVelocity();
    const raw = lenisVelocity || scrollY - lastY;
    lastY = scrollY;
    const targetVelocity = reduceMotion ? 0 : Math.max(-bend, Math.min(bend, raw * 0.6));
    velocity += (targetVelocity - velocity) * 0.08;

    const vw = innerWidth;
    const vh = innerHeight;
    for (const item of items) {
      const r = item.el.getBoundingClientRect();
      const visible = r.width > 0 && r.height > 0 && r.top < vh + 200 && r.bottom > -200 && r.left < vw && r.right > 0;
      item.mesh.visible = visible;
      if (!visible) continue;

      item.hover += (item.hoverTarget - item.hover) * 0.06;
      item.progress += (item.progressTarget - item.progress) * 0.05;
      item.mouse.lerp(item.mouseTarget, 0.06);

      const u = item.material.uniforms;
      item.mesh.position.set(r.left + r.width / 2 - vw / 2, vh / 2 - r.top - r.height / 2, 0);
      u.uSize.value.set(r.width, r.height);
      u.uVelocity.value = velocity;
      u.uHover.value = item.hover;
      u.uProgress.value = item.progress;
      u.uMouse.value.copy(item.mouse);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  loop();
}
