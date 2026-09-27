import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initPaint } from './paint';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(s));

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const EASE = 'expo.out';

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
  if (lenis) lenis.scrollTo(target, { offset: 0, immediate, duration: 1.4 });
  else target.scrollIntoView({ behavior: reduced || immediate ? 'auto' : 'smooth' });
  return true;
};

/* ─── Découpe du texte (<em> conservé) ─────────────── */
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
      } else if (child instanceof Element) walk(child, [...tags, child]);
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
  let top = -1e9;
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

/* ─── Rideau : compteur au premier chargement, transitions ── */
const curtain = $('[data-curtain]')!;
const paintEl = $('.curtain__paint', curtain)!;
const inner = $('.curtain__in', curtain)!;
const count = $('[data-count]', curtain)!;

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
    const c = { v: 0 };
    tl.to(c, {
      v: 100,
      duration: 1.3,
      ease: 'power2.inOut',
      onUpdate: () => (count.textContent = String(Math.round(c.v)).padStart(2, '0')),
    }).to(inner, { yPercent: 30, opacity: 0, duration: 0.5, ease: 'power2.in' });
  } else gsap.set(inner, { opacity: 0 });
  tl.fromTo(
    paintEl,
    { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
    { clipPath: 'polygon(0 0, 100% 0, 100% 0%, 0 0%)', duration: 1 },
  ).set(curtain, { autoAlpha: 0 });
  return tl;
}

function leaveTo(href: string, color?: string) {
  if (reduced) return void (location.href = href);
  const c = color || '#6b1f2a';
  curtain.style.setProperty('--curtain', c);
  store.set('bl-next', c);
  gsap.set(inner, { opacity: 0 });
  gsap.set(curtain, { autoAlpha: 1 });
  gsap.fromTo(
    paintEl,
    { clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)' },
    { clipPath: 'polygon(0 0%, 100% 0%, 100% 100%, 0 100%)', duration: 0.8, ease: 'expo.inOut', onComplete: () => (location.href = href) },
  );
}

document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest('a');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
  const samePage = url.pathname === location.pathname;
  if (samePage && url.hash) {
    e.preventDefault();
    closeMenu(true);
    if (scrollToHash(url.hash)) history.replaceState(null, '', url.hash);
    return;
  }
  if (samePage) return;
  e.preventDefault();
  closeMenu(true);
  leaveTo(url.href);
});
addEventListener('pageshow', (e) => {
  if ((e as PageTransitionEvent).persisted) gsap.set(curtain, { autoAlpha: 0 });
});

/* ─── En-tête (clair sur fonds sombres), barre mobile ── */
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
function headerTheme() {
  const y = 38;
  const el = document.elementsFromPoint(innerWidth / 2, y).find((n) => !header.contains(n) && !n.closest('.cursor, .curtain, .menu'));
  const dark = !!el?.closest('.dark, .wine, [data-dark-hero]');
  header.classList.toggle('is-light', dark);
}
function onScroll() {
  const y = scrollY;
  if (!document.documentElement.classList.contains('menu-open')) {
    header.classList.toggle('is-hidden', y > 500 && y > lastY + 2);
    if (y < lastY - 2) header.classList.remove('is-hidden');
  }
  mbar?.classList.toggle('is-visible', y > innerHeight * 0.7 && !contactVisible);
  headerTheme();
  lastY = y;
}
addEventListener('scroll', onScroll, { passive: true });

