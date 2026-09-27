import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
// Évite les sauts quand la barre d'adresse mobile apparaît / disparaît
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(s));

// Animations voulues sur tous les appareils (demande du client)
const reduced = false;
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
};

/* ─── Défilement doux ─────────────────────────────── */
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 }); // doigt : défilement natif du téléphone
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToHash = (hash: string, immediate = false) => {
  const target = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (!target) return false;
  if (lenis) lenis.scrollTo(target, { immediate, duration: 1.6 });
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

/* ─── Préchargement & transitions ──────────────────── */
const loader = $('[data-loader]')!;
const loaderBg = $('[data-loader-bg]', loader)!;
const stack = $('[data-loader-stack]', loader)!;
const mono = $('[data-loader-mono]', loader)!;
const count = $('[data-loader-count]', loader)!;
const foot = $('.loader__foot', loader)!;

/* Préchargement réel : toutes les images de la page, la vidéo et les polices */
function loadAssets(onProgress: (p: number) => void) {
  const imgs = $$<HTMLImageElement>('img');
  const video = $<HTMLVideoElement>('[data-autovideo]');
  let done = 0;
  const total = imgs.length + (video ? 1 : 0) + 1;
  const tick = () => onProgress(++done / total);
  const jobs: Promise<unknown>[] = imgs.map((img) => {
    img.loading = 'eager';
    const p =
      img.complete && img.naturalWidth
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.addEventListener('load', () => res(), { once: true });
            img.addEventListener('error', () => res(), { once: true });
          });
    return p.then(() => img.decode?.().catch(() => {})).then(tick);
  });
  if (video) {
    prepareVideo(video);
    jobs.push(
      new Promise<void>((res) => {
        if (video.readyState >= 3) return res();
        video.addEventListener('canplay', () => res(), { once: true });
        video.addEventListener('error', () => res(), { once: true });
        setTimeout(res, 5000);
      }).then(tick),
    );
  }
  jobs.push((document.fonts?.ready ?? Promise.resolve()).then(tick));
  // Sécurité : on n’attend jamais plus de 12 s
  return Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 12000))]);
}

function prepareVideo(v: HTMLVideoElement) {
  if (v.dataset.ready) return;
  v.dataset.ready = '1';
  const src = v.querySelector<HTMLSourceElement>('source');
  if (src?.dataset.srcSm && innerWidth <= 800) src.src = src.dataset.srcSm;
  v.preload = 'auto';
  v.load();
}

