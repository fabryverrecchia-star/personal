// Shared runtime: configuration from PHP, reduced motion, a tiny event bus.
export const config = window.orbeConfig || {};
export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const bus = new EventTarget();
export const on = (name, fn) => {
  const handler = (e) => fn(e.detail);
  bus.addEventListener(name, handler);
  return () => bus.removeEventListener(name, handler);
};
export const emit = (name, detail) => bus.dispatchEvent(new CustomEvent(name, { detail }));

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// Minimal tween helper (no animation library needed).
export const ease = {
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t) =>
    t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
};

export function tween({ from = 0, to = 1, duration = 1000, easing = ease.outExpo, onUpdate, signal }) {
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now) => {
      if (signal?.aborted) return resolve(false);
      const t = clamp((now - start) / duration, 0, 1);
      onUpdate(lerp(from, to, easing(t)));
      if (t < 1) requestAnimationFrame(step);
      else resolve(true);
    };
    requestAnimationFrame(step);
  });
}
