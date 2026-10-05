import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { Ambience } from './audio';
import type { World } from './gl/world';

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const rtl = root.dir === 'rtl';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];

const TONES: Record<string, string> = {
  forest: '#12291f',
  bordeaux: '#4a0f1b',
  night: '#0f1d17',
  gold: '#2e2414',
};

// ------------------------------------------------------------------
// Défilement fluide
// ------------------------------------------------------------------
const lenis = new Lenis({ duration: 1.25, smoothWheel: !reduced, wheelMultiplier: 0.9 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

// ------------------------------------------------------------------
// Vidéo + son
// ------------------------------------------------------------------
const video = $<HTMLVideoElement>('[data-video]')!;
const ambience = new Ambience(video);
video.play().catch(() => {});

const soundBtn = $<HTMLButtonElement>('[data-sound]')!;
function setSound(on: boolean) {
  if (on) ambience.enable();
  else ambience.disable();
  soundBtn.classList.toggle('is-playing', on);
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.setAttribute('aria-label', (on ? soundBtn.dataset.on : soundBtn.dataset.off) ?? '');
  try {
    sessionStorage.setItem('sl-sound', on ? '1' : '0');
  } catch {}
}
soundBtn.addEventListener('click', () => setSound(!ambience.enabled));

// ------------------------------------------------------------------
// WebGL (chargé à la demande)
// ------------------------------------------------------------------
let world: World | null = null;

async function initGL() {
  if (reduced) return;
  const canvas = $<HTMLCanvasElement>('#gl')!;
  const test = document.createElement('canvas');
  if (!(test.getContext('webgl2') || test.getContext('webgl'))) return;
  try {
    const { World } = await import('./gl/world');
    world = new World(canvas);
  } catch (e) {
    console.warn('WebGL indisponible', e);
    return;
  }
  world.addHero(video);
  $$<HTMLImageElement>('[data-gl="media"]').forEach((img) => world!.addMedia(img, 'media'));
  if (finePointer) $$<HTMLImageElement>('[data-gl="cursor"]').forEach((img) => world!.addMedia(img, 'cursor'));
  root.classList.add('has-gl');

  window.addEventListener('pointermove', (e) => world!.setMouse(e.clientX, e.clientY), { passive: true });

  gsap.ticker.add((time) => {
    world!.render({
      time,
      velocity: lenis.velocity,
      audio: ambience.read(time),
      scroll: lenis.scroll,
    });
  });

  $$('[data-tone]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      end: 'bottom 40%',
      onToggle: (self) => {
        if (self.isActive) world!.setTone(TONES[section.dataset.tone!] ?? TONES.forest);
      },
    });
  });
  ScrollTrigger.create({
    trigger: '[data-hero]',
    start: 'top top',
    end: 'bottom 40%',
    onEnterBack: () => world!.setTone(TONES.forest),
  });
}

// ------------------------------------------------------------------
// Entrée
// ------------------------------------------------------------------
const loader = $('[data-loader]')!;
const isReturn = root.classList.contains('is-return');

function waitFor<T>(p: Promise<T>, ms: number) {
  return Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
}

async function boot() {
  const glReady = initGL();
  const assets = Promise.all([
    document.fonts.ready,
    new Promise<void>((r) => {
      if (video.readyState >= 2) r();
      else video.addEventListener('loadeddata', () => r(), { once: true });
    }),
    glReady,
  ]);

  if (isReturn) {
    await waitFor(assets, 2500);
    enter(false, true);
    return;
  }

  const counter = $('[data-count]', loader)!;
  const logo = $('.loader__logo', loader)!;
  const progress = { v: 0 };
  const count = gsap.to(progress, {
    v: 92,
    duration: 2.2,
    ease: 'power2.inOut',
    onUpdate: () => {
      counter.textContent = String(Math.round(progress.v)).padStart(3, '0');
      const p = 100 - progress.v;
      logo.style.clipPath = rtl ? `inset(0 0 0 ${p}%)` : `inset(0 ${p}% 0 0)`;
    },
  });
  await Promise.all([count.then(), waitFor(assets, 6000)]);
  await gsap.to(progress, {
    v: 100,
    duration: 0.6,
    ease: 'power2.out',
    onUpdate: count.vars.onUpdate,
  });

  const enterBox = $('.loader__enter', loader)!;
  gsap.set(enterBox, { visibility: 'visible' });
  gsap.from(enterBox.children, { opacity: 0, y: 24, duration: 1.2, stagger: 0.12, ease: 'expo.out' });
  gsap.to(counter.parentElement, { opacity: 0, duration: 0.6 });

  $$<HTMLButtonElement>('[data-enter]', loader).forEach((btn) =>
    btn.addEventListener('click', () => enter(btn.dataset.enter === 'sound', false), { once: true }),
  );
}