function preload(onDone: () => void) {
  const floats = $$('[data-float]');
  const imgs = $$('img', stack);
  const home = floats.length > 0;
  const started = performance.now();
  const minTime = home ? 2600 : 1200;

  // Compteur qui suit la progression réelle
  const c = { v: 0 };
  const show = () => (count.textContent = String(Math.round(c.v)).padStart(3, '0'));
  let target = 0;
  const onProgress = (p: number) => {
    target = Math.max(target, p * 96);
    gsap.to(c, { v: target, duration: 0.6, ease: 'power2.out', onUpdate: show, overwrite: true });
  };

  gsap.set(mono, { opacity: 0, yPercent: 20, clipPath: 'inset(100% 0 0 0)' });
  gsap.to(mono, { opacity: 1, yPercent: 0, clipPath: 'inset(0% 0 0 0)', duration: 1.1, ease: 'expo.out' });

  // Feuilletage des photos en boucle tant que le contenu charge
  let flip: gsap.core.Timeline | null = null;
  if (home) {
    flip = gsap.timeline({ repeat: -1 });
    imgs.forEach((img, i) => {
      flip!.fromTo(
        img,
        { opacity: 0, clipPath: 'inset(100% 0 0 0)', scale: 1.15, zIndex: i + 1 },
        { opacity: 1, clipPath: 'inset(0% 0 0 0)', scale: 1, duration: 0.6, ease: 'power3.out' },
        0.3 + i * 0.34,
      );
    });
  } else gsap.set(stack, { opacity: 0 });

  const minDelay = new Promise((r) => setTimeout(r, minTime));
  Promise.all([loadAssets(onProgress), minDelay]).then(() => {
    const exit = gsap.timeline({ onComplete: onDone });
    exit.to(c, { v: 100, duration: 0.5, ease: 'power2.out', onUpdate: show, overwrite: true });
    if (!home) {
      exit
        .to([mono, foot], { opacity: 0, duration: 0.35 })
        .to(loaderBg, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' })
        .set(loader, { autoAlpha: 0 });
      return;
    }
    // Termine le feuilletage sur la dernière photo, puis envol vers l'ouverture
    exit.add(() => {
      flip?.pause();
      imgs.forEach((img) => gsap.set(img, { opacity: 1, scale: 1, clipPath: 'none' }));
    });
    exit.to([mono, foot], { opacity: 0, duration: 0.4 });
    exit.add(() => {
      const sr = stack.getBoundingClientRect();
      imgs.forEach((img, i) => {
        const f = floats[i];
        const visible = f && f.offsetParent !== null && getComputedStyle(f).display !== 'none';
        if (!visible) return void gsap.to(img, { opacity: 0, duration: 0.5 });
        const tr = f.getBoundingClientRect();
        gsap.to(img, {
          x: tr.left - sr.left,
          y: tr.top - sr.top,
          scaleX: tr.width / sr.width,
          scaleY: tr.height / sr.height,
          transformOrigin: '0 0',
          duration: 1.4,
          delay: (imgs.length - 1 - i) * 0.05,
          ease: 'expo.inOut',
        });
      });
    });
    exit.to(loaderBg, { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, '<0.25');
    exit.add(() => {
      floats.forEach((f, i) => {
        if (i < imgs.length) gsap.set(f, { opacity: 1 });
        else gsap.fromTo(f, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1.2, ease: EASE });
      });
      gsap.set(loader, { autoAlpha: 0 });
    }, '>+0.35');
  });
}

function leaveTo(href: string) {
  if (reduced) return void (location.href = href);
  gsap.set([mono, foot, stack], { opacity: 0 });
  gsap.set(loader, { autoAlpha: 1 });
  gsap.fromTo(
    loaderBg,
    { clipPath: 'inset(100% 0 0 0)' },
    { clipPath: 'inset(0% 0 0 0)', duration: 0.8, ease: 'expo.inOut', onComplete: () => (location.href = href) },
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
    const wasOpen = document.documentElement.classList.contains('menu-open');
    closeMenu();
    setTimeout(() => scrollToHash(url.hash) && history.replaceState(null, '', url.hash), wasOpen ? 250 : 0);
    return;
  }
  if (samePage) return;
  e.preventDefault();
  closeMenu(true);
  leaveTo(url.href);
});
addEventListener('pageshow', (e) => {
  if ((e as PageTransitionEvent).persisted) gsap.set(loader, { autoAlpha: 0 });
});

/* ─── En-tête, barre mobile ────────────────────────── */
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
  const el = document
    .elementsFromPoint(innerWidth / 2, 40)
    .find((n) => !header.contains(n) && !n.closest('.cursor, .loader, .menu, [data-float]'));
  header.classList.toggle('is-light', !!el?.closest('.dark, [data-dark-hero]'));
}
function onScroll() {
  const y = scrollY;
  header.classList.toggle('is-scrolled', y > 40);
  if (!document.documentElement.classList.contains('menu-open')) {
    header.classList.toggle('is-hidden', y > 500 && y > lastY + 2);
    if (y < lastY - 2) header.classList.remove('is-hidden');
  }
  mbar?.classList.toggle('is-visible', y > innerHeight * 0.8 && !contactVisible);
  headerTheme();
  lastY = y;
}
addEventListener('scroll', onScroll, { passive: true });

