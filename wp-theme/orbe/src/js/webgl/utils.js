import { Color, ColorManagement, NoColorSpace, TextureLoader, WebGLRenderer } from 'three';

// All scenes use custom shaders that output colors as authored (sRGB hex values from
// the Customizer), so a scene background matches the page background exactly.
ColorManagement.enabled = false;

export function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

export function createRenderer(container, { antialias = true } = {}) {
  const renderer = new WebGLRenderer({ alpha: true, antialias, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  return renderer;
}

export const cssColor = (name, fallback) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new Color(value || fallback);
};

const loader = new TextureLoader();
loader.setCrossOrigin('anonymous');
const cache = new Map();

/** Load a texture once per URL. Resolves to null on failure (the DOM image stays visible). */
export function loadTexture(url) {
  if (!url) return Promise.resolve(null);
  if (!cache.has(url)) {
    cache.set(
      url,
      new Promise((resolve) => {
        loader.load(
          url,
          (texture) => {
            // Custom shaders write the sampled color as is: keep the file's values untouched.
            texture.colorSpace = NoColorSpace;
            texture.generateMipmaps = false;
            resolve(texture);
          },
          undefined,
          () => resolve(null),
        );
      }),
    );
  }
  return cache.get(url);
}

/** Pause rendering while an element is off screen. */
export function whenVisible(el, cb) {
  if (!('IntersectionObserver' in window)) return cb(true);
  const io = new IntersectionObserver(([entry]) => cb(entry.isIntersecting));
  io.observe(el);
  return () => io.disconnect();
}
