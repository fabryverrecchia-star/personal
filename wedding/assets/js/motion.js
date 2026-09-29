/* ==========================================================================
   Motion — GSAP (+ SplitText, + ScrollTrigger for the hero parallax).

   1. Preloader: L and A rise from their baseline and glide towards each
      other, the "&" joins them, the names and a hairline follow.
   2. Hand-over: the monogram flies into the top bar while the ivory veil
      dissolves onto the home; the names then write themselves in ink.
   3. Scroll: sections reveal as they come into view — ink titles, text
      rising line by line from behind a mask, cards opening, tiles unveiled.
      Triggered by IntersectionObserver, which keeps working even when the
      page is shown inside a frame that doesn't scroll itself (app previews),
      unlike scroll events.
   Transforms, opacity and clip only. Reduced motion → soft fades.
   ========================================================================== */
(function () {
  "use strict";

  var gsap = window.gsap;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var noop = function () {};
  var M = window.WeddingMotion = {
    loading: function () { return Promise.resolve(); },
    enter: noop,
    rows: null,
    gallery: noop,
    refresh: noop
  };

  if (!gsap) {                                   // library missing: everything simply shows
    document.documentElement.classList.add("no-motion");
    return;
  }
  var ST = window.ScrollTrigger, Split = window.SplitText;
  if (ST) { gsap.registerPlugin(ST); ST.config({ ignoreMobileResize: true }); }
  if (Split) gsap.registerPlugin(Split);

  var EXPO = "expo.out";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return gsap.utils.toArray((r || document).querySelectorAll(s)); };
  var D = reduce ? 0.35 : 1;                     // global duration factor

  // names are hidden in ink from the very start (under the veil)
  $$(".hero__name").forEach(function (n) { n.classList.add("ink"); });

  /* ───────────── 1. Preloader ───────────── */

  M.loading = function () {
    var L = $(".mono__l"), A = $(".mono__a");
    return new Promise(function (resolve) {
      var tl = gsap.timeline({ onComplete: resolve });
      if (reduce) {
        tl.fromTo("#loaderMono, .loader__names, .loader__bar, .loader__count", { opacity: 0 }, { opacity: 1, duration: 0.6 });
        return;
      }
      gsap.set("#loaderMono", { opacity: 1 });
      tl.fromTo([L.firstChild, A.firstChild], { yPercent: 105 }, { yPercent: 0, duration: 1.7, stagger: 0.14, ease: EXPO }, 0)
        // the two initials start apart and glide together
        .fromTo(L, { x: "-0.28em" }, { x: 0, duration: 2.3, ease: "power3.inOut" }, 0)
        .fromTo(A, { x: "0.28em" }, { x: 0, duration: 2.3, ease: "power3.inOut" }, 0)
        // the "&" joins them
        .fromTo(".mono__amp > span",
          { opacity: 0, scale: 0.3, rotate: -24, y: 12 },
          { opacity: 1, scale: 1, rotate: 0, y: 0, duration: 1.5, ease: EXPO }, 1.15)
        .fromTo(".loader__names",
          { opacity: 0, letterSpacing: "0.9em", y: 8 },
          { opacity: 1, letterSpacing: "0.42em", y: 0, duration: 1.8, ease: EXPO }, 1.4)
        .fromTo(".loader__bar", { opacity: 0, scaleX: 0.4 }, { opacity: 1, scaleX: 1, duration: 1.2, ease: EXPO }, 1.6)
        .fromTo(".loader__count", { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.8);
    });
  };

  /* ───────────── 2. Hand-over to the home ───────────── */

  M.enter = function () {
    var mono = $("#loaderMono"), target = $("#topMono");
    var from = mono.getBoundingClientRect(), to = target.getBoundingClientRect();
    var scale = to.height / from.height;
    var dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    var dy = (to.top + to.height / 2) - (from.top + from.height / 2);

    // reveals are armed right away, while the veil still covers the page and it can't scroll yet
    setupReveals();
    var tl = gsap.timeline({
      onComplete: function () {
        $("#loader").classList.add("is-gone");
        setupParallax();
      }
    });
    tl.to(".loader__names, .loader__bar, .loader__count", { opacity: 0, y: -8, duration: 0.6 * D, stagger: 0.05, ease: "power2.in" }, 0)
      // the monogram flies to the top bar…
      .to(mono, { x: dx, y: dy, scale: scale, duration: 1.6 * D, ease: "expo.inOut" }, 0.25)
      // …while the veil dissolves onto the home, which settles from a slight zoom
      .to(".loader__veil", { opacity: 0, duration: 1.5 * D, ease: "power2.inOut" }, 0.45)
      .fromTo(".hero", { scale: 1.05, transformOrigin: "50% 40%" }, { scale: 1, duration: 2.6 * D, ease: EXPO, clearProps: "transform" }, 0.45)
      // hand-over: the real top-bar monogram takes its place
      .set(target, { opacity: 1 }, 1.85 * D)
      .set(mono, { opacity: 0 }, 1.85 * D)
      .fromTo(".lang", { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 1.2 * D, ease: EXPO }, 1.7 * D);

    // the names write themselves in ink, one after the other
    var names = $$(".hero__name");
    if (reduce) {
      tl.set(names, { "--mx": "0%" }, 0.5).to(".hero__amp", { opacity: 1, scale: 1, rotate: 0, duration: 0.4 }, 0.5);
    } else {
      tl.fromTo(names[0], { "--mx": "100%", y: 12 }, { "--mx": "0%", y: 0, duration: 1.9, ease: "power2.inOut" }, 0.8)
        .fromTo(".hero__amp", { opacity: 0, scale: 0.5, rotate: -14 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.4, ease: EXPO }, 2.0)
        .fromTo(names[1], { "--mx": "100%", y: 12 }, { "--mx": "0%", y: 0, duration: 1.9, ease: "power2.inOut" }, 2.1);
    }
    tl.fromTo(".hero__eyebrow",
        { opacity: 0, y: 14, letterSpacing: "0.8em" },
        { opacity: 1, y: 0, letterSpacing: "0.34em", duration: 2 * D, ease: EXPO }, 1.2 * D)
      .fromTo(".hero__date span", { opacity: 0, yPercent: 60 }, { opacity: 1, yPercent: 0, duration: 1.6 * D, stagger: 0.12, ease: EXPO }, 3.0 * D)
      .fromTo(".hero__date i", { opacity: 0, scale: 0 }, { opacity: 0.45, scale: 1, duration: 1.2 * D, stagger: 0.12, ease: EXPO }, 3.2 * D)
      .fromTo(".hero__scroll", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 1.4 * D, ease: EXPO }, 3.4 * D);
    return tl;
  };

  /* ───────────── 3. Reveals in view ───────────── */

  // Watches elements; when one comes into view, its reveal plays once.
  // Entries arriving in the same frame are staggered together.
  var io = null, handlers = new Map();
  function watch(el, reveal, hide) {
    if (!el || handlers.has(el)) return;
    hide(el);
    handlers.set(el, reveal);
    if (io) io.observe(el);
  }
  function createObserver() {
    if (!("IntersectionObserver" in window)) return null;
    return new IntersectionObserver(function (entries) {
      // anything already above the screen (scrolled past quickly) is shown at once, never lost
      entries.forEach(function (e) {
        if (!e.isIntersecting && e.boundingClientRect.bottom < 0 && handlers.has(e.target)) {
          io.unobserve(e.target);
          handlers.delete(e.target);
          showNow(e.target);
        }
      });
      var batch = entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left; });
      batch.forEach(function (e, i) {
        var fn = handlers.get(e.target);
        io.unobserve(e.target);
        handlers.delete(e.target);
        if (fn) fn(e.target, i * 0.09);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
  }

  function showNow(el) {
    if (el._split) { el._split.revert(); el._split = null; }
    gsap.set(el, { opacity: 1, y: 0, x: 0, scale: 1, rotateX: 0, scaleX: 1, "--mx": "0%", letterSpacing: "", clearProps: "clipPath,transform" });
    var kids = el.querySelectorAll(".pillar > span, :scope > .field, :scope > .btn");
    if (kids.length) gsap.set(kids, { opacity: 1, clearProps: "transform" });
    var media = el.querySelector(".tile img, .tile video, .tile__voice");
    if (media) gsap.set(media, { clearProps: "transform" });
  }

  // text rising line by line from behind a mask
  function splitLines(el) {
    if (!Split || reduce) return null;
    try { return Split.create(el, { type: "lines", mask: "lines", linesClass: "line" }); }
    catch (e) { return null; }
  }

  var R = {
    eyebrow: [
      function (el) { gsap.set(el, { opacity: 0, letterSpacing: "0.8em" }); },
      function (el, d) { gsap.to(el, { opacity: 1, letterSpacing: "0.34em", duration: 2 * D, delay: d, ease: EXPO }); }
    ],
    title: [
      function (el) { el.classList.add("ink"); gsap.set(el, { "--mx": "100%", y: reduce ? 0 : 24 }); },
      function (el, d) { gsap.to(el, { "--mx": "0%", y: 0, duration: 2.1 * D, delay: d + 0.1, ease: "power2.inOut" }); }
    ],
    text: [
      function (el) {
        var sp = splitLines(el);
        el._split = sp;
        if (sp) gsap.set(sp.lines, { yPercent: 110 });
        else gsap.set(el, { opacity: 0, y: reduce ? 0 : 20 });
      },
      function (el, d) {
        var sp = el._split;
        if (sp && sp.lines[0] && sp.lines[0].isConnected) {
          gsap.to(sp.lines, { yPercent: 0, duration: 1.5, stagger: 0.1, delay: d + 0.15, ease: EXPO,
            onComplete: function () { sp.revert(); } });
        } else gsap.to(el, { opacity: 1, y: 0, duration: 1.2 * D, delay: d, ease: EXPO });
      }
    ],
    card: [
      function (el) { gsap.set(el, reduce ? { opacity: 0 } : { opacity: 0, y: 60 }); },
      function (el, d) {
        // the card opens from its centre (explicit start/end: browsers shorten inset() values)
        var open = reduce ? {} : { clipPath: "inset(8% 5% 8% 5% round 18px)" };
        gsap.fromTo(el, Object.assign({ opacity: 0, y: reduce ? 0 : 60 }, open),
          Object.assign({ opacity: 1, y: 0, duration: 1.8 * D, delay: d, ease: EXPO,
            onComplete: function () { gsap.set(el, { clearProps: "clipPath,transform" }); } },
            reduce ? {} : { clipPath: "inset(0% 0% 0% 0% round 14px)" }));
        // what's inside follows, one after the other
        var kids = el.querySelectorAll(":scope > .field, :scope > .btn, :scope > .drop, :scope > .voice__head, :scope > .voice__wave, :scope > .voice__controls, :scope > .rule, :scope > .signature");
        if (kids.length && !reduce) {
          gsap.fromTo(kids, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.4, stagger: 0.08, delay: d + 0.35, ease: EXPO, clearProps: "transform" });
        }
      }
    ],
    rule: [
      function (el) { gsap.set(el, { scaleX: 0 }); },
      function (el, d) { gsap.to(el, { scaleX: 1, duration: 1.6 * D, delay: d + 0.3, ease: "expo.inOut" }); }
    ],
    lift: [
      function (el) { gsap.set(el, { opacity: 0, y: reduce ? 0 : 30 }); },
      function (el, d) { gsap.to(el, { opacity: 1, y: 0, duration: 1.5 * D, delay: d, ease: EXPO }); }
    ],
    pillar: [
      function (el) {
        gsap.set(el, reduce ? { opacity: 0 } : { opacity: 0, y: 50, rotateX: 18, transformPerspective: 800, transformOrigin: "50% 100%" });
        if (!reduce) gsap.set(el.children, { opacity: 0, yPercent: 60 });
      },
      function (el, d) {
        gsap.to(el, { opacity: 1, y: 0, rotateX: 0, duration: 1.8 * D, delay: d, ease: EXPO });
        if (!reduce) gsap.to(el.children, { opacity: 1, yPercent: 0, duration: 1.6, stagger: 0.16, delay: d + 0.4, ease: EXPO });
      }
    ],
    mono: [
      function (el) { gsap.set(el, { opacity: 0, scale: reduce ? 1 : 0.8, y: reduce ? 0 : 20 }); },
      function (el, d) { gsap.to(el, { opacity: 1, scale: 1, y: 0, duration: 2 * D, delay: d, ease: EXPO }); }
    ],
    tile: [
      function (el) {
        gsap.set(el, reduce ? { opacity: 0 } : { opacity: 0, y: 40 });
        var media = el.querySelector("img, video, .tile__voice");
        if (media && !reduce) gsap.set(media, { scale: 1.25 });
      },
      function (el, d) {
        // unveiled from the bottom up
        gsap.fromTo(el, Object.assign({ opacity: 0, y: reduce ? 0 : 40 }, reduce ? {} : { clipPath: "inset(18% 0% 0% 0% round 10px)" }),
          Object.assign({ opacity: 1, y: 0, duration: 1.6 * D, delay: d, ease: EXPO,
            onComplete: function () { gsap.set(el, { clearProps: "clipPath,transform" }); } },
            reduce ? {} : { clipPath: "inset(0% 0% 0% 0% round 10px)" }));
        var media = el.querySelector("img, video, .tile__voice");
        if (media && !reduce) gsap.to(media, { scale: 1, duration: 2.2, delay: d, ease: EXPO, clearProps: "transform" });
      }
    ]
  };
  function add(sel, kind, root) { $$(sel, root).forEach(function (el) { watch(el, R[kind][1], R[kind][0]); }); }

  // Safety net for fast flings: an element can go from below the screen to above
  // it between two observer checks; anything already above the screen is shown.
  var sweeping = false;
  function sweep() {
    sweeping = false;
    handlers.forEach(function (_, el) {
      if (el.getBoundingClientRect().bottom < 0) {
        if (io) io.unobserve(el);
        handlers.delete(el);
        showNow(el);
      }
    });
  }
  function requestSweep() {
    if (sweeping || !handlers.size) return;
    sweeping = true;
    requestAnimationFrame(sweep);
  }

  function setupReveals() {
    io = createObserver();
    if (!io) {                                   // very old browser: everything is simply shown
      handlers.forEach(function (_, el) { showNow(el); });
      handlers.clear();
      return;
    }
    window.addEventListener("scroll", requestSweep, { passive: true });
    setInterval(requestSweep, 1000);
    add(".section .eyebrow, .footer__names, .footer__date, .gallery__count", "eyebrow");
    add(".section__title, .footer__thanks", "title");
    add(".section .lead, .section .body", "text");
    add(".card", "card");
    add(".card > .rule", "rule");
    add(".countdown, .or, .gallery__empty", "lift");
    add(".pillar", "pillar");
    add(".footer__mono", "mono");
    add(".tile", "tile");
    handlers.forEach(function (_, el) { io.observe(el); });
  }

  // the hero drifts away in layers — only where the page itself scrolls
  function setupParallax() {
    if (!ST || reduce) return;
    gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.9 } })
      .to(".hero__name--1", { yPercent: -26, ease: "none" }, 0)
      .to(".hero__name--2", { yPercent: -10, ease: "none" }, 0)
      .to(".hero__amp", { opacity: 0, ease: "none" }, 0)
      .to(".hero__names", { opacity: 0.15, ease: "none" }, 0.2)
      .to(".hero__eyebrow", { y: -60, opacity: 0, ease: "none" }, 0)
      .to(".hero__date", { y: -30, opacity: 0, ease: "none" }, 0)
      .to(".hero__scroll", { opacity: 0, ease: "none" }, 0);
  }

  /* ───────────── Gallery tiles (added at any time) ───────────── */

  M.gallery = function (grid) {
    $$(".tile:not([data-m])", grid).forEach(function (t) {
      t.setAttribute("data-m", "1");
      watch(t, R.tile[1], R.tile[0]);
    });
    M.refresh();
  };

  /* ───────────── Upload rows ───────────── */

  M.rows = {
    enter: function (li, i) {
      gsap.fromTo(li,
        { height: 0, opacity: 0, y: 16, marginBottom: 0 },
        { height: "auto", opacity: 1, y: 0, marginBottom: 10, duration: 1.1 * D, delay: i * 0.08, ease: EXPO,
          onComplete: function () { gsap.set(li, { clearProps: "height,transform" }); M.refresh(); } });
      if (!reduce) gsap.fromTo(li.querySelector(".q__thumb"), { scale: 0.7, rotate: -4 }, { scale: 1, rotate: 0, duration: 1.4, delay: i * 0.08 + 0.1, ease: EXPO });
    },
    leave: function (li, done) {
      gsap.to(li, { height: 0, opacity: 0, x: 30, marginBottom: 0, duration: 0.7, ease: "power3.inOut",
        onComplete: function () { done(); M.refresh(); } });
    },
    done: function (li) {
      if (reduce) return;
      gsap.timeline()
        .to(li.querySelector(".q__thumb"), { scale: 1.08, duration: 0.35, ease: "power2.out" })
        .to(li.querySelector(".q__thumb"), { scale: 1, duration: 0.9, ease: EXPO });
    }
  };

  var rt = 0;
  M.refresh = function () {
    if (!ST) return;
    clearTimeout(rt);
    rt = setTimeout(function () { ST.refresh(); }, 250);
  };
})();
