// Scroll reveals: elements with [data-reveal] get .is-in when they enter the viewport.
// "lines" reveals are split into masked lines; "media" reveals use a clip-path wipe (CSS).
import { reduceMotion } from './core/env.js';

function splitLines(el) {
  // Wrap words, measure their offsetTop, then group them into masked lines.
  const text = el.innerHTML;
  const tmp = document.createElement('div');
  tmp.innerHTML = text;
  const words = [];
  const walk = (node, wrappers) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) words.push({ space: true });
          else words.push({ html: wrappers.reduce((acc, w) => `<${w}>${acc}</${w}>`, part) });
        });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName === 'BR') words.push({ br: true });
        else walk(child, [child.tagName.toLowerCase(), ...wrappers]);
      }
    });
  };
  walk(tmp, []);
  el.innerHTML = words
    .map((w) => (w.space ? ' ' : w.br ? '<br>' : `<span class="w">${w.html}</span>`))
    .join('');
  const lines = [];
  let top = null;
  el.querySelectorAll('.w').forEach((w) => {
    if (w.offsetTop !== top) {
      top = w.offsetTop;
      lines.push([]);
    }
    lines[lines.length - 1].push(w.innerHTML);
  });
  el.innerHTML = lines
    .map((l, i) => `<span class="line"><span class="line__inner" style="--i:${i}">${l.join(' ')}</span></span>`)
    .join('');
  el.dataset.original = text;
}

export function initReveals() {
  const els = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  document.documentElement.classList.add('has-reveals');

  let batch = 0;
  let batchTimer = 0;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);
        // Elements entering together are slightly staggered.
        el.style.setProperty('--delay', `${Math.min(batch++, 8) * 80}ms`);
        clearTimeout(batchTimer);
        batchTimer = setTimeout(() => (batch = 0), 100);
        el.classList.add('is-in');
        if (el.dataset.reveal === 'lines') {
          // Restore the original markup after the animation so text reflows on resize.
          setTimeout(() => {
            if (el.dataset.original !== undefined) el.innerHTML = el.dataset.original;
          }, 2000);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px' },
  );

  els.forEach((el) => {
    if (el.dataset.reveal === 'lines') splitLines(el);
    io.observe(el);
  });
}