let entered = false;
function enter(withSound: boolean, quick: boolean) {
  if (entered) return;
  entered = true;
  try {
    sessionStorage.setItem('sl-entered', '1');
  } catch {}

  // Les navigateurs bloquent le son sans geste : au retour, on entre en silence
  if (withSound && !quick) setSound(true);

  const tl = gsap.timeline({
    onComplete: () => {
      root.classList.remove('is-loading');
      loader.remove();
      lenis.start();
      ScrollTrigger.refresh();
    },
  });

  if (!quick) {
    tl.to($$('.loader__enter, .loader__logo', loader), { opacity: 0, y: -20, duration: 0.8, ease: 'power3.in' });
    tl.to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.2, ease: 'expo.inOut' }, '-=0.2');
  } else {
    tl.set(loader, { display: 'none' });
  }

  world?.playIntro(quick ? 1.6 : 2.6);
  if (!world) gsap.from('.hero__video', { opacity: 0, scale: 1.08, duration: 2.4, ease: 'expo.out' });

  tl.from('[data-hero-line]', { yPercent: 110, duration: 1.6, stagger: 0.12, ease: 'expo.out' }, quick ? 0.2 : '-=0.5');
  tl.from('[data-hero-item]', { opacity: 0, y: 20, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, '<0.3');
  tl.fromTo('.header', { yPercent: -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2, ease: 'expo.out' }, '<');
}

// ------------------------------------------------------------------
// En-tête & menu
// ------------------------------------------------------------------
const header = $('.header')!;
let lastY = 0;
let headerHidden = false;
lenis.on('scroll', ({ scroll }: { scroll: number }) => {
  header.classList.toggle('is-scrolled', scroll > 40);
  const menuOpen = menuBtn.getAttribute('aria-expanded') === 'true';
  const hide = !menuOpen && scroll > lastY && scroll > window.innerHeight * 0.6;
  if (entered && hide !== headerHidden) {
    headerHidden = hide;
    gsap.to(header, { yPercent: hide ? -110 : 0, duration: 0.8, ease: 'expo.out', overwrite: 'auto' });
  }
  lastY = scroll;
});

const menuBtn = $<HTMLButtonElement>('[data-burger]')!;
const menu = $('[data-menu]')!;
function toggleMenu(open: boolean) {
  menuBtn.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-hidden', String(!open));
  if (open) {
    lenis.stop();
    gsap.set(menu, { visibility: 'visible' });
    gsap.to(menu, { clipPath: 'inset(0 0 0% 0)', duration: 1, ease: 'expo.inOut' });
    gsap.fromTo($$('.menu__nav a', menu), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, stagger: 0.06, ease: 'expo.out', delay: 0.35 });
  } else {
    lenis.start();
    gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.8, ease: 'expo.inOut', onComplete: () => gsap.set(menu, { visibility: 'hidden' }) });
  }
}
menuBtn.addEventListener('click', () => toggleMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));

$$<HTMLAnchorElement>('[data-link]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (!id?.startsWith('#')) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    if (menuBtn.getAttribute('aria-expanded') === 'true') toggleMenu(false);
    lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
  }),
);