/* ─── Menu ──────────────────────────────────────────── */
const burger = $('[data-burger]');
const burgerLabel = $('[data-burger-label]');
const menu = $('[data-menu]')!;
const menuBg = $('[data-menu-bg]')!;
let menuTl: gsap.core.Timeline | null = null;
function openMenu() {
  document.documentElement.classList.add('menu-open');
  header.classList.remove('is-hidden');
  burger?.setAttribute('aria-expanded', 'true');
  if (burgerLabel) burgerLabel.textContent = 'Fermer';
  menu.setAttribute('aria-hidden', 'false');
  lenis?.stop();
  menuTl?.kill();
  menuTl = gsap
    .timeline()
    .fromTo(menuBg, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: reduced ? 0 : 0.8, ease: 'expo.inOut' })
    .fromTo($$('.menu__a .display', menu), { yPercent: 110 }, { yPercent: 0, duration: reduced ? 0 : 0.9, stagger: 0.05, ease: EASE }, '-=0.35')
    .fromTo($$('.menu__n, .menu__foot', menu), { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.6');
}
function closeMenu(instant = false) {
  if (!document.documentElement.classList.contains('menu-open')) return;
  burger?.setAttribute('aria-expanded', 'false');
  if (burgerLabel) burgerLabel.textContent = 'Menu';
  menu.setAttribute('aria-hidden', 'true');
  lenis?.start();
  menuTl?.kill();
  const done = () => document.documentElement.classList.remove('menu-open');
  if (instant || reduced) return done();
  menuTl = gsap
    .timeline({ onComplete: done })
    .to($$('.menu__a .display', menu), { yPercent: -110, duration: 0.4, stagger: 0.03, ease: 'power2.in' })
    .to(menuBg, { clipPath: 'inset(100% 0 0% 0)', duration: 0.7, ease: 'expo.inOut' }, 0.15);
}
burger?.addEventListener('click', () => (document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu()));
addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

/* ─── Curseur & aimants ─────────────────────────────── */
if (finePointer && !reduced) {
  document.documentElement.classList.add('has-cursor');
  const cur = $('[data-cursor]')!;
  const xTo = gsap.quickTo(cur, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.45, ease: 'power3' });
  addEventListener('pointermove', (e) => {
    cur.classList.add('is-on');
    xTo(e.clientX);
    yTo(e.clientY);
  });
  document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
  document.addEventListener('pointerover', (e) => {
    const t = e.target as HTMLElement;
    const link = !!t.closest('a, button, summary, label, .ba__frame');
    cur.classList.toggle('is-link', link);
    cur.classList.toggle('is-brush', !link && !!t.closest('[data-phero]'));
  });
  $$('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.2);
      y((e.clientY - r.top - r.height / 2) * 0.3);
    });
    el.addEventListener('pointerleave', () => {
      x(0);
      y(0);
    });
  });
}

/* ─── Hero ─────────────────────────────────────────── */
function heroIn() {
  const tl = gsap.timeline({ defaults: { ease: EASE } });
  const title = $('[data-hero-title]');
  if (title) tl.to($$('.line-inner', title), { y: 0, duration: 1.5, stagger: 0.1 }, 0);
  tl.to($$('[data-hero-fade]'), { y: 0, opacity: 1, duration: 1.2, stagger: 0.08 }, 0.3);
  return tl;
}

/* ─── Apparitions ──────────────────────────────────── */
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
    onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 1.1, stagger: 0.07, ease: EASE }),
  });
  $$('[data-words]').forEach((el) => {
    const words = wrapWords(el);
    gsap.fromTo(
      words,
      { opacity: 0.12 },
      { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true } },
    );
  });
}

