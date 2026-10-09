import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { Ambience } from './audio';
import { stages as atlasStages } from '../data/atlas';
import type { Atlas, View } from './gl/atlas';
import type { World } from './gl/world';

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const rtl = root.dir === 'rtl';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];

// Teinte centrale du fond WebGL par section ; « ivory » passe la page en clair
const TONES: Record<string, string> = {
  forest: '#1d4a32',
  bordeaux: '#4d1322',
  night: '#123a44',
  gold: '#4a3412',
  ivory: '#2c5a44',
};

function applyTone(tone: string) {
  const light = tone === 'ivory';
  root.classList.toggle('is-light', light);
  world?.setTone(TONES[tone] ?? TONES.forest, light);
}

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
  // « Réduire les animations » : on garde le WebGL (fonds de la DA),
  // mais le temps s'écoule plus lentement et sans déformation au défilement.
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
  $$<HTMLImageElement | HTMLVideoElement>('[data-gl="media"]').forEach((el) => world!.addMedia(el, 'media'));
  if (finePointer) $$<HTMLImageElement>('[data-gl="cursor"]').forEach((img) => world!.addMedia(img, 'cursor'));
  root.classList.add('has-gl');

  window.addEventListener('pointermove', (e) => world!.setMouse(e.clientX, e.clientY), { passive: true });

  gsap.ticker.add((time) => {
    world!.render({
      time: reduced ? time * 0.35 : time,
      velocity: reduced ? 0 : lenis.velocity,
      audio: ambience.read(time),
      scroll: lenis.scroll,
    });
  });
}

function initTones() {
  $$('[data-tone]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => {
        if (self.isActive) applyTone(section.dataset.tone!);
      },
    });
  });
  ScrollTrigger.create({
    trigger: '[data-hero]',
    start: 'top top',
    end: 'bottom 55%',
    onEnterBack: () => applyTone('forest'),
  });
}

// ------------------------------------------------------------------
// Entrée : le logo s'écrit, se remplit, puis rejoint l'en-tête pendant
// que le rideau s'ouvre sur la vidéo.
// ------------------------------------------------------------------
const loader = $('[data-loader]')!;
const isReturn = root.classList.contains('is-return');
const headerLogo = $('[data-header-logo]')!;
const headerRest = () => $$('.header__nav, .header__tools');

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
    enter(true);
    return;
  }

  gsap.set(headerLogo, { opacity: 0 });
  gsap.set(headerRest(), { opacity: 0, y: -12 });

  const counter = $('[data-count]', loader)!;
  const strokes = $$<SVGPathElement>('.logo__strokes path', loader);
  strokes.forEach((path) => {
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
  });

  // Écriture : chaque lettre se trace, de gauche à droite
  const write = gsap.timeline({
    onUpdate() {
      counter.textContent = String(Math.round(this.progress() * 100)).padStart(3, '0');
    },
  });
  write.to(strokes, {
    strokeDashoffset: 0,
    duration: 1.5,
    ease: 'power2.inOut',
    stagger: { each: 0.14 },
  });

  await Promise.all([write.then(), waitFor(assets, 6000)]);
  counter.textContent = '100';

  // Remplissage : l'encre succède au trait
  const fill = $('.logo__fill', loader)!;
  await gsap
    .timeline()
    .to(fill, { opacity: 1, duration: 0.9, ease: 'power2.out' })
    .to(strokes, { opacity: 0, duration: 0.6 }, '<0.2')
    .then();

  enter(false);
}