/* ─── Menu ─────────────────────────────────────────── */
const burger = $('[data-burger]');
const burgerLabel = $('[data-burger-label]');
const menu = $('[data-menu]')!;
const menuBg = $('[data-menu-bg]')!;
const menuTl = gsap
  .timeline({
    paused: true,
    onReverseComplete: () => {
      document.documentElement.classList.remove('menu-open');
      headerTheme();
    },
  })
  .fromTo(menuBg, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.6, ease: 'expo.inOut' })
  .fromTo($$('.menu__t', menu), { yPercent: 105 }, { yPercent: 0, duration: 0.7, stagger: 0.04, ease: 'expo.out' }, '-=0.25')
  .fromTo($$('.menu__n, .menu__foot, .menu__media', menu), { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.5');
const isOpen = () => document.documentElement.classList.contains('menu-open') && !menuTl.reversed();
function openMenu() {
  document.documentElement.classList.add('menu-open');
  header.classList.remove('is-hidden', 'is-light');
  burger?.setAttribute('aria-expanded', 'true');
  if (burgerLabel) burgerLabel.textContent = 'Fermer';
  menu.setAttribute('aria-hidden', 'false');
  lenis?.stop();
  menuTl.timeScale(1).play();
}
function closeMenu(instant = false) {
  if (!document.documentElement.classList.contains('menu-open')) return;
  burger?.setAttribute('aria-expanded', 'false');
  if (burgerLabel) burgerLabel.textContent = 'Menu';
  menu.setAttribute('aria-hidden', 'true');
  lenis?.start();
  if (instant) {
    menuTl.pause(0);
    document.documentElement.classList.remove('menu-open');
    headerTheme();
    return;
  }
  menuTl.timeScale(1.6).reverse();
}
burger?.addEventListener('click', () => (isOpen() ? closeMenu() : openMenu()));
addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());
$$('[data-menu-i]').forEach((a) =>
  a.addEventListener('pointerenter', () => {
    const i = Number(a.dataset.menuI) % $$('[data-menu-img]').length;
    $$('[data-menu-img]').forEach((im, j) => im.classList.toggle('is-on', j === i));
  }),
);

/* ─── Curseur & aimants ────────────────────────────── */
if (finePointer && !reduced) {
  document.documentElement.classList.add('has-cursor');
  const cur = $('[data-cursor]')!;
  const txt = $('[data-cursor-txt]', cur)!;
  const xTo = gsap.quickTo(cur, 'x', { duration: 0.5, ease: 'power3' });
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.5, ease: 'power3' });
  addEventListener('pointermove', (e) => {
    cur.classList.add('is-on');
    xTo(e.clientX);
    yTo(e.clientY);
  });
  document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
  document.addEventListener('pointerover', (e) => {
    const t = e.target as HTMLElement;
    const view = t.closest('[data-view], .ba__frame');
    cur.classList.toggle('is-view', !!view);
    txt.textContent = view ? (view.classList.contains('ba__frame') ? 'Glisser' : 'Voir') : '';
    cur.classList.toggle('is-link', !view && !!t.closest('a, button, summary, label'));
  });
  $$('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.5)' });
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

/* ─── Ouverture : photos flottantes ────────────────── */
function heroIn() {
  const tl = gsap.timeline({ defaults: { ease: EASE } });
  const title = $('[data-hero-title]');
  if (title) tl.to($$('.line-inner', title), { y: 0, duration: 1.6, stagger: 0.12 }, 0.1);
  tl.to($$('[data-hero-fade]'), { y: 0, opacity: 1, duration: 1.3, stagger: 0.08 }, 0.35);
  return tl;
}
function heroFloats() {
  const hero = $('[data-hero]');
  const floats = $$('[data-float]');
  if (!hero || !floats.length || reduced) return;
  // Au défilement, les photos s'écartent et montent à des vitesses différentes
  floats.forEach((f) => {
    const d = Number(f.dataset.depth || 1);
    const img = f.firstElementChild as HTMLElement;
    const dirX = f.offsetLeft + f.offsetWidth / 2 < hero.offsetWidth / 2 ? -1 : 1;
    gsap.to(img, {
      yPercent: -60 * d,
      xPercent: 18 * d * dirX,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  });
  floats.forEach((f, i) => {
    gsap.to(f, {
      y: i % 2 ? 12 : -12,
      rotation: i % 2 ? 1.2 : -1.2,
      duration: 3 + (i % 3) * 0.8,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 0.3 + i * 0.1,
    });
  });
  gsap.to($('.hero__center', hero), {
    yPercent: 30,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });
  // Souris : légère profondeur
  if (finePointer) {
    const tos = floats.map((f) => ({
      d: Number(f.dataset.depth || 1),
      x: gsap.quickTo(f.firstElementChild, 'x', { duration: 1.4, ease: 'power3' }),
      y: gsap.quickTo(f.firstElementChild, 'y', { duration: 1.4, ease: 'power3' }),
    }));
    hero.addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      tos.forEach((t) => {
        t.x(-nx * 60 * t.d);
        t.y(-ny * 40 * t.d);
      });
    });
  }
}

