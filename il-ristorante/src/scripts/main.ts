// Orchestration : défilement doux, transitions de page, révélations, WebGL.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { GL } from './gl';
import { contact } from '../data/site';

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

/* ---------- Défilement ---------- */
const lenis = new Lenis({ lerp: reduced ? 1 : 0.09, smoothWheel: !reduced });
lenis.on('scroll', ScrollTrigger.update);

/* ---------- WebGL ---------- */
let gl: GL | null = null;
const canvas = $<HTMLCanvasElement>('[data-gl-canvas]');
if (canvas && GL.supported() && !reduced) {
  try {
    gl = new GL(canvas);
    root.classList.add('gl-on');
  } catch (e) {
    console.warn('WebGL indisponible', e);
  }
}

gsap.ticker.add((time, dt) => {
  lenis.raf(time * 1000);
  gl?.update(dt / 1000);
});
gsap.ticker.lagSmoothing(0);

/* ---------- Découpage des titres en mots ---------- */
function split(el: HTMLElement) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = '1';
  const walk = (node: Node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        (n.textContent ?? '').split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(' ');
          const w = document.createElement('span');
          w.className = 'w';
          const wi = document.createElement('span');
          wi.className = 'wi';
          wi.textContent = part;
          w.append(wi);
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName !== 'BR') {
        walk(n);
      }
    });
  };
  walk(el);
}

/* ---------- Curseur ---------- */
const cursor = $('[data-cursor]');
const cursorLabel = $('[data-cursor-label]');
if (cursor && matchMedia('(hover: hover)').matches) {
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const t = e.target as HTMLElement;
    const labelled = t.closest<HTMLElement>('[data-cursor]:not(.cursor)');
    cursor.classList.toggle('has-label', !!labelled);
    if (labelled && cursorLabel) cursorLabel.textContent = labelled.dataset.cursor ?? '';
    cursor.classList.toggle('is-link', !labelled && !!t.closest('a, button, input, select, textarea, label'));
  });
}

/* ---------- Ancres internes : défilement doux ---------- */
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  const id = a?.getAttribute('href')?.slice(1);
  if (!a || !id) return;
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  lenis.scrollTo(target, { offset: -70, duration: 1.4 });
});

/* ---------- En-tête & menu (persistants) ---------- */
const header = $('[data-header]')!;
const burger = $('[data-burger]')!;
const setMenu = (open: boolean) => {
  root.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  open ? lenis.stop() : lenis.start();
};
burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));

// Déverrouille dès que le pointeur bouge hors de l'en-tête, une fois la transition terminée
window.addEventListener('pointermove', (e) => {
  if (!header.classList.contains('nav-lock') || navigating) return;
  if (getComputedStyle(curtain).visibility === 'visible') return;
  if (!header.contains(e.target as Node)) header.classList.remove('nav-lock');
}, { passive: true });
window.addEventListener('keydown', (e) => e.key === 'Tab' && header.classList.remove('nav-lock'));

let lastY = 0;
lenis.on('scroll', ({ scroll }: { scroll: number }) => {
  const hasHero = !!$('[data-hero]');
  header.classList.toggle('is-solid', !hasHero || scroll > window.innerHeight * 0.85);
  header.classList.toggle('is-hidden', scroll > 300 && scroll > lastY && !root.classList.contains('menu-open'));
  lastY = scroll;
});

function updateHeader() {
  // L'aperçu autonome (scripts/build-preview.mjs) fournit son propre chemin courant
  const path = ((window as { __previewPath?: string }).__previewPath ?? location.pathname).replace(/\/$/, '') || '/';
  $$<HTMLAnchorElement>('[data-nav-link]').forEach((a) => {
    const href = a.getAttribute('href')!;
    const active = href === path || (href !== '/' && path.startsWith(href + '/'));
    a.toggleAttribute('aria-current', active);
    if (active) a.setAttribute('aria-current', 'page');
  });
  header.classList.remove('is-hidden');
  header.classList.toggle('is-solid', !$('[data-hero]'));
}

