import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import Lenis from 'lenis';
import { initCart, addToCart } from './cart';
import { initGL } from './gl';
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
  // molette lissée ; au doigt on garde le défilement natif du téléphone, plus fluide que toute simulation
  lenis = new Lenis({ lerp: 0.075, smoothWheel: true, syncTouch: false, autoRaf: false });
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

/* ───────────── Images WebGL ───────────── */
const gl = initGL();
if (gl) gsap.ticker.add(() => {
  gl.setVelocity(lenis?.velocity ?? 0);
  gl.tick();
});

/* ───────────── Ouverture et hero ───────────── */
const heroFrame = $('[data-hero-frame]');
const heroGL = gl?.get(heroFrame);
const heroLines = $$('.hero__line > span');
gsap.set(heroLines, { yPercent: 110 });
gsap.set('[data-hero-fade], [data-hero-nav]', { opacity: 0, y: 16 });
if (!heroGL) gsap.set('[data-hero-frame] img', { scale: 1.12 });

function heroIntro() {
  const tl = gsap
    .timeline({ onComplete: startSlides })
    .to(heroLines, { yPercent: 0, duration: 1.8, stagger: 0.12, ease: 'expo.out' }, 0.5)
    .to('[data-hero-fade], [data-hero-nav]', { opacity: 1, y: 0, duration: 1.4, stagger: 0.08, ease: 'expo.out' }, 1);
  if (heroGL) tl.to(heroGL, { reveal: 1, duration: 2.6, ease: 'power2.out' }, 0);
  else tl.to('[data-hero-frame] img', { scale: 1, duration: 2.6, ease: 'silk' }, 0);
  return tl;
}

// diaporama du hero : barres de progression, transition liquide en WebGL (fondu sinon)
const SLIDE_TIME = 6;
function startSlides() {
  if (!heroFrame) return;
  const imgs = $$('img', heroFrame);
  const dots = $$<HTMLButtonElement>('[data-goto]');
  const bars = dots.map((d) => $('[data-bar]', d)!);
  const n = imgs.length;
  let i = 0;
  let busy = false;
  let timer: gsap.core.Tween | null = null;

  const run = () => {
    timer?.kill();
    gsap.set(bars, { scaleX: 0 });
    bars.slice(0, i).forEach((b) => gsap.set(b, { scaleX: 1 }));
    if (reduced) return;
    timer = gsap.to(bars[i], { scaleX: 1, duration: SLIDE_TIME, ease: 'none', onComplete: () => goTo((i + 1) % n) });
  };
  const goTo = (to: number) => {
    if (busy || to === i) return;
    busy = true;
    timer?.kill();
    dots.forEach((d, k) => d.classList.toggle('is-on', k === to));
    const done = () => {
      i = to;
      busy = false;
      run();
    };
    if (heroGL?.slides) {
      const s = heroGL.slides;
      s.next = to;
      gsap.fromTo(s, { p: 0 }, { p: 1, duration: 1.9, ease: 'power2.inOut', onComplete: () => ((s.index = to), (s.p = 0), done()) });
    } else {
      gsap.to(imgs[to], { opacity: 1, duration: 1.4, ease: 'power2.inOut', onComplete: () => (imgs.forEach((im, k) => k !== to && gsap.set(im, { opacity: 0 })), done()) });
    }
    // le titre respire à chaque changement
    gsap.fromTo(heroLines, { yPercent: 0 }, { yPercent: -8, duration: 0.95, ease: 'power2.inOut', yoyo: true, repeat: 1, stagger: 0.06 });
  };
  dots.forEach((d, k) => d.addEventListener('click', () => goTo(k)));
  run();
}

// progression réelle du chargement : polices + images chargées tout de suite (hero, etc.)
function loadProgress(onProgress: (p: number) => void) {
  // on attend seulement ce qu'on voit en premier : les deux premières photos du hero
  const imgs = $$<HTMLImageElement>('[data-hero-frame] img').slice(0, 2);
  const total = imgs.length + 1;
  let done = 0;
  const tick = () => onProgress(Math.min(1, ++done / total));
  imgs.forEach((im) => (im.complete ? tick() : (im.addEventListener('load', tick, { once: true }), im.addEventListener('error', tick, { once: true }))));
  (document.fonts?.ready ?? Promise.resolve()).then(tick);
  // filet de sécurité : jamais plus de 5 s d'attente
  setTimeout(() => onProgress(1), 5000);
}