/* ─── Bandeau défilant, accéléré par le scroll ─────── */
function marquee() {
  $$('[data-marquee-track]').forEach((track) => {
    let x = 0;
    let boost = 0;
    const speed = 0.6;
    const half = () => track.scrollWidth / 2;
    ScrollTrigger.create({
      trigger: track,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => (boost = Math.min(Math.abs(self.getVelocity()) / 120, 14) * self.direction),
    });
    gsap.ticker.add(() => {
      if (reduced) return;
      boost *= 0.92;
      x -= speed + boost;
      const h = half();
      if (x <= -h) x += h;
      if (x > 0) x -= h;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  });
}

/* ─── 02 · Le geste : la vidéo s'ouvre plein écran ─── */
function geste() {
  const sec = $('[data-geste]');
  if (!sec || reduced) {
    if (sec) gsap.set($('[data-geste-frame]', sec), { clipPath: 'inset(0% 0% 0% 0%)' });
    return;
  }
  gsap
    .timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.6 } })
    .fromTo($('[data-geste-frame]', sec), { clipPath: 'inset(22% 18% 22% 18%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, 0)
    .fromTo($('[data-geste-l]', sec), { xPercent: 0 }, { xPercent: -80, ease: 'none' }, 0)
    .fromTo($('[data-geste-r]', sec), { xPercent: 0 }, { xPercent: 60, ease: 'none' }, 0);
}

/* ─── 03 · Avant / après ───────────────────────────── */
function beforeAfter() {
  const demos: (() => void)[] = [];
  $$('[data-ba]').forEach((ba, idx) => {
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
    const demo = () => {
      if (reduced) return;
      gsap.killTweensOf(state);
      gsap
        .timeline({ delay: 0.3, onUpdate: () => set(state.x) })
        .to(state, { x: 12, duration: 1, ease: 'power2.inOut' })
        .to(state, { x: 88, duration: 1.3, ease: 'power2.inOut' })
        .to(state, { x: 50, duration: 0.9, ease: 'power3.out' });
    };
    demos[idx] = demo;
    if (idx === 0) ScrollTrigger.create({ trigger: frame, start: 'top 70%', once: true, onEnter: demo });
  });
  $$('[data-bax]').forEach((box) => {
    const tabs = $$<HTMLButtonElement>('[data-ba-tab]', box);
    const panels = $$('[data-ba]', box);
    const all = $$('[data-ba]');
    const show = (i: number, focus = false) => {
      tabs.forEach((t, j) => {
        t.setAttribute('aria-selected', String(j === i));
        t.tabIndex = j === i ? 0 : -1;
      });
      panels.forEach((p, j) => (p.hidden = j !== i));
      if (focus) tabs[i].focus();
      if (!reduced) gsap.fromTo(panels[i], { opacity: 0 }, { opacity: 1, duration: 0.5 });
      demos[all.indexOf(panels[i])]?.();
      ScrollTrigger.refresh();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(i));
      t.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) show((i + d + tabs.length) % tabs.length, true);
      });
    });
  });
}

/* ─── 04 · Réalisations : image qui suit le curseur ── */
function works() {
  const float = $('[data-works-float]');
  const items = $$('[data-work]');
  if (!float || !items.length || !finePointer) return;
  const imgs = $$('img', float);
  const xTo = gsap.quickTo(float, 'x', { duration: 0.7, ease: 'power3' });
  const yTo = gsap.quickTo(float, 'y', { duration: 0.7, ease: 'power3' });
  const rTo = gsap.quickTo(float, 'rotation', { duration: 0.9, ease: 'power3' });
  let px = 0;
  items.forEach((it, i) => {
    it.addEventListener('pointerenter', () => {
      float.classList.add('is-on');
      imgs.forEach((im, j) => im.classList.toggle('is-on', j === i));
    });
    it.addEventListener('pointerleave', () => float.classList.remove('is-on'));
    it.addEventListener('pointermove', (e) => {
      const w = float.offsetWidth;
      const h = float.offsetHeight;
      xTo(e.clientX - w / 2);
      yTo(e.clientY - h / 2);
      rTo(Math.max(-8, Math.min(8, (e.clientX - px) * 0.4)));
      px = e.clientX;
    });
  });
}

/* ─── 06 · Déroulement : piste horizontale (bureau) ── */
function steps() {
  const sec = $('[data-steps]');
  const track = $('[data-steps-track]');
  const bar = $('[data-steps-bar]');
  if (!sec || !track || reduced) return;
  ScrollTrigger.matchMedia({
    '(min-width: 1024px)': () => {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: $('.steps__pin', sec), scrub: 0.6, invalidateOnRefresh: true },
      });
      tl.to(track, { x: () => -dist(), ease: 'none' }, 0);
      if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0);
    },
  });
}

