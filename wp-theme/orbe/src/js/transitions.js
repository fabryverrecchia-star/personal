// Page transitions: a curtain covers the page before navigating to an internal link,
// and is lifted when the next page loads.
import { config, reduceMotion } from './core/env.js';
import { stopScroll } from './core/scroll.js';

const DURATION = 700;

function isInternal(link, event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (link.target && link.target !== '_self') return false;
  if (link.hasAttribute('download') || link.dataset.noTransition !== undefined) return false;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return false;
  if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
  // Never intercept admin, login, feeds or files.
  if (/\/wp-(admin|login)|\/feed\/?$|\.(pdf|zip|jpe?g|png|gif|webp|svg|mp4)$/i.test(url.pathname)) return false;
  return url;
}

export function initTransitions() {
  const curtain = document.querySelector('[data-curtain]');
  if (!curtain || !config.transitions || reduceMotion) return;

  // Coming back from the bfcache: never leave the curtain down.
  window.addEventListener('pageshow', () => curtain.classList.remove('is-covering'));

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = isInternal(link, event);
    if (!url) return;
    event.preventDefault();
    stopScroll();
    document.dispatchEvent(new CustomEvent('orbe:leave', { detail: { url, link } }));
    // Start from scaleY(0) so the transition runs, then cover.
    curtain.style.transform = 'scaleY(0)';
    curtain.classList.add('is-covering');
    curtain.getBoundingClientRect();
    curtain.style.transform = '';
    setTimeout(() => (location.href = url.href), DURATION);
  });
}
