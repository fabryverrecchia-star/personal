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

  const chip = $('[data-zchip]');
  if (chip) tl.from(chip, { yPercent: 60, rotation: -14, opacity: 0, duration: 1.6 }, 0.25);

  const strips = $$('[data-fan-strip]');
  if (strips.length) {
    tl.fromTo(
      strips,
      { rotation: 0, yPercent: 30, opacity: 0 },
      {
        rotation: (_i: number, el: HTMLElement) => parseFloat(el.style.getPropertyValue('--a')),
        yPercent: 0,
        opacity: 1,
        duration: 1.6,
        stagger: { each: 0.05, from: 'center' },
        ease: 'expo.out',
      },
      0.2,
    );
  }
  return tl;
}

function heroScroll() {
  const fan = $('[data-fan]');
  const hero = $('[data-hero]');
  if (!fan || !hero) return;
  const strips = $$('[data-fan-strip]', fan);
  gsap.set(fan, { transformPerspective: 900 });
  // Au défilement, l'éventail se referme doucement et pivote
  gsap
    .timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } })
    .to(strips, { rotation: (_i: number, el: HTMLElement) => parseFloat(el.style.getPropertyValue('--a')) * 0.25, ease: 'none' }, 0)
    .to(fan, { rotation: -18, yPercent: 18, ease: 'none' }, 0);

  if (finePointer) {
    const rx = gsap.quickTo(fan, 'rotationY', { duration: 1, ease: 'power3' });
    const rz = gsap.quickTo(fan.parentElement!, 'rotation', { duration: 1.2, ease: 'power3' });
    hero.addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      rx(nx * 16);
      rz(nx * 6);
    });
  }
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
      scale: 0.92,
      rotation: i % 2 ? 1.2 : -1.2,
      ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 25%', scrub: true },
    });
  });

  // Ligne de progression de la méthode
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
    b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
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

/* ─── Avant / après ─────────────────────────────────── */
function beforeAfter() {
  const demos: Record<number, () => void> = {};
  $$('[data-ba]').forEach((ba, idx) => {
    const frame = $('.ba__frame', ba)!;
    const range = $<HTMLInputElement>('[data-ba-range]', ba)!;
    const scope = ba.closest<HTMLElement>('[data-ba-scope]');
    const state = { x: 50 };
    const set = (x: number) => {
      state.x = Math.max(0, Math.min(100, x));
      frame.style.setProperty('--x', state.x + '%');
      scope?.style.setProperty('--xp', String(state.x));
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

  // Onglets entre chantiers
  $$('[data-bax]').forEach((box) => {
    const tabs = $$<HTMLButtonElement>('[data-ba-tab]', box);
    const panels = $$('[data-ba]', box);
    const show = (i: number, focus = false) => {
      tabs.forEach((t, j) => {
        t.setAttribute('aria-selected', String(j === i));
        t.tabIndex = j === i ? 0 : -1;
      });
      panels.forEach((p, j) => (p.hidden = j !== i));
      if (focus) tabs[i].focus();
      if (!reduced) gsap.fromTo(panels[i], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: EASE });
      demos[$$('[data-ba]').indexOf(panels[i])]?.();
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

/* ─── Parallaxe douce des photos ────────────────────── */
function parallax() {
  if (reduced) return;
  $$('[data-parallax]').forEach((img) => {
    const wrap = img.closest('[data-parallax-wrap]') ?? img.parentElement!;
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* ─── Réalisations : défilement horizontal (bureau) ─── */
function works() {
  const sec = $('[data-works]');
  const track = $('[data-works-track]');
  if (!sec || !track || reduced) return;
  const cards = $$('.wcard', track);
  gsap.from(cards, {
    y: 80,
    opacity: 0,
    rotation: 0,
    duration: 1.2,
    stagger: 0.1,
    ease: EASE,
    scrollTrigger: { trigger: track, start: 'top 85%', once: true },
  });
  ScrollTrigger.matchMedia({
    '(min-width: 1024px)': () => {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: sec,
          start: 'top top',
          end: () => '+=' + dist(),
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    },
  });
}

/* ─── Déroulement : étapes actives + pot de peinture ── */
function process() {
  const steps = $$('[data-pstep]');
  if (!steps.length) return;
  const pot = $('[data-proc-pot]');
  const num = $('[data-proc-num]');
  let current = -1;
  const activate = (i: number) => {
    if (i === current) return;
    current = i;
    steps.forEach((st, j) => st.classList.toggle('is-on', j === i || (innerWidth < 1024 && j < i)));
    const st = steps[i];
    if (pot) {
      pot.style.setProperty('--pc', st.dataset.pc!);
      pot.style.setProperty('--pi', st.dataset.pi!);
    }
    if (num) {
      const txt = String(i + 1).padStart(2, '0');
      if (reduced) num.textContent = txt;
      else
        gsap
          .timeline()
          .to(num, { yPercent: -40, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: () => (num.textContent = txt) })
          .fromTo(num, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: EASE });
    }
  };
  steps.forEach((st, i) => {
    ScrollTrigger.create({
      trigger: st,
      start: 'top 62%',
      end: 'bottom 62%',
      onToggle: (self) => self.isActive && activate(i),
    });
  });
}

/* ─── Lancement ─────────────────────────────────────── */
function init() {
  // État initial des éléments du hero
  const title = $('[data-hero-title]');
  if (title && !reduced) gsap.set($$('.line-inner', title), { y: '105%' });
  if (!reduced) gsap.set($$('[data-hero-fade]'), { y: 30, opacity: 0 });
  gsap.set($$('[data-fan-strip]'), { opacity: reduced ? 1 : 0, rotation: (_i: number, el: HTMLElement) => parseFloat(el.style.getPropertyValue('--a')) });
  if (reduced) $('[data-brush]')?.setAttribute('style', 'stroke-dashoffset:0');

  document.documentElement.classList.add('ready');
  reveals();
  beforeAfter();
  parallax();
  works();
  process();
  heroScroll();
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