let entered = false;
function enter(quick: boolean) {
  if (entered) return;
  entered = true;
  try {
    sessionStorage.setItem('sl-entered', '1');
  } catch {}

  const done = () => {
    root.classList.remove('is-loading');
    loader.remove();
    lenis.start();
    ScrollTrigger.refresh();
  };

  if (quick) {
    gsap.set(loader, { display: 'none' });
    world?.playIntro(1.6);
    const tl = gsap.timeline({ onComplete: done });
    tl.from('[data-hero-line]', { yPercent: 110, duration: 1.6, stagger: 0.12, ease: 'expo.out' }, 0.2);
    tl.from('[data-hero-item]', { opacity: 0, y: 20, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, '<0.3');
    return;
  }

  // Le logo du loader rejoint celui de l'en-tête (FLIP)
  const logo = $('[data-loader-logo]', loader)!;
  const from = logo.getBoundingClientRect();
  const to = headerLogo.getBoundingClientRect();
  const curtains = $$('.loader__curtain', loader);

  const tl = gsap.timeline({ onComplete: done });
  tl.to($('.loader__count', loader), { opacity: 0, duration: 0.4 }, 0);
  tl.to(
    logo,
    {
      x: to.left - from.left,
      y: to.top - from.top,
      scale: to.width / from.width,
      duration: 1.5,
      ease: 'expo.inOut',
    },
    0,
  );
  // Le rideau s'ouvre en deux
  tl.to(curtains[0], { xPercent: -100, duration: 1.6, ease: 'expo.inOut' }, 0.18);
  tl.to(curtains[1], { xPercent: 100, duration: 1.6, ease: 'expo.inOut' }, 0.18);
  tl.add(() => world?.playIntro(2.4), 0.35);
  if (!world) tl.from('.hero__video', { opacity: 0, scale: 1.08, duration: 2.4, ease: 'expo.out' }, 0.35);
  tl.set(headerLogo, { opacity: 1 }, 1.5);
  tl.set(logo, { opacity: 0 }, 1.5);
  tl.to(headerRest(), { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'expo.out' }, 1.15);
  tl.from('[data-hero-line]', { yPercent: 110, duration: 1.6, stagger: 0.12, ease: 'expo.out' }, 0.95);
  tl.from('[data-hero-item]', { opacity: 0, y: 20, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, 1.25);
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
// Vidéos de contenu : lecture seulement quand elles sont à l'écran
// ------------------------------------------------------------------
function initInlineVideos() {
  const videos = $$<HTMLVideoElement>('[data-inline-video]');
  if (!videos.length) return;
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) {
          if (v.preload !== 'auto') v.preload = 'auto';
          v.play().catch(() => {});
        } else v.pause();
      }),
    { rootMargin: '25% 25%' },
  );
  videos.forEach((v) => io.observe(v));
}