/* ---------- Transitions de page ---------- */
const curtain = $('[data-curtain]')!;
const panels = $$('[data-curtain-panel]');
const curtainLabel = $('[data-curtain-label]')!;
const curtainText = $('[data-curtain-text]')!;

function curtainIn(label: string) {
  curtainText.textContent = label;
  return gsap.timeline()
    .set(curtain, { visibility: 'visible' })
    .fromTo(panels, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'expo.inOut', stagger: 0.1 })
    .fromTo(curtainLabel, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.35');
}

function curtainOut() {
  return gsap.timeline()
    .to(curtainLabel, { autoAlpha: 0, y: -30, duration: 0.45, ease: 'power2.in' })
    .to([...panels].reverse(), { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.95, ease: 'expo.inOut', stagger: 0.1 }, '-=0.15')
    .set(curtain, { visibility: 'hidden' });
}

let navigating = false;
document.addEventListener('astro:before-preparation', (e) => {
  const ev = e as Event & { loader: () => Promise<void>; sourceElement?: Element };
  const a = ev.sourceElement?.closest<HTMLElement>('a');
  const label = (a?.dataset.label || a?.querySelector('h2, h3')?.textContent || a?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 42);
  const original = ev.loader;
  navigating = true;
  setMenu(false);
  // Referme les sous-menus : le lien cliqué garderait sinon le focus (et le menu ouvert)
  (document.activeElement as HTMLElement | null)?.blur();
  header.classList.add('nav-lock');
  if (player?.open) { playerVideo?.pause(); player.close(); }
  lenis.stop();
  ev.loader = async () => {
    await Promise.all([reduced ? Promise.resolve() : curtainIn(label).then(), original()]);
  };
});

document.addEventListener('astro:before-swap', () => {
  page?.abort();
  ScrollTrigger.getAll().forEach((t) => t.kill());
  gl?.clear();
});

document.addEventListener('astro:after-swap', () => {
  lenis.scrollTo(0, { immediate: true, force: true });
});

/* ---------- Initialisation de chaque page ---------- */
let page: AbortController | null = null;
let first = true;

document.addEventListener('astro:page-load', async () => {
  page = new AbortController();
  const main = $('[data-page]')!;
  updateHeader();
  lenis.resize();
  lenis.start();

  $$('[data-split]', document).forEach(split);
  gl?.scan(document);

  const intro = first ? loaderOut() : navigating && !reduced ? curtainOut() : gsap.timeline();
  first = false;
  navigating = false;

  heroIntro(main, intro);
  reveals(main);
  counters(main);
  horizontal(main);
  parallax(main);
  magnetic(page.signal);
  forms(main, page.signal);
  contactForm(main, page.signal);
  filters(main, page.signal);
  rotators(main);
  maps(main);
  reels(main);
  stepsLine(main);

  requestAnimationFrame(() => ScrollTrigger.refresh());
});

/* ---------- Loader (première visite) ---------- */
function loaderOut() {
  const loader = $('[data-loader]')!;
  const count = $('[data-loader-count]')!;
  const bar = $('[data-loader-bar]')!;
  if (reduced) {
    loader.remove();
    return gsap.timeline();
  }
  lenis.stop();
  const year = { v: 2006 };
  const target = new Date().getFullYear();
  const fonts = document.fonts?.ready ?? Promise.resolve();
  const tl = gsap.timeline({ paused: true, onComplete: () => { loader.remove(); lenis.start(); } });
  tl.fromTo('.loader-medal', { scale: 0.6, rotate: -12, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 1, ease: 'expo.out' })
    .to(year, { v: target, duration: 1.6, ease: 'power2.inOut', onUpdate: () => { count.textContent = String(Math.round(year.v)); } }, 0.2)
    .to(bar, { scaleX: 1, duration: 1.8, ease: 'power2.inOut' }, 0)
    .to('.loader-inner', { y: -40, autoAlpha: 0, duration: 0.6, ease: 'power3.in' }, '+=0.15')
    .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '-=0.25');
  fonts.then(() => tl.play());
  return tl;
}

