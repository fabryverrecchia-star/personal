// Orbe — WebGL bundle (Three.js). Loaded only when a WebGL option is enabled.
import { initGrid } from './webgl/grid.js';
import { initHero } from './webgl/hero.js';
import { initNav } from './webgl/nav.js';
import { supportsWebGL } from './webgl/utils.js';

const Orbe = window.Orbe;

if (Orbe && supportsWebGL()) {
  const { config, reduceMotion } = Orbe;
  document.documentElement.classList.add('has-webgl');

  const safely = (name, fn) => {
    try {
      fn();
    } catch (error) {
      // A failing scene must never break the page: the DOM fallback stays visible.
      console.warn(`[Orbe] WebGL ${name} disabled:`, error);
    }
  };

  if (config.hero?.effect && config.hero.effect !== 'none') safely('hero', () => initHero(config.hero, reduceMotion));
  if (config.nav?.style === 'webgl') safely('navigation', () => initNav(config.nav, reduceMotion));
  if (config.work?.webgl) safely('grid', () => initGrid(config.work, reduceMotion));
}
