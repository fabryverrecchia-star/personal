import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(s));

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const EASE = 'expo.out';

/* ─── Défilement doux ─────────────────────────────── */
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

const scrollToHash = (hash: string, immediate = false) => {
  const target = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (!target) return false;
  if (lenis) lenis.scrollTo(target, { offset: -20, immediate, duration: 1.4 });
  else target.scrollIntoView({ behavior: reduced || immediate ? 'auto' : 'smooth' });
  return true;
};

/* ─── Découpe du texte (lignes / mots), <em> conservé ── */
function wrapWords(el: HTMLElement) {
  const words: HTMLElement[] = [];
  const frag = document.createDocumentFragment();
  const walk = (node: Node, tags: Element[]) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        (child.textContent ?? '').split(/(\s+)/).forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) return void frag.appendChild(document.createTextNode(' '));
          let content: Node = document.createTextNode(p);
          for (const t of [...tags].reverse()) {
            const c = t.cloneNode(false);
            c.appendChild(content);
            content = c;
          }
          const w = document.createElement('span');
          w.className = 'w';
          w.appendChild(content);
          words.push(w);
          frag.appendChild(w);
        });
      } else if (child instanceof Element) {
        walk(child, [...tags, child]);
      }
    });
  };
  walk(el, []);
  el.innerHTML = '';
  el.appendChild(frag);
  return words;
}

function splitLines(el: HTMLElement) {
  if (!el.dataset.src) el.dataset.src = el.innerHTML;
  el.innerHTML = el.dataset.src;
  const words = wrapWords(el);
  const lines: HTMLElement[][] = [];
  let top = -1;
  words.forEach((w) => {
    const t = w.offsetTop;
    if (Math.abs(t - top) > 4) {
      lines.push([]);
      top = t;
    }
    lines[lines.length - 1].push(w);
  });
  el.innerHTML = '';
  lines.forEach((ws) => {
    const line = document.createElement('span');
    line.className = 'line';
    const inner = document.createElement('span');
    inner.className = 'line-inner';
    ws.forEach((w, i) => {
      inner.appendChild(w);
      if (i < ws.length - 1) inner.appendChild(document.createTextNode(' '));
    });
    line.appendChild(inner);
    el.appendChild(line);
  });
  return $$('.line-inner', el);
}

const store = {
  get: (k: string) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      sessionStorage.setItem(k, v);
    } catch {}
  },
  del: (k: string) => {
    try {
      sessionStorage.removeItem(k);
    } catch {}
  },
};

/* ─── Rideau de peinture (intro + transitions) ──────── */
const curtain = $('[data-curtain]')!;
const paint = $('.curtain__paint', curtain)!;
const label = $('.curtain__label', curtain)!;

function introCurtain() {
  const first = !store.get('bl-seen');
  store.set('bl-seen', '1');
  const next = store.get('bl-next');
  if (next) {
    curtain.style.setProperty('--curtain', next);
    store.del('bl-next');
  }
  if (reduced) {
    gsap.set(curtain, { autoAlpha: 0 });
    return gsap.timeline();
  }
  const tl = gsap.timeline({ defaults: { ease: 'expo.inOut' } });
  if (first) {
    tl.fromTo(label, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: EASE })
      .to(label, { opacity: 0, y: -20, duration: 0.5, ease: 'power2.in' }, '+=0.25');
  }
  tl.fromTo(
    paint,
    { clipPath: 'inset(0% 0% 0% 0%)' },
    { clipPath: 'inset(0% 0% 100% 0%)', duration: first ? 1.1 : 0.9 },
  ).set(curtain, { autoAlpha: 0 });
  return tl;
}

function leaveTo(href: string, color?: string) {
  if (reduced) {
    location.href = href;
    return;
  }
  const c = color || getComputedStyle(document.documentElement).getPropertyValue('--ink');
  curtain.style.setProperty('--curtain', c);
  store.set('bl-next', c);
  gsap.set(label, { opacity: 0 });
  gsap.set(curtain, { autoAlpha: 1 });
  gsap.fromTo(
    paint,
    { clipPath: 'inset(100% 0% 0% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'expo.inOut', onComplete: () => (location.href = href) },
  );
}

document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest('a');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  const samePage = url.pathname === location.pathname;
  if (samePage && url.hash) {
    e.preventDefault();
    closeMenu();
    if (scrollToHash(url.hash)) history.replaceState(null, '', url.hash);
    return;
  }
  if (samePage) return;
  e.preventDefault();
  closeMenu(true);
  const color = getComputedStyle(a).getPropertyValue('--c').trim();
  leaveTo(url.href, color || undefined);
});