/* ---------- Entrée du hero ---------- */
function heroIntro(main: HTMLElement, intro: gsap.core.Timeline) {
  const title = $('[data-hero-title]', main);
  const start = Math.max(0, intro.duration() - 0.75);
  const tl = gsap.timeline({ delay: start });
  if (title) {
    tl.to($$('.wi', title), { y: 0, duration: 1.4, ease: 'expo.out', stagger: 0.06 }, 0);
    title.dataset.revealed = '1';
  }
  const hero = $('[data-hero]', main);
  if (hero) {
    tl.to($$('[data-reveal]', hero), { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, clearProps: 'transform' }, 0.3);
    $$('[data-reveal]', hero).forEach((el) => (el.dataset.revealed = '1'));
    $$('[data-sticker]', hero).forEach((s) => tl.fromTo(s, { scale: 0, rotate: -40 }, { scale: 1, rotate: 0, duration: 1.4, ease: 'elastic.out(1, 0.6)' }, 0.8));
  }
  gl?.heroes().forEach((m) => m.reveal(start));
  if (!gl) $$('[data-hero] .hero-media img', main).forEach((img) => gsap.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 2.4, ease: 'expo.out', delay: start }));
}

/* ---------- Révélations au défilement ---------- */
function reveals(main: HTMLElement) {
  $$('[data-split]', document).forEach((el) => {
    if (el.dataset.revealed) return;
    gsap.to($$('.wi', el), {
      y: 0, duration: 1.3, ease: 'expo.out', stagger: 0.035,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
  ScrollTrigger.batch($$('[data-reveal]', document).filter((el) => !el.dataset.revealed), {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, clearProps: 'transform' }),
  });
  // Les stickers apparaissent avec un rebond
  $$('[data-sticker]', main).filter((s) => !s.closest('[data-hero]')).forEach((s) => {
    gsap.fromTo(s, { scale: 0, rotate: -30 }, { scale: 1, rotate: 0, duration: 1.4, ease: 'elastic.out(1, 0.6)', scrollTrigger: { trigger: s, start: 'top 92%', once: true } });
  });
}

/* ---------- Compteurs ---------- */
function counters(main: HTMLElement) {
  $$('[data-count]', main).forEach((el) => {
    const to = parseFloat(el.dataset.count!);
    const decimals = parseInt(el.dataset.decimals ?? '0', 10);
    const group = el.dataset.group !== 'false';
    const fmt = (v: number) => v.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: group });
    const from = el.dataset.from ? parseFloat(el.dataset.from) : 0;
    const o = { v: from };
    el.textContent = fmt(from);
    gsap.to(o, {
      v: to, duration: 2.2, ease: 'expo.out',
      onUpdate: () => { el.textContent = fmt(o.v); },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}

/* ---------- Galerie horizontale épinglée ---------- */
function horizontal(main: HTMLElement) {
  $$('[data-hscroll]', main).forEach((section) => {
    const track = $('[data-hscroll-track]', section)!;
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 },
    });
  });
}

/* ---------- Parallaxe légère ---------- */
function parallax(main: HTMLElement) {
  if (reduced) return;
  $$('[data-speed]', main).forEach((el) => {
    const s = parseFloat(el.dataset.speed!);
    gsap.fromTo(el, { yPercent: -s * 50 }, { yPercent: s * 50, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('[data-sticker].sticker--spin', main).forEach((el) => {
    gsap.to(el.querySelector('img'), { rotate: 120, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* ---------- Boutons magnétiques ---------- */
function magnetic(signal: AbortSignal) {
  if (!matchMedia('(hover: hover)').matches) return;
  $$('[data-magnetic]').forEach((el) => {
    if (el.dataset.magneticBound && !el.closest('[data-page]')) return;
    el.dataset.magneticBound = '1';
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.3);
      yTo((e.clientY - r.top - r.height / 2) * 0.3);
    }, el.closest('[data-page]') ? { signal } : undefined);
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); }, el.closest('[data-page]') ? { signal } : undefined);
  });
}

/* ---------- Mots qui défilent (« votre ville ») ---------- */
function rotators(main: HTMLElement) {
  $$('[data-rotator]', main).forEach((el) => {
    const words = $$('span', el);
    if (words.length < 2) return;
    gsap.set(words, { yPercent: 110 });
    gsap.set(words[0], { yPercent: 0 });
    const tl = gsap.timeline({ repeat: -1 });
    words.forEach((w, i) => {
      const next = words[(i + 1) % words.length];
      tl.to(w, { yPercent: -110, duration: 0.9, ease: 'expo.inOut' }, '+=1.4')
        .fromTo(next, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.inOut' }, '<');
    });
    ScrollTrigger.create({ trigger: el, onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) });
  });
}

/* ---------- Formulaires ---------- */
function forms(main: HTMLElement, signal: AbortSignal) {
  // Candidature franchise : prépare un e-mail au directeur du développement
  $$<HTMLFormElement>('[data-franchise-form]', main).forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = new FormData(form);
      const lines = [
        `Nom : ${d.get('prenom')} ${d.get('nom')}`,
        `E-mail : ${d.get('email')}`,
        `Téléphone : ${d.get('tel')}`,
        `Ville / agglomération visée : ${d.get('ville')}`,
        `Apport personnel : ${d.get('apport')}`,
        `Expérience en restauration : ${d.get('experience')}`,
        '',
        String(d.get('message') ?? ''),
      ];
      const subject = `Candidature franchise Il Ristorante — ${d.get('ville')}`;
      location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      const msg = $('[data-form-msg]', form);
      if (msg) msg.textContent = 'Votre messagerie s’ouvre avec votre candidature prête à envoyer. Grazie !';
    }, { signal });
  });
}