// ------------------------------------------------------------------
// Révélations
// ------------------------------------------------------------------
function initReveals() {
  // Titres : lignes masquées
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.5,
          stagger: 0.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        });
      },
    });
  });

  $$('[data-reveal="fade"]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } },
    );
  });

  $$('[data-reveal="line"]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } },
    );
  });

  // Manifeste : les mots s'allument au fil du défilement
  const text = $('[data-words]');
  if (text) {
    const words = text.textContent!.trim().split(/\s+/);
    text.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
    gsap.to($$('.w', text), {
      opacity: 1,
      stagger: 0.08,
      ease: 'none',
      scrollTrigger: { trigger: text, start: 'top 75%', end: 'bottom 45%', scrub: 0.6 },
    });
  }

  // Parallaxe
  $$('[data-parallax]').forEach((el) => {
    const k = parseFloat(el.dataset.parallax!);
    gsap.fromTo(
      el,
      { yPercent: -k * 100 },
      { yPercent: k * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });
}

// ------------------------------------------------------------------
// Expériences : défilement horizontal épinglé
// ------------------------------------------------------------------
function initHorizontal() {
  const section = $('[data-hscroll]');
  if (!section) return;
  const pin = $('[data-hscroll-pin]', section)!;
  const track = $('[data-hscroll-track]', section)!;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => (rtl ? distance() : -distance()),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        pin,
        start: 'top top',
        end: () => `+=${distance()}`,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });
  });
}

// ------------------------------------------------------------------
// Casting : vignette qui suit le curseur
// ------------------------------------------------------------------
function initCasting() {
  const list = $('[data-acts]');
  if (!list || !finePointer) return;
  const acts = $$('[data-act]', list);
  acts.forEach((act, i) => {
    act.addEventListener('mouseenter', () => {
      acts.forEach((a) => a.classList.toggle('is-active', a === act));
      list.classList.add('is-hovering');
      world?.showCursor(i);
    });
  });
  list.addEventListener('mouseleave', () => {
    acts.forEach((a) => a.classList.remove('is-active'));
    list.classList.remove('is-hovering');
    world?.showCursor(-1);
  });
}

// ------------------------------------------------------------------
// Curseur & boutons magnétiques
// ------------------------------------------------------------------
function initCursor() {
  if (!finePointer || reduced) return;
  const cursor = $('.cursor')!;
  const dot = $('.cursor__dot', cursor)!;
  const ring = $('.cursor__ring', cursor)!;
  const dx = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3' });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.6, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.6, ease: 'power3' });
  window.addEventListener(
    'pointermove',
    (e) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    },
    { passive: true },
  );
  document.addEventListener('pointerover', (e) => {
    const t = e.target as HTMLElement;
    cursor.classList.toggle('is-hover', !!t.closest('a, button, label, input, textarea, .exp__media'));
  });

  $$('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.3);
      y((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener('pointerleave', () => {
      x(0);
      y(0);
    });
  });
}

// ------------------------------------------------------------------
// Formulaire : prépare un e-mail (pas de serveur)
// ------------------------------------------------------------------
function initForm() {
  const form = $<HTMLFormElement>('[data-form]');
  if (!form) return;
  const status = $('[data-status]', form)!;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    let ok = true;
    (['name', 'email'] as const).forEach((n) => {
      const input = form.elements.namedItem(n) as HTMLInputElement;
      const valid = input.checkValidity() && input.value.trim() !== '';
      input.closest('.field')!.classList.toggle('is-invalid', !valid);
      if (!valid && ok) {
        input.focus();
        ok = false;
      }
    });
    if (!ok) return;
    const occasion = String(data.get('occasion') ?? '');
    const lines = $$<HTMLLabelElement>('.field > label', form)
      .map((l) => {
        const field = document.getElementById(l.htmlFor) as HTMLInputElement | HTMLTextAreaElement | null;
        return field?.value.trim() ? `${l.textContent}: ${field.value.trim()}` : '';
      })
      .filter(Boolean);
    lines.push(`${$('legend', form)!.textContent}: ${occasion}`);
    const subject = `Soundslike — ${occasion} — ${data.get('name')}`;
    const href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    status.textContent = form.dataset.sent ?? '';
    window.location.href = href;
  });
}

// ------------------------------------------------------------------
// Lancement
// ------------------------------------------------------------------
initReveals();
initHorizontal();
initCasting();
initCursor();
initForm();
boot();

window.addEventListener('resize', () => world?.resize());
