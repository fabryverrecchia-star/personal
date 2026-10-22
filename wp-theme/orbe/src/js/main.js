// Orbe — main bundle (no WebGL). The WebGL bundle hooks into window.Orbe.
import { config, reduceMotion, on, emit } from './core/env.js';
import { initScroll, getVelocity, scrollToTop } from './core/scroll.js';
import { runPreloader } from './preloader.js';
import { initTransitions } from './transitions.js';
import { initMenu } from './menu.js';
import { initCursor } from './cursor.js';
import { initReveals } from './reveals.js';
import { initWork } from './work.js';

window.Orbe = { config, reduceMotion, on, emit, getVelocity };

document.documentElement.classList.add('js');
initScroll();
initMenu();
initCursor();
initWork();
initTransitions();
document.querySelectorAll('[data-scroll-top]').forEach((b) => b.addEventListener('click', scrollToTop));

runPreloader().then(() => {
  initReveals();
  emit('ready');
  window.Orbe.ready = true;
});