/* ---------- Formulaire de contact : e-mail au restaurant choisi ---------- */
function contactForm(main: HTMLElement, signal: AbortSignal) {
  $$<HTMLFormElement>('[data-contact-form]', main).forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = new FormData(form);
      const select = form.querySelector<HTMLSelectElement>('[name="restaurant"]')!;
      const resto = select.selectedOptions[0]?.dataset.name ?? '';
      const to = String(d.get('restaurant') || 'contact@ilristorante.fr');
      const subject = `${d.get('objet')} — Il Ristorante ${resto}`;
      const body = [`${d.get('prenom')} ${d.get('nom')} (${d.get('email')})`, `Restaurant : ${resto}`, '', String(d.get('message') ?? '')].join('\n');
      location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const msg = $('[data-form-msg]', form);
      if (msg) msg.textContent = 'Votre messagerie s’ouvre avec votre message prêt à envoyer. Grazie !';
    }, { signal });
  });
}

/* ---------- Recherche de restaurant ---------- */
function filters(main: HTMLElement, signal: AbortSignal) {
  const input = $<HTMLInputElement>('[data-filter]', main);
  if (!input) return;
  const items = $$('[data-filter-item]', main);
  const empty = $('[data-filter-empty]', main);
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    let n = 0;
    items.forEach((it) => {
      const ok = (it.dataset.filterItem ?? '').includes(q);
      it.hidden = !ok;
      if (ok) n++;
    });
    $$('[data-filter-group]', main).forEach((g) => (g.hidden = !$$('[data-filter-item]', g).some((it) => !it.hidden)));
    if (empty) empty.hidden = n > 0;
    ScrollTrigger.refresh();
  }, { signal });
}