/* ─── Apparitions ──────────────────────────────────── */
function reveals() {
  $$('[data-split]').forEach((el) => {
    const lines = splitLines(el);
    gsap.set(lines, { y: '110%' });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => gsap.to($$('.line-inner', el), { y: 0, duration: 1.4, stagger: 0.1, ease: EASE }),
    });
  });
  ScrollTrigger.batch('[data-reveal="fade"]', {
    start: 'top 92%',
    once: true,
    onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 1.2, stagger: 0.08, ease: EASE }),
  });
  $$('[data-reveal="img"]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.5, ease: 'expo.inOut' });
        const media = el.querySelector('img, video');
        if (media && !media.hasAttribute('data-parallax')) gsap.fromTo(media, { scale: 1.25 }, { scale: 1, duration: 2, ease: 'expo.out' });
      },
    });
  });
}

/* ─── Grand titre défilant (savoir-faire) ──────────── */
function giant() {
  $$('[data-giant]').forEach((el) => {
    if (reduced) return;
    const span = el.firstElementChild as HTMLElement;
    span.innerHTML += span.innerHTML; // deux copies pour une boucle sans couture
    let x = 0;
    let boost = 0;
    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => (boost = Math.min(Math.abs(self.getVelocity()) / 160, 12)),
    });
    let visible = false;
    new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(el);
    gsap.ticker.add(() => {
      if (!visible) return;
      boost *= 0.93;
      x -= 0.7 + boost;
      const half = span.scrollWidth / 2;
      if (x <= -half) x += half;
      span.style.transform = `translate3d(${x}px,0,0)`;
    });
  });
}

/* ─── Savoir-faire : accordéon + image ─────────────── */
function skills() {
  const items = $$('[data-skill]');
  const imgs = $$('[data-skill-img]');
  const show = (i: number) => imgs.forEach((im, j) => im.classList.toggle('is-on', j === i));
  items.forEach((it, i) => {
    const btn = $<HTMLButtonElement>('.skill__head', it)!;
    const body = $('.skill__body', it)!;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      items.forEach((o) => {
        const b = $('.skill__head', o)!;
        const bd = $('.skill__body', o)!;
        if (o !== it && b.getAttribute('aria-expanded') === 'true') {
          b.setAttribute('aria-expanded', 'false');
          gsap.to(bd, { height: 0, duration: reduced ? 0 : 0.5, ease: 'power3.inOut', onComplete: () => void (bd.hidden = true) });
        }
      });
      if (open) {
        btn.setAttribute('aria-expanded', 'false');
        gsap.to(body, { height: 0, duration: reduced ? 0 : 0.5, ease: 'power3.inOut', onComplete: () => void (body.hidden = true) });
      } else {
        btn.setAttribute('aria-expanded', 'true');
        body.hidden = false;
        gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: reduced ? 0 : 0.6, ease: 'power3.out', onComplete: () => ScrollTrigger.refresh() });
        show(i);
      }
    });
    if (finePointer) it.addEventListener('pointerenter', () => show(i));
  });
}