// Retour arrière (bfcache) : on retire le rideau
addEventListener('pageshow', (e) => {
  if ((e as PageTransitionEvent).persisted) gsap.set(curtain, { autoAlpha: 0 });
});

/* ─── En-tête, barre mobile ─────────────────────────── */
const header = $('[data-header]')!;
const mbar = $('[data-mbar]');
const contact = $('#contact');
let lastY = 0;
let contactVisible = false;
if (contact && mbar) {
  new IntersectionObserver(([en]) => {
    contactVisible = en.isIntersecting;
    onScroll();
  }).observe(contact);
}
const darkHero = $('[data-dark-hero]');
function onScroll() {
  const y = scrollY;
  header.classList.toggle('is-scrolled', y > 20);
  header.classList.toggle('is-light', !!darkHero && y <= 20);
  if (!document.documentElement.classList.contains('menu-open')) {
    header.classList.toggle('is-hidden', y > 400 && y > lastY + 2);
    if (y < lastY - 2) header.classList.remove('is-hidden');
  }
  mbar?.classList.toggle('is-visible', y > innerHeight * 0.55 && !contactVisible);
  lastY = y;
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ─── Menu mobile ───────────────────────────────────── */
const burger = $('[data-burger]');
const menu = $('[data-menu]')!;
const menuBg = $('[data-menu-bg]')!;
let menuTl: gsap.core.Timeline | null = null;

function openMenu() {
  document.documentElement.classList.add('menu-open');
  header.classList.remove('is-hidden');
  burger?.setAttribute('aria-expanded', 'true');
  menu.setAttribute('aria-hidden', 'false');
  lenis?.stop();
  menuTl?.kill();
  menuTl = gsap
    .timeline()
    .fromTo(menuBg, { clipPath: 'circle(0% at calc(100% - 40px) 36px)' }, { clipPath: 'circle(150% at calc(100% - 40px) 36px)', duration: reduced ? 0 : 0.9, ease: 'expo.inOut' })
    .fromTo($$('[data-menu-link]', menu), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: reduced ? 0 : 0.8, stagger: 0.05, ease: EASE }, '-=0.45');
}
function closeMenu(instant = false) {
  if (!document.documentElement.classList.contains('menu-open')) return;
  burger?.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
  lenis?.start();
  menuTl?.kill();
  const done = () => document.documentElement.classList.remove('menu-open');
  if (instant || reduced) {
    done();
    return;
  }
  menuTl = gsap
    .timeline({ onComplete: done })
    .to($$('[data-menu-link]', menu), { opacity: 0, duration: 0.25 })
    .to(menuBg, { clipPath: 'circle(0% at calc(100% - 40px) 36px)', duration: 0.7, ease: 'expo.inOut' }, 0.05);
}
burger?.addEventListener('click', () =>
  document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu(),
);
addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

/* ─── Curseur & boutons magnétiques ─────────────────── */
if (finePointer && !reduced) {
  document.documentElement.classList.add('has-cursor');
  const cur = $('[data-cursor]')!;
  const dot = cur.firstElementChild as HTMLElement;
  const xTo = gsap.quickTo(cur, 'x', { duration: 0.5, ease: 'power3' });
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.5, ease: 'power3' });
  document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
  addEventListener('pointermove', (e) => {
    cur.classList.add('is-on');
    xTo(e.clientX);
    yTo(e.clientY);
  });
  document.addEventListener('pointerover', (e) => {
    const t = e.target as HTMLElement;
    const link = t.closest('a, button, summary, label');
    cur.classList.toggle('is-link', !!link);
    const c = t.closest<HTMLElement>('[data-zrow], [data-card], .nu, .fan__strip');
    dot.style.backgroundColor = c ? getComputedStyle(c).getPropertyValue('--c') : '';
  });

  $$('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.25);
      y((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      x(0);
      y(0);
    });
  });
}

/* ─── Hero ──────────────────────────────────────────── */
function heroIn() {
  const tl = gsap.timeline({ defaults: { ease: EASE } });
  const title = $('[data-hero-title]');
  if (title) tl.to($$('.line-inner', title), { y: 0, duration: 1.4, stagger: 0.09 }, 0);
  const brush = $('[data-brush]');
  if (brush) tl.to(brush, { strokeDashoffset: 0, duration: 1.3, ease: 'power3.inOut' }, 0.55);
  tl.to($$('[data-hero-fade]'), { y: 0, opacity: 1, duration: 1.2, stagger: 0.1 }, 0.35);

  return tl;
}

