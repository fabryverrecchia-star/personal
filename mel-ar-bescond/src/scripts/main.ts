import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { CustomEase } from 'gsap/CustomEase';
import Lenis from 'lenis';
import { initHoney } from './honey-gl';
import { initCart, addToCart } from './cart';
import type { Size } from '../data/products';

gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin, CustomEase);
CustomEase.create('honey', 'M0,0 C0.12,0 0.18,0.78 0.36,0.92 0.54,1.04 0.7,1 1,1');

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ───────────── Défilement doux (bureau et mobile) ───────────── */
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({
    lerp: 0.085,
    smoothWheel: true,
    syncTouch: true,
    syncTouchLerp: 0.07,
    touchInertiaExponent: 1.6,
    autoRaf: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const lock = (on: boolean) => {
  if (lenis) on ? lenis.stop() : lenis.start();
  document.body.style.overflow = on ? 'hidden' : '';
};
const scrollTo = (target: string | HTMLElement | number) => {
  const offset = typeof target === 'number' ? 0 : -10;
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4), force: true });
  else if (typeof target === 'number') window.scrollTo(0, target);
  else (typeof target === 'string' ? $(target) : target)?.scrollIntoView();
};

/* ───────────── Panier ───────────── */
initCart({ lock });

// liens d'ancre : défilement doux (après le panier, pour passer outre un éventuel verrou)
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
  .to('[data-menu-bg]', { clipPath: 'circle(150% at calc(100% - 40px) 40px)', duration: 0.9, ease: 'expo.inOut' })
  .from('.menu__txt', { yPercent: 110, rotate: 4, stagger: 0.07, duration: 0.8, ease: 'expo.out' }, 0.35)
  .from('.menu__num, .menu__foot', { opacity: 0, y: 10, stagger: 0.05, duration: 0.5 }, 0.5)
  .from('.menu__link', { borderBottomColor: 'rgba(0,0,0,0)', duration: 0.6 }, 0.5);
function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  document.documentElement.classList.remove('menu-open');
  menuBtn.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
  menuTl.timeScale(1.6).reverse();
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
      header.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 0.6 && !menuOpen);
      lastY = y;
    },
  });
  $$('[data-theme="dark"]').forEach((sec) =>
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 40px',
      end: 'bottom 40px',
      onToggle: (self) => header.classList.toggle('is-dark', self.isActive),
    }),
  );
}

/* ───────────── Miel WebGL ───────────── */
const honeyCanvas = $<HTMLCanvasElement>('[data-honey-gl]');
const honey = honeyCanvas ? initHoney(honeyCanvas) : null;

/* ───────────── Découpes de texte ───────────── */
const splits = $$('[data-split]').map((el) =>
  SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true }),
);

/* ───────────── Intro ───────────── */
const glyphs = $$<SVGPathElement>('[data-hero-logo] .glyph');
gsap.set(glyphs, { yPercent: 60, opacity: 0, rotate: -6, transformOrigin: '50% 100%' });
gsap.set('[data-hero-fade]', { opacity: 0, y: 24 });