// ------------------------------------------------------------------
// Sounds like … : la carte en points dézoome du Triangle d'or au monde
// ------------------------------------------------------------------
function initAtlas() {
  const section = $('[data-atlas]');
  if (!section) return;
  const pin = $('[data-atlas-pin]', section)!;
  const canvas = $<HTMLCanvasElement>('[data-atlas-gl]', section)!;
  const words = $$('.atlas__word', section);
  const regionEl = $('[data-atlas-region]', section)!;
  const coordsEl = $('[data-atlas-coords]', section)!;
  const regions: string[] = JSON.parse($('[data-atlas-regions]', section)!.textContent ?? '[]');
  const dots = $$('.atlas__progress li', section);
  const markerEls = $$('[data-marker]', section).map((el) => ({
    el,
    id: el.dataset.marker!,
    lon: Number(el.dataset.lon),
    lat: Number(el.dataset.lat),
  }));
  // Étape à laquelle chaque repère apparaît pour la première fois
  const firstStage = new Map<string, number>();
  atlasStages.forEach((st, i) => st.markers.forEach((m) => firstStage.has(m) || firstStage.set(m, i)));

  const N = atlasStages.length;
  let target = 0;
  let shown = 0;
  let visible = false;
  let current = 0;

  ScrollTrigger.create({
    trigger: section,
    pin,
    start: 'top top',
    end: () => `+=${(N - 1) * window.innerHeight * 0.85}`,
    onUpdate: (self) => (target = self.progress),
    invalidateOnRefresh: true,
  });
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (visible = self.isActive),
  });

  const setWord = (n: number) => {
    if (n === current) return;
    const forward = n > current;
    const prev = words[current];
    const next = words[n];
    prev.classList.remove('is-active');
    prev.classList.toggle('is-out', forward);
    next.style.transition = 'none';
    next.classList.toggle('is-out', !forward);
    void next.offsetWidth;
    next.style.transition = '';
    next.classList.remove('is-out');
    next.classList.add('is-active');
    words.forEach((w, i) => i !== n && i !== current && w.classList.remove('is-out', 'is-active'));
    gsap.to(regionEl, {
      opacity: 0,
      duration: 0.25,
      onComplete: () => {
        regionEl.textContent = regions[n] ?? '';
        gsap.to(regionEl, { opacity: 1, duration: 0.5 });
      },
    });
    dots.forEach((d, i) => d.classList.toggle('is-active', i === n));
    current = n;
  };

  const dms = (v: number, pos: string, neg: string) => {
    const a = Math.abs(v);
    const d = Math.floor(a);
    const m = Math.floor((a - d) * 60);
    return `${d}°${String(m).padStart(2, '0')}′${v >= 0 ? pos : neg}`;
  };

  const smooth = (t: number) => t * t * (3 - 2 * t);

  let atlas: Atlas | null = null;
  let mod: typeof import('./gl/atlas') | null = null;

  const view: View = { lon: atlasStages[0].lon, lat: atlasStages[0].lat, span: atlasStages[0].span };

  const frame = (time: number) => {
    if (!visible || !mod) return;
    shown += (target - shown) * (reduced ? 1 : 0.12);
    const s = shown * (N - 1);
    const i = Math.min(Math.floor(s), N - 2);
    // Pause sur chaque étape, puis voyage vers la suivante
    const e = smooth(Math.min(1, Math.max(0, (s - i - 0.18) / 0.64)));
    const A = atlasStages[i];
    const B = atlasStages[i + 1];
    view.lon = A.lon + (B.lon - A.lon) * e;
    view.lat = mod.invMercY(mod.mercY(A.lat) + (mod.mercY(B.lat) - mod.mercY(A.lat)) * e);
    view.span = Math.exp(Math.log(A.span) + (Math.log(B.span) - Math.log(A.span)) * e);
    const active = s >= N - 1 ? N - 1 : e > 0.5 ? i + 1 : i;
    setWord(active);
    coordsEl.textContent = `${dms(view.lat, 'N', 'S')} · ${dms(view.lon, 'E', 'W')}`;

    // Repères
    const w = pin.clientWidth;
    const h = pin.clientHeight;
    const scale = Math.min(w, h) / ((view.span * Math.PI) / 180);
    const named = new Set(atlasStages[active].markers);
    for (const m of markerEls) {
      const x = w / 2 + (mod.mercX(m.lon) - mod.mercX(view.lon)) * scale;
      const y = h / 2 - (mod.mercY(m.lat) - mod.mercY(view.lat)) * scale;
      const seen = (firstStage.get(m.id) ?? 0) <= active;
      const inside = x > -40 && x < w + 40 && y > -40 && y < h + 40;
      m.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      m.el.style.opacity = seen && inside ? '1' : '0';
      m.el.classList.toggle('is-named', named.has(m.id));
      m.el.classList.toggle('is-left', x > w * 0.62);
    }
    atlas?.render(view, reduced ? time * 0.3 : time);
  };

  // Chargement : carte en points (WebGL) + données
  (async () => {
    try {
      mod = await import('./gl/atlas');
      const { dots } = (await fetch(section.dataset.map!).then((r) => r.json())) as { dots: string };
      const data = Uint8Array.from(atob(dots), (c) => c.charCodeAt(0)).buffer;
      try {
        atlas = new mod.Atlas(canvas, data);
      } catch (err) {
        console.warn('Carte WebGL indisponible', err);
        canvas.remove();
      }
    } catch (err) {
      console.warn('Carte indisponible', err);
    }
    gsap.ticker.add(frame);
    window.addEventListener('resize', () => atlas?.resize());
    ScrollTrigger.addEventListener('refresh', () => atlas?.resize());
  })();
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
// L'épinglage d'abord : les déclencheurs suivants tiennent compte de son espace
initHorizontal();
initAtlas();
initReveals();
initTones();
initInlineVideos();
initCasting();
initCursor();
initForm();
boot();

window.addEventListener('resize', () => world?.resize());
