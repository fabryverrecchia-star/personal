// Projects: grid / list switch, remembered per visitor.
import { emit } from './core/env.js';
import { resizeScroll } from './core/scroll.js';

const KEY = 'orbe-work-view';

export function initWork() {
  document.querySelectorAll('[data-work]').forEach((work) => {
    const buttons = work.querySelectorAll('[data-view-btn]');
    if (!buttons.length) return;

    const set = (view, save) => {
      work.dataset.view = view;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewBtn === view)));
      if (save) {
        try {
          localStorage.setItem(KEY, view);
        } catch {}
      }
      resizeScroll();
      emit('layout');
    };

    let saved = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    const allowed = [...buttons].map((b) => b.dataset.viewBtn);
    if (saved && allowed.includes(saved)) set(saved, false);

    buttons.forEach((b) => b.addEventListener('click', () => set(b.dataset.viewBtn, true)));
  });
}
