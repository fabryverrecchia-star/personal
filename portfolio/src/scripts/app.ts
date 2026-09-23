import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(Flip, ScrollTrigger, SplitText);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'expo.out';
const EASE_IN_OUT = 'expo.inOut';

/* ------------------------------------------------------------------------ */
/* Défilement fluide (Lenis) synchronisé avec le ticker GSAP                 */
/* ------------------------------------------------------------------------ */
let lenis: Lenis | null = null;
if (!reduceMotion) {
  lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ------------------------------------------------------------------------ */
/* Nettoyage entre les pages                                                */
/* ------------------------------------------------------------------------ */
const cleanups: Array<() => void> = [];
function onCleanup(fn: () => void) {
  cleanups.push(fn);
}
function cleanupPage() {
  while (cleanups.length) cleanups.pop()!();
  ScrollTrigger.getAll().forEach((st) => st.kill());
}

/* ------------------------------------------------------------------------ */
/* Loader (premier chargement uniquement)                                   */
/* ------------------------------------------------------------------------ */
async function runLoader() {
  const loader = document.querySelector<HTMLElement>('[data-loader]');
  if (!loader || loader.classList.contains('is-done')) return;
  const count = loader.querySelector<HTMLElement>('[data-loader-count]');
  const done = () => loader.classList.add('is-done');

  if (reduceMotion) {
    await document.fonts.ready;
    return done();
  }

  lenis?.stop();
  const counter = { v: 0 };
  const fonts = document.fonts.ready;
  await gsap.to(counter, {
    v: 100,
    duration: 1.4,
    ease: 'power2.inOut',
    onUpdate: () => {
      if (count) count.textContent = String(Math.round(counter.v));
    },
  });
  await fonts;
  await gsap.to(loader, { yPercent: -100, duration: 1, ease: EASE_IN_OUT });
  done();
  lenis?.start();
}

/* ------------------------------------------------------------------------ */
/* Transition de page (rideau)                                              */
/* ------------------------------------------------------------------------ */
const curtain = () => document.querySelector<HTMLElement>('[data-curtain]');

document.addEventListener('astro:before-preparation', (event) => {
  if (reduceMotion) return;
  const load = event.loader;
  event.loader = async () => {
    lenis?.stop();
    await Promise.all([
      gsap.fromTo(
        curtain(),
        { scaleY: 0, transformOrigin: 'bottom' },
        { scaleY: 1, duration: 0.7, ease: EASE_IN_OUT },
      ),
      load(),
    ]);
  };
});

document.addEventListener('astro:before-swap', cleanupPage);

document.addEventListener('astro:after-swap', () => {
  lenis?.scrollTo(0, { immediate: true, force: true });
  lenis?.resize();
});

async function curtainOut() {
  const el = curtain();
  if (!el || gsap.getProperty(el, 'scaleY') === 0) return;
  await gsap.to(el, { scaleY: 0, transformOrigin: 'top', duration: 0.7, ease: EASE_IN_OUT });
  lenis?.start();
}

/* ------------------------------------------------------------------------ */
/* Révélations (texte en lignes, éléments, médias)                           */
/* ------------------------------------------------------------------------ */
type Reveal = { el: HTMLElement; play: () => void };

function prepareReveals(): Reveal[] {
  if (reduceMotion) return [];
  const reveals: Reveal[] = [];

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const type = el.dataset.reveal;

    if (type === 'lines') {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
      gsap.set(split.lines, { yPercent: 110 });
      onCleanup(() => split.revert());
      reveals.push({
        el,
        play: () =>
          gsap.to(split.lines, {
            yPercent: 0,
            duration: 1.2,
            stagger: 0.08,
            ease: EASE,
            // Une fois révélé, on retire le découpage pour que le texte reste fluide au redimensionnement
            onComplete: () => split.revert(),
          }),
      });
    } else if (type === 'media') {
      const img = el.querySelector('img, .media__placeholder');
      gsap.set(el, { clipPath: 'inset(100% 0% 0% 0%)' });
      if (img) gsap.set(img, { scale: 1.25 });
      reveals.push({
        el,
        play: () => {
          gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: EASE_IN_OUT });
          if (img) gsap.to(img, { scale: 1, duration: 1.8, ease: EASE });
        },
      });
    } else {
      gsap.set(el, { autoAlpha: 0, y: 16 });
      reveals.push({
        el,
        play: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 1, ease: EASE }),
      });
    }
  });

  // Les visuels de la grille de projets se dévoilent aussi
  document.querySelectorAll<HTMLElement>('[data-work] [data-media]').forEach((el) => {
    gsap.set(el, { clipPath: 'inset(0% 0% 100% 0%)' });
    reveals.push({
      el,
      play: () => gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: EASE_IN_OUT }),
    });
  });

  return reveals;
}