/* ─── Parallaxe & vidéos ───────────────────────────── */
function parallax() {
  if (reduced) return;
  $$('[data-parallax]').forEach((img) => {
    const wrap = img.closest('[data-parallax-wrap]') ?? img.parentElement!;
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}
function autoVideos() {
  $$<HTMLVideoElement>('[data-autovideo]').forEach((v) => {
    if (reduced) return;
    new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting) {
          if (v.preload === 'none') {
            const src = v.querySelector<HTMLSourceElement>('source');
            if (src?.dataset.srcSm && innerWidth <= 800) {
              src.src = src.dataset.srcSm;
              v.load();
            }
            v.preload = 'auto';
          }
          v.play().catch(() => {});
        } else v.pause();
      },
      { threshold: 0.1 },
    ).observe(v);
  });
}

/* ─── FAQ ──────────────────────────────────────────── */
function faq() {
  $$<HTMLDetailsElement>('.faq__item').forEach((d) => {
    const sum = $('summary', d)!;
    const body = $('.faq__a', d)!;
    sum.addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open) {
        d.classList.remove('is-open');
        gsap.to(body, {
          height: 0,
          duration: reduced ? 0 : 0.5,
          ease: 'power3.inOut',
          onComplete: () => {
            d.open = false;
            ScrollTrigger.refresh();
          },
        });
      } else {
        d.open = true;
        d.classList.add('is-open');
        gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: reduced ? 0 : 0.6, ease: 'power3.out', onComplete: () => ScrollTrigger.refresh() });
      }
    });
  });
}

/* ─── Formulaire → messagerie pré-remplie ──────────── */
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
    if (!ok) return void (note.textContent = 'Merci d’indiquer votre nom et votre téléphone.');
    const data = new FormData(f);
    const travaux = data.getAll('travaux').join(', ') || 'non précisé';
    const commune = (data.get('commune') as string) || 'non précisée';
    const body = [`Nom : ${data.get('nom')}`, `Téléphone : ${data.get('tel')}`, `Commune : ${commune}`, `Travaux : ${travaux}`, '', (data.get('message') as string) || ''].join('\n');
    const to = $<HTMLAnchorElement>('.contact__mail a')?.href.replace('mailto:', '') ?? '';
    location.href = `mailto:${to}?subject=${encodeURIComponent(`Demande de devis peinture — ${commune}`)}&body=${encodeURIComponent(body)}`;
    note.textContent = 'Votre messagerie s’ouvre : il ne reste qu’à envoyer.';
  });
}

/* ─── Lancement ────────────────────────────────────── */
function init() {
  document.documentElement.classList.add('ready');
  const title = $('[data-hero-title]');
  if (title && !reduced) gsap.set($$('.line-inner', title), { y: '105%' });
  if (!reduced) gsap.set($$('[data-hero-fade]'), { y: 24, opacity: 0 });

  const phero = $('[data-phero]');
  const paint = phero ? initPaint(phero, reduced) : null;

  reveals();
  marquee();
  geste();
  beforeAfter();
  works();
  steps();
  parallax();
  autoVideos();
  faq();
  form();
  onScroll();

  const intro = introCurtain();
  if (!reduced) intro.add(heroIn(), '-=0.6');
  intro.call(() => paint?.intro(), [], '-=0.9');

  if (location.hash) requestAnimationFrame(() => scrollToHash(location.hash, true));

  let w = innerWidth;
  let to: number | undefined;
  addEventListener('resize', () => {
    if (innerWidth === w) return;
    w = innerWidth;
    clearTimeout(to);
    to = window.setTimeout(() => {
      $$('[data-split]').forEach((el) => gsap.set(splitLines(el), { y: 0 }));
      ScrollTrigger.refresh();
    }, 200);
  });
}

if (document.fonts?.ready) document.fonts.ready.then(init);
else addEventListener('load', init);