function runLoader() {
  const loader = $('[data-loader]');
  if (!loader || reduced) {
    loader?.remove();
    heroIntro().progress(reduced ? 1 : 0);
    return;
  }
  lock(true);
  const stroke = $('[data-mono-stroke]', loader)!;
  const fill = $('[data-mono-fill]', loader)!;
  const bar = $('[data-loader-bar]', loader)!;
  const pct = $('[data-loader-pct]', loader)!;
  const center = $('.loader__center', loader)!;
  const logoBox = $('[data-loader-logo]', loader)!;
  const glyphs = $$('.glyph', logoBox);

  // le tracé suit le chargement, sans aller plus vite qu'un dessin à la main (2,2 s minimum)
  let target = 0;
  const shown = { p: 0 };
  const t0 = performance.now();
  let finished = false;
  loadProgress((p) => (target = Math.max(target, p)));
  const draw = () => {
    const cap = Math.min(1, (performance.now() - t0) / 2200);
    shown.p += (Math.min(target, cap) - shown.p) * 0.1;
    if (Math.min(target, cap) >= 1 && shown.p > 0.985) shown.p = 1;
    stroke.style.strokeDashoffset = String(1 - shown.p);
    bar.style.transform = `scaleX(${shown.p})`;
    pct.textContent = String(Math.round(shown.p * 100));
    if (shown.p >= 1 && !finished) {
      finished = true;
      gsap.ticker.remove(draw);
      finish();
    }
  };
  gsap.ticker.add(draw);

  const finish = () => {
    const shift = (logoBox.offsetHeight + parseFloat(getComputedStyle(logoBox).top) - center.offsetHeight) / 2;
    gsap
      .timeline({
        onComplete: () => {
          loader.remove();
          lock(false);
        },
      })
      // le monogramme se remplit d'encre
      .to(fill, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0)
      .to(stroke, { opacity: 0, duration: 0.9, ease: 'power2.out' }, 0.2)
      .fromTo('[data-loader-mono]', { scale: 1 }, { scale: 0.86, duration: 1.4, ease: 'expo.inOut' }, 0.3)
      .to('.loader__foot', { opacity: 0, duration: 0.5 }, 0.3)
      // Mel ar Bescond apparaît dessous, l'ensemble se recentre
      .to(center, { y: -shift, duration: 1.4, ease: 'expo.inOut' }, 0.5)
      .fromTo(glyphs, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.06, ease: 'expo.out' }, 0.9)
      // puis le site entier
      .to(center, { opacity: 0, y: -shift - 30, duration: 0.8, ease: 'power3.in' }, 2.7)
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.2, ease: 'expo.inOut' }, 3)
      .add(heroIntro(), 3.3);
  };
}

// au défilement : la photo se resserre en cadre, le texte monte et s'efface
{
  const hero = $('[data-hero]');
  if (hero && heroFrame) {
    const gutter = () => `${Math.max(16, Math.min(64, innerWidth * 0.04))}px`;
    gsap.fromTo(
      heroFrame,
      { '--inset': '0px' },
      { '--inset': gutter, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true } },
    );
    gsap.to('[data-hero-content]', {
      yPercent: -18,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: '70% top', scrub: true },
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

  // images : révélation organique en WebGL (rideau et dézoom sinon)
  $$('[data-reveal-img]').forEach((el) => {
    const item = gl?.get(el);
    if (item) {
      gsap.to(item, { reveal: 1, duration: 2.4, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      return;
    }
    gsap.fromTo(
      el,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 88%', once: true } },
    );
    const img = el.querySelector('img');
    if (img) gsap.from(img, { scale: 1.3, duration: 2.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

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
  const follow = finePointer && window.innerWidth > 800;
  $$('[data-season]').forEach((row) => {
    const img = $('[data-season-img]', row)!;
    const item = gl?.get(img);
    if (!follow) {
      // mobile : l'image est dans le flux, révélée à l'entrée
      if (item) gsap.to(item, { reveal: 1, duration: 2.2, ease: 'power2.out', scrollTrigger: { trigger: img, start: 'top 90%', once: true } });
      return;
    }
    if (item) item.alpha = 0;
    const x = gsap.quickTo(img, 'x', { duration: 0.9, ease: 'power3.out' });
    const y = gsap.quickTo(img, 'y', { duration: 0.9, ease: 'power3.out' });
    row.addEventListener('pointerenter', (e) => {
      gsap.set(img, { x: e.clientX + 30, y: e.clientY - img.offsetHeight / 2 });
      if (item) gsap.to(item, { alpha: 1, reveal: 1, duration: 1.2, ease: 'power3.out', overwrite: 'auto' });
      else gsap.to(img, { autoAlpha: 1, duration: 0.6, overwrite: 'auto' });
    });
    row.addEventListener('pointermove', (e) => {
      x(e.clientX + 30);
      y(e.clientY - img.offsetHeight / 2);
    });
    row.addEventListener('pointerleave', () => {
      if (item) gsap.to(item, { reveal: 0, alpha: 0, duration: 0.7, ease: 'power2.in', overwrite: 'auto' });
      else gsap.to(img, { autoAlpha: 0, duration: 0.5, overwrite: 'auto' });
    });
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
      const dock = $('[data-dock]');
      if (dock && window.innerWidth <= 900) gsap.fromTo(dock, { y: 6 }, { y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)', clearProps: 'transform' });
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
  const mobile = window.innerWidth <= 900;
  $('[data-dock]')?.classList.toggle('is-on', has && (mobile || (!basketVisible && window.scrollY > window.innerHeight)));
}
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: updateDock });

/* ───────────── Démarrage ───────────── */
reveals();
seasons();
commande();

// le préloader démarre tout de suite et suit lui-même le chargement
runLoader();
document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh());
