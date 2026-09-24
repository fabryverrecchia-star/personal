import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import Lenis from 'lenis';
import { initCart, addToCart } from './cart';
import type { Size } from '../data/products';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('silk', 'M0,0 C0.16,0.84 0.3,1 1,1');

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ───────────── Défilement doux (bureau et tactile) ───────────── */
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.075, smoothWheel: true, syncTouch: true, syncTouchLerp: 0.065, touchInertiaExponent: 1.6, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const lock = (on: boolean) => {
  if (lenis) on ? lenis.stop() : lenis.start();
  document.body.style.overflow = on ? 'hidden' : '';
};
const scrollTo = (target: string | number) => {
  if (lenis) lenis.scrollTo(target, { duration: 2, easing: (t) => 1 - Math.pow(1 - t, 4), force: true });
  else if (typeof target === 'number') window.scrollTo(0, target);
  else $(target)?.scrollIntoView();
};

initCart({ lock });

document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href')!;
  e.preventDefault();
  closeMenu();
  requestAnimationFrame(() => scrollTo(id === '#top' ? 0 : id));
});

/* ───────────── Menu mobile ───────────── */
const menu = $('[data-menu]')!;
const menuBtn = $('[data-menu-toggle]')!;
let menuOpen = false;
const menuTl = gsap
  .timeline({ paused: true })
  .set(menu, { visibility: 'visible' })
  .to(menu, { clipPath: 'inset(0 0 0% 0)', duration: 1, ease: 'expo.inOut' })
  .from('.menu__txt', { yPercent: 110, stagger: 0.06, duration: 1, ease: 'expo.out' }, 0.45)
  .from('.menu__foot', { opacity: 0, duration: 0.6 }, 0.7);
function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  document.documentElement.classList.remove('menu-open');
  menuBtn.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
  menuTl.timeScale(1.5).reverse();
  lock(false);
}
menuBtn.addEventListener('click', () => {
  if (menuOpen) return closeMenu();
  menuOpen = true;
  document.documentElement.classList.add('menu-open');
  menuBtn.setAttribute('aria-expanded', 'true');
  menu.setAttribute('aria-hidden', 'false');
  menuTl.timeScale(1).play();
  lock(true);
});

/* ───────────── En-tête ───────────── */
const header = $('[data-header]')!;
{
  let lastY = 0;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      header.classList.toggle('is-scrolled', y > 40);
      header.classList.toggle('is-hidden', y > lastY + 2 && y > window.innerHeight && !menuOpen);
      if (y < lastY - 2) header.classList.remove('is-hidden');
      lastY = y;
    },
  });
  $$('[data-theme="dark"]').forEach((sec) =>
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 50px',
      end: 'bottom 50px',
      onToggle: (self) => header.classList.toggle('is-dark', self.isActive),
    }),
  );
}

/* ───────────── Découpes de texte ───────────── */
const splits = $$('[data-split]').map((el) => SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true }));

/* ───────────── Ouverture et hero ───────────── */
const heroGlyphs = $$('[data-hero-logo] .glyph');
gsap.set(heroGlyphs, { yPercent: 40, opacity: 0 });
gsap.set('[data-hero-fade]', { opacity: 0, y: 16 });
gsap.set('[data-hero-img]', { scale: 1.18 });

function heroIntro() {
  return gsap
    .timeline()
    .to(heroGlyphs, { yPercent: 0, opacity: 1, duration: 1.8, stagger: 0.05, ease: 'expo.out' }, 0)
    .to('[data-hero-img]', { scale: 1, duration: 2.6, ease: 'silk' }, 0)
    .to('[data-hero-fade]', { opacity: 1, y: 0, duration: 1.4, stagger: 0.08, ease: 'expo.out' }, 0.5);
}

function runLoader() {
  const loader = $('[data-loader]');
  if (!loader || reduced) {
    loader?.remove();
    heroIntro().progress(reduced ? 1 : 0);
    return;
  }
  lock(true);
  const glyphs = $$('.glyph', loader);
  gsap
    .timeline({
      onComplete: () => {
        loader.remove();
        lock(false);
      },
    })
    .from(glyphs, { yPercent: 50, opacity: 0, duration: 1.4, stagger: 0.05, ease: 'expo.out' }, 0)
    .to('[data-loader-bar]', { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0.1)
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'expo.inOut' }, 1.9)
    .to(glyphs, { yPercent: -30, opacity: 0, duration: 0.8, stagger: 0.02, ease: 'power3.in' }, 1.8)
    .add(heroIntro(), 2.35);
}

