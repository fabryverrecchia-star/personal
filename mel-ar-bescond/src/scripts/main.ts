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
const heroGlyphs = $$('[data-hero-logo] .glyph');
const heroFrame = $('[data-hero-frame]');
const heroGL = gl?.get(heroFrame);
gsap.set(heroGlyphs, { yPercent: 40, opacity: 0 });
gsap.set('[data-hero-fade]', { opacity: 0, y: 16 });
if (!heroGL) gsap.set('[data-hero-frame] img', { scale: 1.12 });

function heroIntro() {
  const tl = gsap
    .timeline({ onComplete: startSlides })
    .to(heroGlyphs, { yPercent: 0, opacity: 1, duration: 1.8, stagger: 0.05, ease: 'expo.out' }, 0)
    .to('[data-hero-fade]', { opacity: 1, y: 0, duration: 1.4, stagger: 0.08, ease: 'expo.out' }, 0.5);
  if (heroGL) tl.to(heroGL, { reveal: 1, duration: 2.4, ease: 'power2.out' }, 0.2);
  else tl.to('[data-hero-frame] img', { scale: 1, duration: 2.6, ease: 'silk' }, 0);
  return tl;
}

// diaporama du hero : une photo toutes les 5 s, transition liquide en WebGL (fondu sinon)
function startSlides() {
  if (!heroFrame || reduced) return;
  const imgs = $$('img', heroFrame);
  const n = imgs.length;
  const caps = JSON.parse($('[data-slide-caps]')?.textContent || '[]') as string[];
  const num = $('[data-slide-n]');
  const cap = $('[data-slide-cap]');
  let i = 0;
  const next = () => {
    const to = (i + 1) % n;
    const tl = gsap.timeline({ onComplete: () => void gsap.delayedCall(4.2, next) });
    if (heroGL?.slides) {
      const s = heroGL.slides;
      tl.fromTo(s, { p: 0 }, { p: 1, duration: 2, ease: 'power2.inOut', onComplete: () => ((s.index = to), (s.p = 0)) }, 0);
    } else {
      tl.to(imgs[to], { opacity: 1, duration: 1.6, ease: 'power2.inOut' }, 0).set(imgs[i], { opacity: 0 });
    }
    tl.to([num, cap], { yPercent: -100, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.4)
      .add(() => {
        if (num) num.textContent = String(to + 1).padStart(2, '0');
        if (cap) cap.textContent = caps[to] ?? '';
      })
      .fromTo([num, cap], { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out' });
    i = to;
  };
  gsap.delayedCall(3.5, next);
}

// secteur angulaire (pour les boucles de corde du préloader)
function wedge(cx: number, cy: number, r: number, start: number, dir: number, p: number) {
  if (p <= 0) return '';
  const a0 = (start * Math.PI) / 180;
  const a1 = a0 + dir * Math.min(p, 0.9999) * Math.PI * 2;
  const [x0, y0] = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
  const [x1, y1] = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
  return `M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 ${p > 0.5 ? 1 : 0} ${dir > 0 ? 1 : 0} ${x1} ${y1}Z`;
}

function runLoader() {
  const loader = $('[data-loader]');
  if (!loader || reduced) {
    loader?.remove();
    heroIntro().progress(reduced ? 1 : 0);
    return;
  }
  lock(true);
  const [ring, medal, text] = $$<SVGCircleElement>('[data-draw]', loader);
  const sweeps = $$<SVGPathElement>('[data-sweep]', loader).map((el) => {
    const [cx, cy, r, start, dir] = el.dataset.sweep!.split(',').map(Number);
    const o = { p: 0 };
    return { o, draw: () => el.setAttribute('d', wedge(cx, cy, r, start, dir, o.p)) };
  });
  gsap
    .timeline({
      onComplete: () => {
        loader.remove();
        lock(false);
      },
    })
    .fromTo(ring, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' }, 0)
    .to(sweeps.map((s) => s.o), { p: 1, duration: 1.8, ease: 'power2.inOut', onUpdate: () => sweeps.forEach((s) => s.draw()) }, 0.6)
    .fromTo(medal, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' }, 1)
    .fromTo(text, { strokeDashoffset: 1 }, { strokeDashoffset: 0.5, duration: 1.4, ease: 'power2.inOut' }, 1.2)
    .fromTo('[data-core]', { opacity: 0 }, { opacity: 1, duration: 1.1, ease: 'power2.out' }, 1.7)
    .from('[data-loader-emblem]', { scale: 0.94, duration: 3.2, ease: 'power2.out' }, 0)
    .to('[data-loader-emblem]', { scale: 0.9, opacity: 0, duration: 0.8, ease: 'power3.in' }, 3.3)
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.2, ease: 'expo.inOut' }, 3.6)
    .add(heroIntro(), 4.0);
}

// le cadre photo s'ouvre en plein écran au défilement
{
  const stage = $('[data-hero-stage]');
  if (stage && heroFrame)
    gsap.fromTo(heroFrame, {
      '--inset': () => `${parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || Math.max(16, Math.min(64, innerWidth * 0.04))}px`,
    }, {
      '--inset': '0px',
      ease: 'none',
      immediateRender: true,
      scrollTrigger: { trigger: stage, start: 'top 80%', end: 'top top', scrub: true, invalidateOnRefresh: true },
    });
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

const start = () => {
  runLoader();
  ScrollTrigger.refresh();
};
if (document.fonts?.ready) Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).then(start);
else start();
window.addEventListener('load', () => ScrollTrigger.refresh());
