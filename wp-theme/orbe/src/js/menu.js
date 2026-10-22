// Fullscreen navigation: open / close, focus handling, Escape key.
import { emit } from './core/env.js';
import { startScroll, stopScroll } from './core/scroll.js';

export function initMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!toggle || !nav) return;
  let open = false;
  let closeTimer = 0;

  const set = (value) => {
    if (open === value) return;
    open = value;
    clearTimeout(closeTimer);
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('is-menu-open', open);
    if (open) {
      nav.hidden = false;
      stopScroll();
      requestAnimationFrame(() => {
        nav.classList.add('is-open');
        nav.querySelector('a')?.focus({ preventScroll: true });
      });
    } else {
      nav.classList.remove('is-open');
      startScroll();
      closeTimer = setTimeout(() => (nav.hidden = true), 800);
      toggle.focus({ preventScroll: true });
    }
    emit('menu', { open, nav });
  };

  toggle.addEventListener('click', () => set(!open));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) set(false);
    // Keep the focus inside the open menu.
    if (e.key === 'Tab' && open) {
      const focusables = [toggle, ...nav.querySelectorAll('a, button')];
      const i = focusables.indexOf(document.activeElement);
      const next = e.shiftKey ? i - 1 : i + 1;
      if (next < 0 || next >= focusables.length) {
        e.preventDefault();
        focusables[(next + focusables.length) % focusables.length].focus();
      }
    }
  });
  // Same-page anchors close the menu.
  nav.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="#"]');
    if (link && new URL(link.href).pathname === location.pathname) set(false);
  });
}