/* ---------- Carte de France animée au défilement ---------- */
function maps(main: HTMLElement) {
  $$('[data-map]', main).forEach((section) => {
    const outline = $<SVGPathElement>('.map-outline', section)!;
    const land = $<SVGPathElement>('.map-land', section)!;
    const pts = $$<SVGElement>('[data-map-pt]', section);
    const counter = $('[data-map-count]', section);
    const total = parseInt(counter?.dataset.total ?? '0', 10);
    const real = pts.filter((p) => !p.classList.contains('map-pt--zone'));
    if (reduced) {
      if (counter) counter.textContent = String(total);
      return;
    }
    const pinned = matchMedia('(min-width: 861px)').matches;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: pinned
        ? { trigger: section, start: 'top top', end: '+=180%', pin: true, scrub: 0.8, anticipatePin: 1 }
        : { trigger: section, start: 'top 75%', end: 'bottom 60%', scrub: 0.8 },
    });
    tl.to(outline, { strokeDashoffset: 0, duration: 1.2, ease: 'power1.inOut' })
      .to(land, { opacity: 1, duration: 0.4 }, '-=0.3');
    const step = 1.8 / Math.max(1, pts.length);
    pts.forEach((p, i) => {
      const at = 1.3 + i * step;
      tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.12 }, at);
      // Mise à l'échelle depuis le centre du point (et non du groupe point + étiquette)
      tl.fromTo($$('.core', p), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.25, ease: 'back.out(3)' }, at);
    });
    // Le compteur suit l'apparition des restaurants
    const c = { v: 0 };
    tl.to(c, {
      v: total,
      duration: 1.8,
      ease: 'none',
      onUpdate: () => { if (counter) counter.textContent = String(Math.round(c.v)); },
    }, 1.3);
    // Les noms des restaurants restent affichés une fois la carte complète
    tl.call(() => real.forEach((p) => p.classList.add('is-labelled')), [], 3.2)
      .to({}, { duration: 0.3 });
    tl.eventCallback('onUpdate', () => {
      if (tl.progress() < 0.97) real.forEach((p) => p.classList.remove('is-labelled'));
    });
  });
}

/* ---------- Parcours en étapes : la ligne se remplit, chaque étape s'allume ---------- */
function stepsLine(main: HTMLElement) {
  $$('[data-steps]', main).forEach((list) => {
    const fill = $('[data-steps-fill]', list);
    const items = $$('[data-step]', list);
    if (reduced) {
      items.forEach((it) => it.classList.add('is-on'));
      return;
    }
    if (fill) gsap.to(fill, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 65%', end: 'bottom 65%', scrub: 0.5 } });
    items.forEach((it) => ScrollTrigger.create({ trigger: it, start: 'top 66%', onToggle: (st) => it.classList.toggle('is-on', st.isActive || st.progress === 1), end: 'max' }));
  });
}

/* ---------- Vidéos : aperçu muet à l'écran, lecture avec le son au clic ---------- */
const player = $<HTMLDialogElement>('[data-player]');
const playerVideo = $<HTMLVideoElement>('[data-player-video]');
const playerTitle = $('[data-player-title]');
function closePlayer() {
  if (!player?.open) return;
  playerVideo?.pause();
  player.close();
  lenis.start();
}
$('[data-player-close]')?.addEventListener('click', closePlayer);
player?.addEventListener('close', () => { playerVideo?.pause(); lenis.start(); });
player?.addEventListener('click', (e) => { if (e.target === player) closePlayer(); });

function reels(main: HTMLElement) {
  const cards = $$<HTMLButtonElement>('[data-reel]', main);
  if (!cards.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const v = en.target.querySelector('video');
      if (!v || reduced) return;
      if (en.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
    });
  }, { threshold: 0.35 });
  cards.forEach((c) => io.observe(c));
  page?.signal.addEventListener('abort', () => io.disconnect());
  cards.forEach((c) => c.addEventListener('click', () => {
    if (!player || !playerVideo) return;
    const small = matchMedia('(max-width: 760px)').matches;
    playerVideo.src = (small ? c.dataset.srcSm : c.dataset.src) ?? '';
    playerVideo.poster = c.querySelector('video')?.poster ?? '';
    if (playerTitle) playerTitle.textContent = c.dataset.title ?? '';
    player.showModal();
    lenis.stop();
    playerVideo.currentTime = 0;
    playerVideo.play().catch(() => {});
  }, { signal: page!.signal }));
}
