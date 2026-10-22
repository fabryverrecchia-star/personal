// Custom cursor: follows the pointer, grows over links, shows a label from data-cursor.
import { config, finePointer, reduceMotion, lerp } from './core/env.js';

export function initCursor() {
  const el = document.querySelector('[data-cursor-el]');
  if (!el || !config.cursor || !finePointer || reduceMotion) {
    el?.remove();
    document.body.classList.remove('orbe-has-cursor');
    return;
  }
  const label = el.querySelector('[data-cursor-label]');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const target = { ...pos };

  window.addEventListener('pointermove', (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
    el.classList.add('is-visible');
  }, { passive: true });
  document.addEventListener('pointerleave', () => el.classList.remove('is-visible'));

  document.addEventListener('pointerover', (e) => {
    const hit = e.target.closest('a, button, [data-cursor]');
    const text = hit?.closest('[data-cursor]')?.dataset.cursor || '';
    el.classList.toggle('is-hover', !!hit);
    el.classList.toggle('has-label', !!text);
    label.textContent = text;
  });

  const loop = () => {
    pos.x = lerp(pos.x, target.x, 0.2);
    pos.y = lerp(pos.y, target.y, 0.2);
    el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
}