function playReveals(reveals: Reveal[]) {
  // Les éléments déjà visibles s'enchaînent avec un léger décalage, les autres au défilement
  let creating = true;
  let inView = 0;
  reveals.forEach(({ el, play }) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () => gsap.delayedCall(creating ? Math.min(inView++, 12) * 0.08 : 0, play),
    });
  });
  creating = false;
}

/* ------------------------------------------------------------------------ */
/* Projets : bascule grille / liste avec Flip                                */
/* ------------------------------------------------------------------------ */
const VIEW_KEY = 'work-view';

function initWorkToggle() {
  const work = document.querySelector<HTMLElement>('[data-work]');
  if (!work) return;
  const buttons = work.querySelectorAll<HTMLButtonElement>('[data-view-btn]');

  const setView = (view: string, animate: boolean) => {
    if (work.dataset.view === view) return;
    const targets = work.querySelectorAll('.item, .item__media, .item__title, .item__index, .item__year, .item__cat');
    const state = animate && !reduceMotion ? Flip.getState(targets) : null;
    // Fige la hauteur pendant l'animation pour éviter un saut de défilement
    if (state) work.style.minHeight = `${work.offsetHeight}px`;

    work.dataset.view = view;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewBtn === view)));
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {}

    if (state) {
      Flip.from(state, {
        duration: 0.9,
        ease: EASE_IN_OUT,
        nested: true,
        stagger: 0.02,
        onComplete: () => {
          work.style.minHeight = '';
          lenis?.resize();
          ScrollTrigger.refresh();
        },
      });
    } else {
      ScrollTrigger.refresh();
    }
  };

  let saved: string | null = null;
  try {
    saved = localStorage.getItem(VIEW_KEY);
  } catch {}
  if (saved === 'list' || saved === 'grid') setView(saved, false);

  buttons.forEach((b) => {
    const onClick = () => setView(b.dataset.viewBtn!, true);
    b.addEventListener('click', onClick);
    onCleanup(() => b.removeEventListener('click', onClick));
  });
}

/* ------------------------------------------------------------------------ */
/* Petits éléments d'interface                                              */
/* ------------------------------------------------------------------------ */
function initClock() {
  const el = document.querySelector<HTMLElement>('[data-clock]');
  if (!el) return;
  const fmt = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: el.dataset.tz,
  });
  const tick = () => (el.textContent = fmt.format(new Date()));
  tick();
  const id = window.setInterval(tick, 10_000);
  onCleanup(() => clearInterval(id));
}

function initScrollTop() {
  document.querySelectorAll<HTMLElement>('[data-scroll-top]').forEach((btn) => {
    const onClick = () =>
      lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: 'smooth' });
    btn.addEventListener('click', onClick);
    onCleanup(() => btn.removeEventListener('click', onClick));
  });
}

/* ------------------------------------------------------------------------ */
/* Cycle de vie                                                             */
/* ------------------------------------------------------------------------ */
let firstLoad = true;

document.addEventListener('astro:page-load', async () => {
  initClock();
  initScrollTop();
  initWorkToggle();

  if (firstLoad) await document.fonts.ready; // découpe des lignes avec les bonnes métriques
  const reveals = prepareReveals();

  if (firstLoad) {
    firstLoad = false;
    await runLoader();
  } else {
    await curtainOut();
  }

  playReveals(reveals);
});
