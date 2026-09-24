import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { GL, type GLItem } from './gl';
import { SadikComposer } from './sadik';

gsap.registerPlugin(Flip, ScrollTrigger, SplitText);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'expo.out';
const EASE_IN_OUT = 'expo.inOut';

/* ------------------------------------------------------------------------ */
/* Défilement fluide (Lenis) synchronisé avec le ticker GSAP                 */
/* ------------------------------------------------------------------------ */
let lenis: Lenis | null = null;
if (!reduceMotion) {
  lenis = new Lenis({ autoRaf: false, lerp: 0.07, wheelMultiplier: 0.8 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ------------------------------------------------------------------------ */
/* Visuels WebGL (désactivés si mouvement réduit ou WebGL indisponible)      */
/* ------------------------------------------------------------------------ */
const glRoot = document.querySelector<HTMLElement>('[data-gl-root]');
const gl = !reduceMotion && glRoot ? GL.create(glRoot, () => lenis?.velocity ?? 0) : null;

// Transition en cours : 'open' = zoom grille → projet, 'close' = dézoom projet → grille
let mode: 'curtain' | 'open' | 'close' = 'curtain';
let flying: GLItem | null = null;
let homeScroll = 0;
const heroMedia = () => document.querySelector<HTMLElement>('.project__hero [data-gl]');
const pageContent = () => [document.querySelector('main'), document.querySelector('footer')];
const isHome = (url: URL) => (url.pathname.replace(/\/$/, '') || '/') === '/';

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
  if (isHome(event.from)) homeScroll = window.scrollY;

  const media = event.sourceElement?.closest('.item__link')?.querySelector<HTMLElement>('[data-gl]');
  const hero = heroMedia();

  if (gl && media && gl.has(media)) {
    // Ouverture : le visuel cliqué s'agrandit jusqu'au plein écran
    mode = 'open';
    event.loader = async () => {
      lenis?.stop();
      flying = gl.take(media);
      await Promise.all([
        flying && gl.flyTo(flying, () => ({ x: 0, y: 0, w: innerWidth, h: innerHeight })),
        gl.fade(flying, 0, 0.5),
        gsap.to(pageContent(), { autoAlpha: 0, duration: 0.5, ease: 'power2.out' }),
        load(),
      ]);
    };
  } else if (gl && hero && gl.has(hero) && isHome(event.to)) {
    // Fermeture : le visuel quitte la page projet puis rejoint sa place dans la grille
    mode = 'close';
    event.loader = async () => {
      lenis?.stop();
      flying = gl.take(hero);
      await Promise.all([gsap.to(pageContent(), { autoAlpha: 0, duration: 0.45, ease: 'power2.out' }), load()]);
    };
  } else {
    mode = 'curtain';
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
  }
});

document.addEventListener('astro:before-swap', () => {
  cleanupPage();
  gl?.detach(flying);
});

document.addEventListener('astro:after-swap', () => {
  applySavedView(); // même mise en page qu'au départ, pour retrouver la position exacte
  lenis?.resize();
  const y = mode === 'close' ? homeScroll : 0;
  lenis?.scrollTo(y, { immediate: true, force: true });
  window.scrollTo(0, y);
  if (mode === 'close') gsap.set(pageContent(), { autoAlpha: 0 });
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

  // Les visuels de la grille de projets se dévoilent aussi (en WebGL si actif)
  document.querySelectorAll<HTMLElement>('[data-work] [data-media]').forEach((el) => {
    const progress = gl?.uniform(el.querySelector('[data-gl]')!, 'uProgress');
    if (progress) {
      progress.value = 0;
      reveals.push({
        el,
        play: () => gsap.to(progress, { value: 1, duration: 1.2, ease: 'power3.out' }),
      });
      return;
    }
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

function savedView() {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === 'list' || v === 'grid' ? v : null;
  } catch {
    return null;
  }
}

function applySavedView() {
  const work = document.querySelector<HTMLElement>('[data-work]');
  const view = savedView();
  if (!work || !view) return;
  work.dataset.view = view;
  work
    .querySelectorAll('[data-view-btn]')
    .forEach((b) => b.setAttribute('aria-pressed', String((b as HTMLElement).dataset.viewBtn === view)));
}

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

  const saved = savedView();
  if (saved) setView(saved, false);

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

function initSadik() {
  const section = document.querySelector<HTMLElement>('[data-sadik]');
  if (!section) return;
  // Mouvement réduit : la composition reste liée au défilement, mais les pièces apparaissent en place
  const composer = SadikComposer.create(section, { reduced: reduceMotion });
  if (!composer) return;
  onCleanup(() => composer.dispose());
  // La piste de défilement vient d'apparaître : on remet les mesures à jour
  lenis?.resize();
  ScrollTrigger.refresh();
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
  initSadik();

  const current = mode;
  mode = 'curtain';

  if (current === 'open' && gl && flying) {
    // Le visuel agrandi devient celui de la page projet
    const hero = heroMedia();
    gl.attach(hero);
    if (hero) gl.land(flying, hero);
    else gl.dispose(flying);
    flying = null;
    const reveals = prepareReveals();
    lenis?.start();
    playReveals(reveals);
    return;
  }

  if (current === 'close' && gl && flying) {
    // Dézoom vers la position de départ dans la grille
    const item = flying;
    flying = null;
    const target = document.querySelector<HTMLElement>(`[data-work] [data-gl][data-gl-id="${item.id}"]`);
    if (target) target.style.opacity = '0';
    gl.attach(target);
    gl.fade(item, 1, 0.8, 0);
    gsap.to(pageContent(), { autoAlpha: 1, duration: 0.6, delay: 0.55, ease: 'power2.out' });
    if (target) {
      await gl.flyTo(item, () => gl.rect(target));
      gl.land(item, target);
    } else {
      gl.dispose(item);
    }
    lenis?.start();
    return;
  }

  if (firstLoad) await document.fonts.ready; // découpe des lignes avec les bonnes métriques
  gl?.attach();
  const reveals = prepareReveals();

  if (firstLoad) {
    firstLoad = false;
    await runLoader();
  } else {
    await curtainOut();
  }

  playReveals(reveals);
});
