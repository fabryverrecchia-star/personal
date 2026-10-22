// Smooth scrolling with Lenis; exposes the scroll velocity to the WebGL layer.
import Lenis from 'lenis';
import { config, reduceMotion } from './env.js';

let lenis = null;

export function initScroll() {
  if (!config.smoothScroll || reduceMotion) return null;
  lenis = new Lenis({ lerp: 0.1, autoRaf: true });
  document.documentElement.classList.add('has-smooth-scroll');
  return lenis;
}

export const getVelocity = () => (lenis ? lenis.velocity : 0);
export const stopScroll = () => lenis?.stop();
export const startScroll = () => lenis?.start();
export const resizeScroll = () => lenis?.resize();

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 1.6 });
  else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}