/* ─── Avant / après ────────────────────────────────── */
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
        .to(state, { x: 14, duration: 1.1, ease: 'power2.inOut' })
        .to(state, { x: 86, duration: 1.4, ease: 'power2.inOut' })
        .to(state, { x: 50, duration: 1, ease: 'power3.out' });
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
      if (!reduced) gsap.fromTo(panels[i], { opacity: 0 }, { opacity: 1, duration: 0.6 });
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

/* ─── Déroulement : étapes au défilement (bureau) ──── */
function process() {
  const sec = $('[data-proc]');
  if (!sec) return;
  const steps = $$('[data-pstep]', sec);
  const dots = $$('[data-proc-dot]', sec);
  ScrollTrigger.matchMedia({
    '(min-width: 1024px)': () => {
      let cur = 0;
      const st = ScrollTrigger.create({
        trigger: sec,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const i = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
          if (i === cur) return;
          cur = i;
          steps.forEach((s, j) => s.classList.toggle('is-on', j === i));
          dots.forEach((d, j) => d.classList.toggle('is-on', j === i));
          if (!reduced) gsap.fromTo($('.pstep__n', steps[i]), { yPercent: 30 }, { yPercent: 0, duration: 1, ease: EASE });
        },
      });
      return () => st.kill();
    },
  });
}

/* ─── Profondeur des photos au défilement ─────────── */
function depth() {
  if (reduced) return;
  $$('.work__media img, .zworks__media img, .philo__img img').forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -6, scale: 1.14 },
      { yPercent: 6, scale: 1.14, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });
}

/* ─── Déroulement mobile : cartes empilées ─────────── */
function stackSteps() {
  ScrollTrigger.matchMedia({
    '(max-width: 1023px)': () => {
      if (reduced) return;
      const steps = $$('[data-pstep]');
      const tweens = steps.slice(0, -1).map((st, i) =>
        gsap.to(st, {
          scale: 0.9,
          opacity: 0.12,
          ease: 'none',
          scrollTrigger: { trigger: steps[i + 1], start: 'top 85%', end: 'top 20%', scrub: true },
        }),
      );
      return () => tweens.forEach((t) => t.scrollTrigger?.kill());
    },
  });
}

/* ─── Territoire : piste horizontale ───────────────── */
function terre() {
  const sec = $('[data-terre]');
  const rail = $('[data-terre-rail]');
  const track = $('[data-terre-track]');
  const bar = $('[data-terre-bar]');
  if (!sec || !rail || !track) return;
  if (!reduced)
    gsap.from($$('.tcard', track), {
      x: 80,
      opacity: 0,
      duration: 1.2,
      stagger: 0.08,
      ease: EASE,
      scrollTrigger: { trigger: track, start: 'top 85%', once: true },
    });
  ScrollTrigger.matchMedia({
    '(min-width: 1024px)': () => {
      if (reduced) return;
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: $('.terre__pin', sec), scrub: 0.6, invalidateOnRefresh: true },
      });
      tl.to(track, { x: () => -dist(), ease: 'none' }, 0);
      if (bar) tl.fromTo(bar, { scaleX: 0.1 }, { scaleX: 1, ease: 'none' }, 0);
    },
    '(max-width: 1023px)': () => {
      const onS = () => {
        const p = rail.scrollLeft / Math.max(1, rail.scrollWidth - rail.clientWidth);
        if (bar) bar.style.transform = `scaleX(${0.1 + p * 0.9})`;
      };
      rail.addEventListener('scroll', onS, { passive: true });
      return () => rail.removeEventListener('scroll', onS);
    },
  });
}