function beforeAfter() {
  $$('[data-ba]').forEach((ba) => {
    const frame = $('.ba__frame', ba)!;
    const range = $<HTMLInputElement>('[data-ba-range]', ba)!;
    const state = { x: 50 };
    const set = (x: number) => {
      state.x = Math.max(0, Math.min(100, x));
      frame.style.setProperty('--x', state.x + '%');
      range.value = String(state.x);
    };
    range.addEventListener('input', () => set(+range.value));
    let dragging = false;
    const fromEvent = (e: PointerEvent) => {
      const r = frame.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    };
    frame.addEventListener('pointerdown', (e) => {
      dragging = true;
      gsap.killTweensOf(state);
      frame.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    frame.addEventListener('pointermove', (e) => dragging && fromEvent(e));
    const stop = () => (dragging = false);
    frame.addEventListener('pointerup', stop);
    frame.addEventListener('pointercancel', stop);
    // Petite démonstration du geste à l'apparition
    if (!reduced) {
      ScrollTrigger.create({
        trigger: frame,
        start: 'top 75%',
        once: true,
        onEnter: () =>
          gsap
            .timeline({ delay: 0.6, onUpdate: () => set(state.x) })
            .to(state, { x: 22, duration: 0.9, ease: 'power2.inOut' })
            .to(state, { x: 72, duration: 1.1, ease: 'power2.inOut' })
            .to(state, { x: 50, duration: 0.8, ease: 'power2.out' }),
      });
    }
  });
}

function fanReveal() {
  const strips = $$('[data-fan-strip]');
  if (!strips.length) return;
  const angle = (_i: number, el: HTMLElement) => parseFloat(el.style.getPropertyValue('--a'));
  if (reduced) return void gsap.set(strips, { rotation: angle, opacity: 1 });
  gsap.set(strips, { rotation: 0, yPercent: 20, opacity: 0 });
  ScrollTrigger.create({
    trigger: strips[0].closest('[data-fan]'),
    start: 'top 80%',
    once: true,
    onEnter: () =>
      gsap.to(strips, { rotation: angle, yPercent: 0, opacity: 1, duration: 1.6, stagger: { each: 0.05, from: 'center' }, ease: 'expo.out' }),
  });
}

/* ─── Apparitions au défilement ─────────────────────── */
function reveals() {
  $$('[data-split]').forEach((el) => {
    const lines = splitLines(el);
    gsap.set(lines, { y: '105%' });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => gsap.to($$('.line-inner', el), { y: 0, duration: 1.3, stagger: 0.08, ease: EASE }),
    });
  });

  ScrollTrigger.batch('[data-reveal="fade"]', {
    start: 'top 92%',
    once: true,
    onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 1.1, stagger: 0.08, ease: EASE }),
  });

  $$('[data-words]').forEach((el) => {
    const words = wrapWords(el);
    gsap.fromTo(
      words,
      { opacity: 0.14 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true },
      },
    );
  });

  // Cartes empilées
  const cards = $$('[data-card]');
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.to($('.card__in', card), {
      scale: 0.95,
      ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 25%', scrub: true },
    });
  });

  $$('[data-step]').forEach((st) => {
    ScrollTrigger.create({
      trigger: st,
      start: 'top 72%',
      onEnter: () => st.classList.add('is-on'),
      onLeaveBack: () => st.classList.remove('is-on'),
    });
  });

  if (!reduced) {
    $$('[data-work-media]').forEach((m) => {
      gsap.fromTo(
        m,
        { clipPath: 'inset(12% 8% 12% 8% round 14px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 14px)', ease: 'none', scrollTrigger: { trigger: m, start: 'top 95%', end: 'top 45%', scrub: true } },
      );
      gsap.fromTo($('img', m), { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  // Ligne de progression des étapes
  const steps = $('[data-steps]');
  const line = $('[data-steps-line]');
  if (steps && line) {
    gsap.fromTo(
      line,
      { '--p': 0 },
      { '--p': 1, ease: 'none', scrollTrigger: { trigger: steps, start: 'top 75%', end: 'bottom 60%', scrub: true } },
    );
  }
}

/* ─── Nuancier interactif ───────────────────────────── */
function nuancier() {
  const sec = $('[data-nuancier]');
  if (!sec) return;
  const btns = $$<HTMLButtonElement>('[data-nu]', sec);
  const name = $('[data-nu-name]', sec)!;
  const lieu = $('[data-nu-lieu]', sec)!;
  const hex = $('[data-nu-hex]', sec)!;
  const meta = document.querySelector('meta[name="theme-color"]');
  let idx = btns.findIndex((b) => b.getAttribute('aria-checked') === 'true');
  let auto: number | undefined;
  let inView = false;

  const select = (i: number, focus = false) => {
    idx = (i + btns.length) % btns.length;
    const b = btns[idx];
    btns.forEach((o) => {
      o.setAttribute('aria-checked', String(o === b));
      o.tabIndex = o === b ? 0 : -1;
    });
    if (focus) b.focus();
    sec.style.setProperty('--nu', b.dataset.hex!);
    sec.style.setProperty('--nu-ink', b.dataset.ink!);
    if (inView) meta?.setAttribute('content', b.dataset.hex!);
    const swap = () => {
      name.textContent = b.dataset.nom!;
      lieu.textContent = b.dataset.lieu!;
      hex.textContent = b.dataset.hex!;
    };
    if (reduced) return swap();
    gsap
      .timeline()
      .to(name, { yPercent: -30, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: swap })
      .fromTo(name, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: EASE });
  };
  const stop = () => clearInterval(auto);
  btns.forEach((b, i) => {
    b.tabIndex = i === idx ? 0 : -1;
    b.addEventListener('click', () => {
      stop();
      select(i);
    });
    b.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      stop();
      select(idx + d, true);
    });
  });
  let touched = false;
  sec.addEventListener('pointerdown', () => (touched = true), { once: true });
  new IntersectionObserver(
    ([en]) => {
      inView = en.isIntersecting;
      stop();
      if (inView && !reduced && !touched) auto = window.setInterval(() => select(idx + 1), 2600);
      if (!inView) meta?.setAttribute('content', '#efeae0');
    },
    { threshold: 0.45 },
  ).observe(sec);
}

/* ─── FAQ animée ────────────────────────────────────── */
function faq() {
  $$<HTMLDetailsElement>('.faq__item').forEach((d) => {
    const sum = $('summary', d)!;
    const body = $('.faq__a', d)!;
    sum.addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open) {
        gsap.to(body, {
          height: 0,
          duration: reduced ? 0 : 0.5,
          ease: 'power3.inOut',
          onComplete: () => {
            d.open = false;
            ScrollTrigger.refresh();
          },
        });
        d.classList.remove('is-open');
      } else {
        d.open = true;
        d.classList.add('is-open');
        gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: reduced ? 0 : 0.6, ease: 'power3.out', onComplete: () => ScrollTrigger.refresh() });
      }
    });
  });
}