function heroIntro() {
  const tl = gsap.timeline();
  tl.to(honey ?? {}, { intro: 1, duration: 2.6, ease: 'honey' }, 0)
    .to(glyphs, { yPercent: 0, opacity: 1, rotate: 0, duration: 1.6, stagger: 0.07, ease: 'expo.out' }, 0.25)
    .to('[data-hero-fade]', { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, 0.9)
    .add(flyBee, 1.2);
  return tl;
}

function runLoader() {
  const loader = $('[data-loader]');
  document.body.classList.remove('is-loading');
  if (!loader || reduced) {
    loader?.remove();
    heroIntro().progress(reduced ? 1 : 0);
    return;
  }
  lock(true);
  const count = $('[data-loader-count]', loader)!;
  const n = { v: 0 };
  const tl = gsap.timeline({
    onComplete: () => {
      loader.remove();
      lock(false);
    },
  });
  // vague de surface en boucle
  const wave = gsap.to('[data-loader-wave]', { x: 100, duration: 1.4, ease: 'none', repeat: -1 });
  tl.fromTo('[data-loader-stroke]', { strokeDasharray: 700, strokeDashoffset: 700 }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 0)
    .from('[data-loader-word]', { opacity: 0, y: 20, duration: 1, ease: 'expo.out' }, 0.2)
    .fromTo('[data-loader-fill]', { y: 230 }, { y: 0, duration: 2.2, ease: 'power2.inOut' }, 0.3)
    .to(n, { v: 100, duration: 2.2, ease: 'power2.inOut', onUpdate: () => (count.textContent = String(Math.round(n.v)).padStart(3, '0')) }, 0.3)
    .to('.loader__inner', { y: -40, opacity: 0, duration: 0.7, ease: 'power3.in' }, 2.7)
    .to('[data-loader-drips]', { scaleY: 3.2, duration: 1.3, ease: 'power2.in' }, 2.9)
    .to(loader, { yPercent: -130, duration: 1.3, ease: 'expo.inOut', onComplete: () => wave.kill() }, 3.0)
    .add(heroIntro(), 3.55);
}

/* ───────────── Abeille ───────────── */
function flyBee() {
  const bee = $('[data-flybee]');
  const hero = $('[data-hero]');
  if (!bee || !hero || reduced) return;
  const w = hero.clientWidth;
  const h = hero.clientHeight;
  const path = [
    { x: -80, y: h * 0.62 },
    { x: w * 0.22, y: h * 0.42 },
    { x: w * 0.48, y: h * 0.7 },
    { x: w * 0.7, y: h * 0.38 },
    { x: w * 0.86, y: h * 0.6 },
    { x: w * 0.62, y: h * 0.78 },
    { x: w * 0.4, y: h * 0.56 },
    { x: w * 0.08, y: h * 0.74 },
    { x: -80, y: h * 0.5 },
  ];
  gsap.set(bee, { opacity: 1, xPercent: -50, yPercent: -50 });
  gsap.to(bee, {
    motionPath: { path, curviness: 1.6, autoRotate: 90 },
    duration: w < 700 ? 11 : 16,
    ease: 'none',
    repeat: -1,
    repeatDelay: 2.5,
  });
  // battement / flottement
  gsap.to(bee, { scale: 0.92, duration: 0.09, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

/* ───────────── Hero au défilement ───────────── */
{
  const hero = $('[data-hero]')!;
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    onUpdate: (s) => honey && (honey.scroll = s.progress * 1.4),
  });
  gsap.to('[data-hero-logo]', {
    yPercent: 30,
    scale: 0.92,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__top, .hero__bottom', {
    opacity: 0,
    y: -40,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: '60% top', scrub: true },
  });
}

/* ───────────── Bandeau défilant (vitesse liée au scroll) ───────────── */
{
  const track = $('[data-marquee-track]');
  if (track) {
    const group = track.children[0] as HTMLElement;
    let x = 0;
    let dir = -1;
    let boost = 0;
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (s) => {
        dir = s.direction === 1 ? -1 : 1;
        boost = Math.min(Math.abs(s.getVelocity()) / 120, 14);
      },
    });
    gsap.ticker.add((_, dt) => {
      const gw = group.offsetWidth;
      if (!gw || reduced) return;
      boost *= 0.92;
      x += dir * (0.045 + boost * 0.05) * dt;
      if (x <= -gw) x += gw;
      if (x > 0) x -= gw;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  }
}

/* ───────────── Révélations génériques ───────────── */
function reveals() {
  $$('[data-reveal]').forEach((el) =>
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 1.3,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    }),
  );

  splits.forEach((s) => {
    const el = s.elements[0] as HTMLElement;
    gsap.from(s.lines, {
      yPercent: 110,
      rotate: 2.5,
      duration: 1.4,
      stagger: 0.09,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  $$('[data-split-chars]').forEach((el) => {
    const s = SplitText.create(el, { type: 'chars', charsClass: 'char' });
    gsap.from(s.chars, {
      yPercent: 80,
      opacity: 0,
      rotateX: -80,
      transformOrigin: '50% 100%',
      stagger: 0.045,
      duration: 1.3,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  // Manifeste : les mots s'éclairent un à un
  $$('[data-words]').forEach((el) => {
    const s = SplitText.create(el, { type: 'words', wordsClass: 'word' });
    gsap.fromTo(
      s.words,
      { opacity: 0.14 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 55%', scrub: true },
      },
    );
    $$('[data-pill]', el).forEach((p) =>
      gsap.from(p, {
        width: 0,
        marginInline: 0,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: p, start: 'top 80%', once: true },
      }),
    );
  });

  // Photos : dévoilement par le bas en arrondi
  $$('[data-clip-reveal]').forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: 'inset(100% 0% 0% 0% round 50% 50% 0 0)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 0% 0% 0 0)',
        duration: 1.8,
        ease: 'expo.inOut',
        clearProps: 'clipPath',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      },
    );
    const img = el.querySelector('img');
    if (img) gsap.from(img, { scale: 1.35, duration: 2.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  $$('[data-parallax]').forEach((el) => {
    const f = parseFloat(el.dataset.parallax!);
    gsap.fromTo(
      el,
      { yPercent: -f * 50 },
      {
        yPercent: f * 50,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  $$('[data-float]').forEach((el) =>
    gsap.to(el, {
      y: parseFloat(el.dataset.float!),
      rotate: parseFloat(el.dataset.float!) / 20,
      ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    }),
  );

  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const o = { v: 0 };
    gsap.to(o, {
      v: end,
      duration: 2.2,
      ease: 'expo.out',
      onUpdate: () => (el.textContent = String(Math.round(o.v))),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  // Emblème : rotation douce et apparition
  const emblem = $('[data-emblem]');
  if (emblem) {
    gsap.from(emblem, {
      scale: 0.7,
      opacity: 0,
      rotate: -8,
      duration: 2,
      ease: 'expo.out',
      scrollTrigger: { trigger: emblem, start: 'top 85%', once: true },
    });
    gsap.to(emblem, {
      yPercent: -10,
      rotate: 4,
      ease: 'none',
      scrollTrigger: { trigger: emblem, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  // Logo du pied de page
  const fl = $$('[data-footer-logo] .glyph');
  gsap.from(fl, {
    yPercent: 100,
    opacity: 0,
    duration: 1.6,
    stagger: 0.06,
    ease: 'expo.out',
    scrollTrigger: { trigger: '[data-footer-logo]', start: 'top 95%', once: true },
  });
}

/* ───────────── Défilement horizontal des engagements ───────────── */
function horizontal() {
  const sec = $('[data-hscroll]');
  if (!sec) return;
  const pin = $('[data-hscroll-pin]', sec)!;
  const track = $('[data-hscroll-track]', sec)!;
  const dist = () => track.scrollWidth - window.innerWidth;
  const tween = gsap.to(track, {
    x: () => -dist(),
    ease: 'none',
    scrollTrigger: {
      trigger: pin,
      start: 'top top',
      end: () => `+=${dist()}`,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });
  gsap.to('[data-hscroll-bar]', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { trigger: pin, start: 'top top', end: () => `+=${dist()}`, scrub: true },
  });
  $$('[data-hcard]', sec).forEach((card) => {
    const img = card.querySelector('img');
    if (img)
      gsap.fromTo(
        img,
        { xPercent: -12 },
        {
          xPercent: 12,
          ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        },
      );
    gsap.from(card.querySelector('.eng__body'), {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 85%', once: true },
    });
  });
}

/* ───────────── Récolte : couleurs des saisons ───────────── */
function recolte() {
  const sec = $('[data-recolte]');
  if (!sec) return;
  $$('[data-season]').forEach((s) => {
    ScrollTrigger.create({
      trigger: s,
      start: 'top 60%',
      end: 'bottom 40%',
      onToggle: (self) => {
        if (self.isActive) sec.style.backgroundColor = s.dataset.bg!;
      },
    });
    const drop = s.querySelector('svg');
    gsap.fromTo(
      drop,
      { scaleY: 0.85, scaleX: 1.08, y: -40 },
      {
        scaleY: 1.12,
        scaleX: 0.94,
        y: 40,
        ease: 'none',
        scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 60%',
    end: 'bottom 40%',
    onLeave: () => (sec.style.backgroundColor = ''),
    onLeaveBack: () => (sec.style.backgroundColor = ''),
  });
  gsap.fromTo(
    '[data-badge]',
    { rotate: -10, y: 30 },
    { rotate: 6, y: -30, ease: 'none', scrollTrigger: { trigger: '[data-badge]', start: 'top bottom', end: 'bottom top', scrub: true } },
  );
}

/* ───────────── Cristallisation ───────────── */
function crystal() {
  const sec = $('[data-crystal]');
  if (!sec) return;
  const disc = $('[data-crystal-disc]', sec)!;
  const pct = $('[data-crystal-pct]', sec);
  const steps = $$('[data-crystal-step]', sec);
  const o = { p: 0 };
  gsap.to(o, {
    p: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: $('[data-crystal-pin]', sec),
      start: 'top top',
      end: '+=160%',
      pin: true,
      scrub: 0.6,
      onUpdate: (s) => {
        const i = Math.min(steps.length - 1, Math.floor(s.progress * steps.length * 0.999));
        steps.forEach((st, j) => st.classList.toggle('is-on', j <= i));
      },
    },
    onUpdate: () => {
      disc.style.setProperty('--p', o.p.toFixed(3));
      if (pct) pct.textContent = String(Math.round(o.p * 100));
    },
  });
  steps[0]?.classList.add('is-on');
  gsap.to('[data-crystal-spec]', { x: 30, y: 10, rotate: -18, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

/* ───────────── Demande de commande ───────────── */
function shop() {
  $$('[data-product]').forEach((card) => {
    const jarWrap = $('[data-jar-wrap]', card)!;
    const body = $('[data-jar-body]', card)!;
    gsap.to($('[data-jar-wave]', card), { x: 60, duration: 2.4, ease: 'none', repeat: -1 });
    gsap.to($('[data-spin]', card), { rotate: 360, duration: 40, ease: 'none', repeat: -1 });

    // inclinaison 3D du pot au survol / au doigt
    const stage = $('[data-tilt]', card)!;
    const rx = gsap.quickTo(jarWrap, 'rotationX', { duration: 0.8, ease: 'power3.out' });
    const ry = gsap.quickTo(jarWrap, 'rotationY', { duration: 0.8, ease: 'power3.out' });
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 26);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 18);
    });
    stage.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });

    $$<HTMLButtonElement>('[data-add]', card).forEach((chip) =>
      chip.addEventListener('click', () => {
        flyJar(chip, card);
        gsap.fromTo(body, { rotate: -5, scaleY: 0.94 }, { rotate: 0, scaleY: 1, duration: 1, ease: 'elastic.out(1.2, 0.35)' });
        gsap.fromTo(chip, { scale: 0.94 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' });
        // le pot arrive dans la caisse quand la goutte l'atteint
        setTimeout(() => {
          addToCart(chip.dataset.add!, chip.dataset.size as Size);
          updateDock();
        }, 650);
      }),
    );

    gsap.from(jarWrap, {
      yPercent: 30,
      opacity: 0,
      rotate: -8,
      duration: 1.6,
      ease: 'expo.out',
      scrollTrigger: { trigger: card, start: 'top 80%', once: true },
    });
    gsap.from($$('.product__info > *', card), {
      y: 30,
      opacity: 0,
      stagger: 0.07,
      duration: 1.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: card, start: 'top 70%', once: true },
    });
  });

  // caisse : apparition, étiquette qui se balance
  const crate = $('[data-composer] [data-crate]');
  if (crate) {
    gsap.from(crate, { y: 80, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: crate, start: 'top 85%', once: true } });
    gsap.fromTo('[data-crate-tag]', { rotate: -7 }, { rotate: 7, duration: 2.4, ease: 'sine.inOut', repeat: -1, yoyo: true });
  }
  ScrollTrigger.create({ trigger: '[data-composer]', start: 'top 85%', end: 'bottom 15%', onToggle: (s) => ((composerVisible = s.isActive), updateDock()) });
  ScrollTrigger.create({ trigger: '[data-hero]', start: 'top top', end: 'bottom 30%', onToggle: (s) => ((heroVisible = s.isActive), updateDock()) });
  updateDock();
}

// un pot retiré (caisse ou récapitulatif) peut vider la demande
document.addEventListener('click', () => requestAnimationFrame(updateDock));

let composerVisible = false;
let heroVisible = true;
function updateDock() {
  const dock = $('[data-dock]');
  const has = document.documentElement.classList.contains('has-items');
  dock?.classList.toggle('is-on', has && !composerVisible && !heroVisible);
}

// une goutte de miel part de la contenance choisie vers la caisse (ou la pastille si la caisse est hors écran)
function flyJar(from: HTMLElement, card: HTMLElement) {
  const box = $('[data-composer] [data-crate-jars]');
  const target = composerVisible && box ? box : ($('[data-dock].is-on') ?? $('[data-cart-count]'));
  if (!target) return;
  header.classList.remove('is-hidden');
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const c = card.querySelector('.product__halo') as HTMLElement;
  const cs = getComputedStyle(c);
  const drop = document.createElement('span');
  drop.style.cssText = `position:fixed;left:0;top:0;z-index:99;width:22px;height:22px;border-radius:50% 50% 50% 0;
    background:linear-gradient(160deg,${cs.getPropertyValue('--c1')},${cs.getPropertyValue('--c2')});
    box-shadow:inset -3px -3px 6px rgb(0 0 0 / .2), 0 8px 18px rgb(110 74 42 / .35);pointer-events:none`;
  document.body.appendChild(drop);
  const sx = a.left + a.width / 2 - 11;
  const sy = a.top + a.height / 2 - 11;
  const ex = b.left + b.width / 2 - 11;
  const ey = target === box ? b.bottom - b.height * 0.25 : b.top + b.height / 2 - 11;
  gsap.set(drop, { x: sx, y: sy, rotate: -45, scale: 0 });
  gsap
    .timeline({ onComplete: () => drop.remove() })
    .to(drop, { scale: 1.2, duration: 0.2, ease: 'back.out(3)' })
    .to(drop, {
      motionPath: { path: [{ x: sx, y: sy }, { x: (sx + ex) / 2, y: Math.min(sy, ey) - 140 }, { x: ex, y: ey }], curviness: 1.4 },
      scale: 0.6,
      duration: 0.6,
      ease: 'power2.inOut',
    })
    .to(drop, { scale: 0, duration: 0.15 });
}

/* ───────────── Curseur & boutons magnétiques ───────────── */
function pointer() {
  if (!finePointer) return;
  const cur = $('[data-cursor]')!;
  const txt = $('[data-cursor-txt]')!;
  const x = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3.out' });
  const y = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => {
    x(e.clientX);
    y(e.clientY);
  });
  document.addEventListener('pointerover', (e) => {
    const t = e.target as HTMLElement;
    const label = t.closest<HTMLElement>('[data-cursor-label]')?.dataset.cursorLabel;
    cur.classList.toggle('has-txt', !!label);
    txt.textContent = label ?? '';
    cur.classList.toggle('is-hover', !label && !!t.closest('a, button, label, input, [data-tilt]'));
  });

  $$('[data-magnetic]').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.28);
      my((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      mx(0);
      my(0);
    });
  });
}

/* ───────────── Démarrage ───────────── */
reveals();
horizontal();
recolte();
crystal();
shop();
pointer();

const start = () => {
  runLoader();
  ScrollTrigger.refresh();
};
if (document.fonts?.ready) Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).then(start);
else start();

window.addEventListener('load', () => ScrollTrigger.refresh());