/* ─── Réalisations : filtres + visionneuse ─────────── */
function gallery() {
  const grid = $('[data-gallery]');
  if (!grid) return;
  const items = $$('.ritem', grid);
  $$<HTMLButtonElement>('[data-filter]').forEach((b, _i, all) =>
    b.addEventListener('click', () => {
      const c = b.dataset.filter!;
      all.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      items.forEach((it) => (it.hidden = c !== 'Tout' && it.dataset.cat !== c));
      if (!reduced) gsap.fromTo(items.filter((it) => !it.hidden), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.03, ease: EASE });
      ScrollTrigger.refresh();
    }),
  );
  const lb = $('[data-lightbox]');
  if (!lb) return;
  const imgs = $$('.lb__img', lb);
  const countEl = $('[data-lb-count]', lb)!;
  const titleEl = $('[data-lb-title]', lb)!;
  let idx = 0;
  let lastFocus: HTMLElement | null = null;
  const visible = () => items.map((it, i) => (it.hidden ? -1 : i)).filter((i) => i >= 0);
  const show = (i: number) => {
    idx = i;
    imgs.forEach((im, j) => {
      im.classList.toggle('is-on', j === i);
      if (j === i) im.setAttribute('loading', 'eager');
    });
    const v = visible();
    countEl.textContent = `${v.indexOf(i) + 1} / ${v.length}`;
    titleEl.textContent = (imgs[i] as HTMLImageElement).alt;
  };
  const step = (d: number) => {
    const v = visible();
    show(v[(v.indexOf(idx) + d + v.length) % v.length]);
  };
  const open = (i: number) => {
    lastFocus = document.activeElement as HTMLElement;
    lb.hidden = false;
    lenis?.stop();
    show(i);
    if (!reduced) gsap.fromTo(lb, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.8, ease: 'expo.inOut' });
    $<HTMLButtonElement>('[data-lb-close]', lb)?.focus();
  };
  const close = () => {
    const done = () => {
      lb.hidden = true;
      lenis?.start();
      lastFocus?.focus();
    };
    if (reduced) return done();
    gsap.to(lb, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'expo.inOut', onComplete: done });
  };
  $$<HTMLButtonElement>('[data-open]').forEach((b) => b.addEventListener('click', () => open(Number(b.dataset.open))));
  $('[data-lb-close]', lb)?.addEventListener('click', close);
  $('[data-lb-prev]', lb)?.addEventListener('click', () => step(-1));
  $('[data-lb-next]', lb)?.addEventListener('click', () => step(1));
  addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
  let sx = 0;
  lb.addEventListener('pointerdown', (e) => (sx = e.clientX));
  lb.addEventListener('pointerup', (e) => {
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });
}

/* ─── Parallaxe, vidéos ────────────────────────────── */
function parallax() {
  if (reduced) return;
  $$('[data-parallax]').forEach((m) => {
    const wrap = m.closest('[data-parallax-wrap]') ?? m.parentElement!;
    gsap.fromTo(m, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}
function autoVideos() {
  $$<HTMLVideoElement>('[data-autovideo]').forEach((v) => {
    new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting) {
          prepareVideo(v);
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
    location.href = `mailto:${to}?subject=${encodeURIComponent(`Demande de devis — ${commune}`)}&body=${encodeURIComponent(body)}`;
    note.textContent = 'Votre messagerie s’ouvre : il ne reste qu’à envoyer.';
  });
}

/* ─── Lancement ────────────────────────────────────── */
function init() {
  document.documentElement.classList.add('ready');
  const title = $('[data-hero-title]');
  if (title && !reduced) gsap.set($$('.line-inner', title), { y: '110%' });
  gsap.set($$('[data-hero-fade]'), { y: 24, opacity: 0 });
  gsap.set($$('[data-float]'), { opacity: 0 });

  reveals();
  giant();
  skills();
  beforeAfter();
  process();
  stackSteps();
  terre();
  depth();
  gallery();
  parallax();
  autoVideos();
  faq();
  form();
  onScroll();

  preload(() => heroFloats());
  // Le titre apparaît pendant l'envol des photos
  const waitHero = () => (getComputedStyle(loader).visibility === 'hidden' || +getComputedStyle(loaderBg).opacity < 0.6 ? heroIn() : requestAnimationFrame(waitHero));
  requestAnimationFrame(waitHero);

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
