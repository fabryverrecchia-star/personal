// First-visit preloader: counts to 100 while fonts load, then slides away.
import { config, reduceMotion, tween, ease } from './core/env.js';

const KEY = 'orbe-preloaded';

export async function runPreloader() {
  const el = document.querySelector('[data-preloader]');
  if (!el) return;
  const done = () => {
    el.classList.add('is-done');
    document.documentElement.classList.add('is-loaded');
  };

  let seen = false;
  try {
    seen = sessionStorage.getItem(KEY) === '1';
    sessionStorage.setItem(KEY, '1');
  } catch {}

  if (!config.preloader || reduceMotion || seen) {
    await document.fonts?.ready;
    return done();
  }

  const count = el.querySelector('[data-preloader-count]');
  await Promise.all([
    tween({
      duration: 1400,
      easing: ease.inOutExpo,
      onUpdate: (v) => count && (count.textContent = String(Math.round(v * 100))),
    }),
    document.fonts?.ready,
  ]);
  el.classList.add('is-leaving');
  await new Promise((r) => setTimeout(r, 900));
  done();
}