// la photo s'ouvre en plein écran au défilement
{
  const stage = $('[data-hero-stage]');
  if (stage) {
    gsap.to('[data-hero-frame]', {
      clipPath: 'inset(0px 0px 0px 0px)',
      ease: 'none',
      scrollTrigger: { trigger: stage, start: 'top 80%', end: 'top top', scrub: true },
    });
    gsap.to('[data-hero-img]', {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: stage, start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}

/* ───────────── Révélations ───────────── */
function reveals() {
  $$('[data-reveal]').forEach((el) =>
    gsap.from(el, {
      y: 30,
      opacity: 0,
      duration: 1.6,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    }),
  );

  splits.forEach((s) =>
    gsap.from(s.lines, {
      yPercent: 105,
      duration: 1.6,
      stagger: 0.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: s.elements[0] as HTMLElement, start: 'top 88%', once: true },
    }),
  );

  $$('[data-split-chars]').forEach((el) => {
    const s = SplitText.create(el, { type: 'chars', charsClass: 'char', mask: 'chars' });
    gsap.from(s.chars, {
      yPercent: 100,
      stagger: 0.035,
      duration: 1.5,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // manifeste : les mots s'éclairent au fil de la lecture
  $$('[data-words]').forEach((el) => {
    const s = SplitText.create(el, { type: 'words', wordsClass: 'word' });
    gsap.fromTo(
      s.words,
      { opacity: 0.16 },
      { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 50%', scrub: true } },
    );
  });

  // images : rideau vertical et léger dézoom
  $$('[data-reveal-img]').forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 88%', once: true } },
    );
    const img = el.querySelector('img');
    if (img) gsap.from(img, { scale: 1.3, duration: 2.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  $$('[data-parallax]').forEach((el) => {
    const f = parseFloat(el.dataset.parallax!);
    gsap.fromTo(
      el,
      { yPercent: -f * 50 },
      { yPercent: f * 50, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });

  const band = $('[data-band]');
  if (band)
    gsap.fromTo(
      band,
      { clipPath: 'inset(12% 8% 12% 8%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'center center', scrub: true } },
    );

  gsap.from($$('.footer .glyph'), {
    yPercent: 60,
    opacity: 0,
    duration: 1.8,
    stagger: 0.05,
    ease: 'expo.out',
    scrollTrigger: { trigger: '[data-footer-logo]', start: 'top 95%', once: true },
  });
}

/* ───────────── Saisons : image qui suit le curseur ───────────── */
function seasons() {
  if (!finePointer || window.innerWidth <= 800) return;
  $$('[data-season]').forEach((row) => {
    const img = $('[data-season-img]', row)!;
    const x = gsap.quickTo(img, 'x', { duration: 0.9, ease: 'power3.out' });
    const y = gsap.quickTo(img, 'y', { duration: 0.9, ease: 'power3.out' });
    const r = gsap.quickTo(img, 'rotation', { duration: 1.2, ease: 'power3.out' });
    let lastX = 0;
    row.addEventListener('pointerenter', (e) => {
      gsap.set(img, { x: e.clientX + 30, y: e.clientY - img.offsetHeight / 2 });
      gsap.to(img, { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.out', overwrite: 'auto' });
      gsap.fromTo(img.querySelector('img'), { scale: 1.25 }, { scale: 1, duration: 1.2, ease: 'expo.out' });
    });
    row.addEventListener('pointermove', (e) => {
      x(e.clientX + 30);
      y(e.clientY - img.offsetHeight / 2);
      r(gsap.utils.clamp(-6, 6, (e.clientX - lastX) * 0.4));
      lastX = e.clientX;
    });
    row.addEventListener('pointerleave', () =>
      gsap.to(img, { autoAlpha: 0, clipPath: 'inset(100% 0% 0% 0%)', duration: 0.6, ease: 'expo.in', overwrite: 'auto' }),
    );
    gsap.set(img, { clipPath: 'inset(100% 0% 0% 0%)' });
  });
}

/* ───────────── Commande ───────────── */
let basketVisible = false;
function commande() {
  $$<HTMLButtonElement>('[data-add]').forEach((btn) =>
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.add!, btn.dataset.size as Size);
      gsap.fromTo(btn, { scale: 0.97 }, { scale: 1, duration: 0.8, ease: 'expo.out' });
      updateDock();
    }),
  );
  ScrollTrigger.create({
    trigger: '[data-commande]',
    start: 'top 70%',
    end: 'bottom 30%',
    onToggle: (s) => {
      basketVisible = s.isActive;
      updateDock();
    },
  });
  document.addEventListener('click', () => requestAnimationFrame(updateDock));
  updateDock();
}
function updateDock() {
  const has = document.documentElement.classList.contains('has-items');
  $('[data-dock]')?.classList.toggle('is-on', has && !basketVisible && window.scrollY > window.innerHeight);
}
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: updateDock });

/* ───────────── Démarrage ───────────── */
reveals();
seasons();
commande();

const start = () => {
  runLoader();
  ScrollTrigger.refresh();
};
if (document.fonts?.ready) Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).then(start);
else start();
window.addEventListener('load', () => ScrollTrigger.refresh());