/* ─── Formulaire → messagerie pré-remplie ───────────── */
function form() {
  const f = $<HTMLFormElement>('[data-form]');
  if (!f) return;
  const note = $('[data-form-note]', f)!;
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    $$<HTMLInputElement>('[required]', f).forEach((i) => {
      const bad = !i.value.trim();
      i.setAttribute('aria-invalid', String(bad));
      if (bad && ok) {
        i.focus();
        ok = false;
      }
    });
    if (!ok) {
      note.textContent = 'Merci d’indiquer votre nom et votre téléphone.';
      return;
    }
    const data = new FormData(f);
    const travaux = data.getAll('travaux').join(', ') || 'non précisé';
    const commune = (data.get('commune') as string) || 'non précisée';
    const body = [
      `Nom : ${data.get('nom')}`,
      `Téléphone : ${data.get('tel')}`,
      `Commune : ${commune}`,
      `Travaux : ${travaux}`,
      '',
      (data.get('message') as string) || '',
    ].join('\n');
    const to = $<HTMLAnchorElement>('.contact__mail a')?.href.replace('mailto:', '') ?? '';
    location.href = `mailto:${to}?subject=${encodeURIComponent(`Demande de devis peinture — ${commune}`)}&body=${encodeURIComponent(body)}`;
    note.textContent = 'Merci ! Votre messagerie s’ouvre : il ne reste qu’à envoyer.';
  });
}

/* ─── Lancement ─────────────────────────────────────── */
function init() {
  // État initial des éléments du hero
  const title = $('[data-hero-title]');
  if (title && !reduced) gsap.set($$('.line-inner', title), { y: '105%' });
  if (!reduced) gsap.set($$('[data-hero-fade]'), { y: 30, opacity: 0 });

  document.documentElement.classList.add('ready');
  reveals();
  beforeAfter();
  fanReveal();
  nuancier();
  faq();
  form();

  const intro = introCurtain();
  if (!reduced) intro.add(heroIn(), '-=0.55');

  if (location.hash) requestAnimationFrame(() => scrollToHash(location.hash, true));

  // Recalcul des lignes quand la largeur change
  let w = innerWidth;
  let to: number | undefined;
  addEventListener('resize', () => {
    if (innerWidth === w) return;
    w = innerWidth;
    clearTimeout(to);
    to = window.setTimeout(() => {
      $$('[data-split]').forEach((el) => {
        const lines = splitLines(el);
        gsap.set(lines, { y: 0 });
      });
      ScrollTrigger.refresh();
    }, 200);
  });
}

if (document.fonts?.ready) document.fonts.ready.then(init);
else addEventListener('load', init);
