/* ==========================================================================
   Motion — GSAP + ScrollTrigger.
   · Intro: the names write themselves in ink while the page loads, then
     the silk, the date and the rest breathe in around them.
   · Scroll: every animation is scrubbed to the scroll with a little inertia,
     so on a phone it follows the finger instead of firing on its own.
   · Transforms and opacity only (GPU-friendly). Reduced motion → soft fades.
   ========================================================================== */
(function () {
  "use strict";

  var gsap = window.gsap, ST = window.ScrollTrigger;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var M = window.WeddingMotion = {
    write: function () { return Promise.resolve(); },
    intro: function () {},
    rows: null,
    gallery: function () {},
    refresh: function () {}
  };

  if (!gsap || !ST) {                         // library missing: show everything, no motion
    document.documentElement.classList.add("no-motion");
    return;
  }
  gsap.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true });   // the iPhone toolbar must not re-measure everything
  gsap.defaults({ ease: "power3.out", duration: 1.2 });

  var $$ = function (s, r) { return gsap.utils.toArray((r || document).querySelectorAll(s)); };
  var SCRUB = 0.9;                           // seconds of "catch-up": the inertia that makes it feel fluid

  /* ───────────── Intro ───────────── */

  // Names written in ink while the page loads. Resolves when both are written.
  M.write = function () {
    var names = $$(".hero__name");
    names.forEach(function (n) { n.classList.add("ink"); });
    return new Promise(function (resolve) {
      if (reduce) {
        gsap.set(names, { "--mx": "0%" });
        gsap.fromTo(".hero__names", { opacity: 0 }, { opacity: 1, duration: 0.8, onComplete: resolve });
        gsap.set(".hero__amp", { opacity: 1, scale: 1, rotate: 0 });
        return;
      }
      gsap.timeline({ onComplete: resolve })
        .fromTo(names[0], { "--mx": "100%", y: 10 }, { "--mx": "0%", y: 0, duration: 2.1, ease: "power2.inOut" })
        .to(".hero__amp", { opacity: 1, scale: 1, rotate: 0, duration: 1.4, ease: "expo.out" }, "-=0.8")
        .fromTo(names[1], { "--mx": "100%", y: 10 }, { "--mx": "0%", y: 0, duration: 2.1, ease: "power2.inOut" }, "-=1.0");
    });
  };

  // Everything around the names, once the page is ready.
  M.intro = function () {
    var d = reduce ? 0.01 : 1;
    var tl = gsap.timeline({ onComplete: setupScroll });
    tl.to(".loader__foot", { opacity: 0, y: 10, duration: 0.6 * d, ease: "power2.in" })
      .fromTo(".hero__eyebrow",
        { opacity: 0, y: 14, letterSpacing: "0.7em" },
        { opacity: 1, y: 0, letterSpacing: "0.34em", duration: 2 * d, ease: "expo.out" }, 0.2)
      .fromTo(".hero__date span",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 1.6 * d, stagger: 0.12, ease: "expo.out" }, 0.45)
      .fromTo(".hero__date i",
        { opacity: 0, scale: 0 },
        { opacity: 0.45, scale: 1, duration: 1.2 * d, stagger: 0.12, ease: "expo.out" }, 0.7)
      .fromTo(".topbar",
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 1.4 * d, ease: "expo.out" }, 0.8)
      .fromTo(".hero__scroll",
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 1.4 * d }, 1.2);
    document.getElementById("loader").classList.add("is-gone");
  };

  /* ───────────── Scroll ───────────── */

  // from → to, scrubbed while the element travels between two viewport lines
  function scrub(targets, from, to, start, end, trigger) {
    $$(targets).forEach(function (el) {
      gsap.fromTo(el, from, Object.assign({
        ease: "none",
        scrollTrigger: { trigger: trigger || el, start: start || "top 96%", end: end || "top 62%", scrub: SCRUB }
      }, to));
    });
  }
  function fade(targets) {                   // reduced motion: opacity only, played once
    ST.batch(targets, {
      start: "top 92%",
      once: true,
      onEnter: function (els) { gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.06 }); }
    });
  }

  function setupScroll() {
    // section titles are written in ink as they come up
    $$(".section__title, .footer__thanks").forEach(function (el) { el.classList.add("ink"); });

    if (reduce) {
      gsap.set(".ink", { "--mx": "0%" });
      fade(".section .eyebrow, .section__title, .section .lead, .section .body, .card, .pillar, .countdown, .or, .tabs, .menu__box, .footer > *");
      return;
    }

    // Hero drifts away in layers: the names at different speeds, the rest fading out first.
    gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: SCRUB } })
      .to(".hero__name--1", { yPercent: -28, ease: "none" }, 0)
      .to(".hero__name--2", { yPercent: -12, ease: "none" }, 0)
      .to(".hero__amp", { yPercent: -60, opacity: 0, ease: "none" }, 0)
      .to(".hero__names", { opacity: 0.1, scale: 0.94, ease: "none" }, 0.15)
      .to(".hero__eyebrow", { y: -70, opacity: 0, ease: "none" }, 0)
      .to(".hero__date", { y: -36, opacity: 0, letterSpacing: "0.7em", ease: "none" }, 0)
      .to(".hero__scroll", { opacity: 0, y: 20, ease: "none" }, 0);

    scrub(".section .eyebrow", { opacity: 0, letterSpacing: "0.7em" }, { opacity: 1, letterSpacing: "0.34em" }, "top 98%", "top 72%");
    scrub(".section__title, .footer__thanks", { "--mx": "100%", y: 30 }, { "--mx": "0%", y: 0 }, "top 94%", "top 50%");
    scrub(".card", { opacity: 0, y: 80, scale: 0.95 }, { opacity: 1, y: 0, scale: 1 }, "top 100%", "top 58%");
    scrub(".section .lead, .section .body, .signature, .countdown, .or, .gallery__count, .form .field, .form .btn",
      { opacity: 0, y: 36 }, { opacity: 1, y: 0 }, "top 97%", "top 72%");
    scrub(".rule", { scaleX: 0 }, { scaleX: 1 }, "top 92%", "top 70%");
    scrub(".tabs, .menu__box", { opacity: 0, y: 40, scale: 0.92 }, { opacity: 1, y: 0, scale: 1 }, "top 98%", "top 70%");

    // the 03 / 10 / 26 plinth floats a little slower than the page, its numbers arrive one by one
    gsap.fromTo(".pillar", { y: 90 }, { y: -50, ease: "none", scrollTrigger: { trigger: ".pillar", start: "top bottom", end: "bottom top", scrub: SCRUB + 0.4 } });
    $$(".pillar span").forEach(function (sp, i) {
      gsap.fromTo(sp, { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: "none",
        scrollTrigger: { trigger: ".pillar", start: "top " + (96 - i * 8) + "%", end: "top " + (60 - i * 8) + "%", scrub: SCRUB } });
    });

    // footer monogram grows into place
    scrub(".footer__mono", { opacity: 0, scale: 0.8, y: 30 }, { opacity: 1, scale: 1, y: 0 }, "top 100%", "top 65%");
    scrub(".footer__names, .footer__date", { opacity: 0, y: 20, letterSpacing: "0.7em" }, { opacity: 1, y: 0, letterSpacing: "0.4em" }, "top 100%", "top 75%");

    if (M._pendingGallery) M.gallery(M._pendingGallery);
  }

  /* ───────────── Gallery ───────────── */

  var colTweens = [];
  M.gallery = function (grid) {
    if (!grid) return;
    if (!ST.getAll().length && !reduce) { M._pendingGallery = grid; return; }   // wait for setupScroll
    // new tiles rise in, in small cascades, as they enter the screen
    var fresh = $$(".tile:not([data-m])", grid);
    fresh.forEach(function (t) { t.setAttribute("data-m", "1"); gsap.set(t, { opacity: 0, y: reduce ? 0 : 60, scale: reduce ? 1 : 0.94 }); });
    if (fresh.length) {
      ST.batch(fresh, {
        start: "top 96%",
        once: true,
        onEnter: function (els) {
          gsap.to(els, { opacity: 1, y: 0, scale: 1, duration: reduce ? 0.8 : 1.5, stagger: 0.09, ease: "expo.out", overwrite: true });
        }
      });
    }
    // a quiet parallax across the mosaic
    if (!reduce) {
      var cols = $$(".mason__col", grid);
      if (cols.length !== colTweens.length || cols.some(function (c, i) { return !colTweens[i] || colTweens[i].el !== c; })) {
        colTweens.forEach(function (c) { c.tw.scrollTrigger.kill(); c.tw.kill(); });
        colTweens = cols.map(function (c, i) {
          // columns lag behind and settle into place at different speeds; never above their own top
          var lag = [0, 70, 35, 90][i % 4];
          return { el: c, tw: gsap.fromTo(c, { y: lag }, { y: 0, ease: "none",
            scrollTrigger: { trigger: grid, start: "top bottom", end: "bottom bottom", scrub: SCRUB + 0.3 } }) };
        });
      }
    }
    M.refresh();
  };

  /* ───────────── Upload rows ───────────── */

  M.rows = {
    enter: function (li, i) {
      gsap.fromTo(li,
        { height: 0, opacity: 0, y: 16, marginBottom: 0 },
        { height: "auto", opacity: 1, y: 0, marginBottom: 10, duration: reduce ? 0.3 : 1.1, delay: i * 0.08, ease: "expo.out",
          onComplete: function () { gsap.set(li, { clearProps: "height" }); M.refresh(); } });
      var thumb = li.querySelector(".q__thumb");
      if (!reduce) gsap.fromTo(thumb, { scale: 0.7, rotate: -4 }, { scale: 1, rotate: 0, duration: 1.4, delay: i * 0.08 + 0.1, ease: "expo.out" });
    },
    leave: function (li, done) {
      gsap.to(li, { height: 0, opacity: 0, x: 30, marginBottom: 0, duration: 0.7, ease: "power3.inOut",
        onComplete: function () { done(); M.refresh(); } });
    },
    done: function (li) {
      if (reduce) return;
      gsap.timeline()
        .to(li.querySelector(".q__thumb"), { scale: 1.08, duration: 0.35, ease: "power2.out" })
        .to(li.querySelector(".q__thumb"), { scale: 1, duration: 0.9, ease: "expo.out" });
    }
  };

  // layout changed (uploads, gallery, tabs): re-measure trigger positions, debounced
  var rt = 0;
  M.refresh = function () {
    clearTimeout(rt);
    rt = setTimeout(function () { ST.refresh(); }, 250);
  };
})();
