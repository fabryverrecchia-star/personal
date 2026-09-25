/* ==========================================================================
   Romolo & Remo — orchestration (Lenis + GSAP ScrollTrigger + WebGL)
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var SVGNS = "http://www.w3.org/2000/svg";
  var PATHS = window.RR_PATHS;

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  var mqSmall = window.matchMedia("(max-width: 820px)");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     1. SVG vectoriels du brandbook injectés dans le DOM
     ------------------------------------------------------------------ */
  function buildSvg(name) {
    var def = PATHS[name];
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 " + def.w + " " + def.h);
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    def.paths.forEach(function (p) {
      var path = document.createElementNS(SVGNS, "path");
      path.setAttribute("d", p.d);
      path.setAttribute("fill-rule", p.rule);
      svg.appendChild(path);
    });
    return svg;
  }
  $$("[data-svg]").forEach(function (el) { el.appendChild(buildSvg(el.getAttribute("data-svg"))); });

  /* tracés du logotype triés de gauche à droite pour un dévoilement lisible */
  function sortedPaths(svg) {
    return $$("path", svg).map(function (p) { return { p: p, x: p.getBBox().x }; })
      .sort(function (a, b) { return a.x - b.x; }).map(function (o) { return o.p; });
  }

  /* dessin au trait puis remplissage */
  function prepDraw(svg) {
    var paths = sortedPaths(svg);
    var vb = svg.viewBox.baseVal;
    var sw = Math.max(vb.width, vb.height) / 420;
    paths.forEach(function (p) {
      var len = 0;
      try { len = p.getTotalLength(); } catch (e) { len = 1000; }
      len = Math.ceil(len) + 2;
      p.style.stroke = "currentColor";
      p.style.strokeWidth = sw;
      p.style.fillOpacity = 0;
      p.style.strokeDasharray = len + " " + len;
      p.style.strokeDashoffset = len;
      p._len = len;
    });
    return paths;
  }
  function drawTimeline(paths, opts) {
    opts = opts || {};
    var tl = gsap.timeline(opts.tl || {});
    tl.to(paths, { strokeDashoffset: 0, duration: opts.draw || 1.3, ease: "power2.inOut", stagger: opts.stagger || 0.06 })
      .to(paths, { fillOpacity: 1, duration: 0.7, ease: "power1.out", stagger: (opts.stagger || 0.06) * 0.6 }, "-=0.7")
      .to(paths, { strokeWidth: 0, duration: 0.5, ease: "none" }, "-=0.3");
    return tl;
  }

  /* ------------------------------------------------------------------
     2. Grain (texture générée, aucun fichier)
     ------------------------------------------------------------------ */
  (function grain() {
    var c = document.createElement("canvas"); c.width = c.height = 180;
    var ctx = c.getContext("2d"); var d = ctx.createImageData(180, 180);
    for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    ctx.putImageData(d, 0, 0);
    $(".grain").style.backgroundImage = "url(" + c.toDataURL("image/png") + ")";
  })();

  /* ------------------------------------------------------------------
     3. Smooth scroll — identique desktop / mobile (syncTouch)
     ------------------------------------------------------------------ */
  /* Réglages identiques desktop et mobile : défilement amorti, inertie longue
     au doigt (syncTouch), molette légèrement ralentie pour plus de contrôle. */
  var SCROLL = {
    lerp: 0.072,
    wheelMultiplier: 0.85,
    syncTouchLerp: 0.072,
    touchInertiaExponent: 1.8,
    touchMultiplier: 1.15
  };
  var lenis = new Lenis({
    lerp: SCROLL.lerp,
    smoothWheel: true,
    syncTouch: true,
    syncTouchLerp: SCROLL.syncTouchLerp,
    touchInertiaExponent: SCROLL.touchInertiaExponent,
    touchMultiplier: SCROLL.touchMultiplier,
    wheelMultiplier: SCROLL.wheelMultiplier,
    anchors: false,
    /* forcé : la page reste fluide même si « Réduire les animations » est actif */
    respectReducedMotion: false
  });
  lenis.stop();
  window.__lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);

  var easeScroll = function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };
  function glide(target, duration) {
    lenis.scrollTo(target, { duration: duration || 1.4, easing: easeScroll });
  }

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      e.preventDefault();
      glide(id === "#top" ? 0 : id, 1.8);
    });
  });

  /* Clavier : flèches, espace, pages, début/fin glissent au lieu de sauter */
  window.addEventListener("keydown", function (e) {
    if (lenis.isStopped || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var vh = window.innerHeight, base = lenis.targetScroll, to = null, dur = 1.1;
    switch (e.key) {
      case "ArrowDown": to = base + vh * 0.18; dur = 0.8; break;
      case "ArrowUp": to = base - vh * 0.18; dur = 0.8; break;
      case "PageDown": to = base + vh * 0.85; break;
      case "PageUp": to = base - vh * 0.85; break;
      case " ": to = base + (e.shiftKey ? -1 : 1) * vh * 0.85; break;
      case "Home": to = 0; dur = 2; break;
      case "End": to = lenis.limit; dur = 2; break;
    }
    if (to === null) return;
    e.preventDefault();
    glide(Math.max(0, Math.min(lenis.limit, to)), dur);
  });

  /* L'indicateur « Scroll » du hero amène à la première section */
  var hint = $("[data-scroll-hint]");
  if (hint) {
    hint.setAttribute("role", "button");
    hint.setAttribute("tabindex", "0");
    hint.setAttribute("aria-label", "Descendre vers la suite");
    var goNext = function () { glide(".manifesto", 2); };
    hint.addEventListener("click", goNext);
    hint.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); goNext(); } });
  }

  /* ------------------------------------------------------------------
     4. WebGL
     ------------------------------------------------------------------ */
  var engine = window.RRGL ? window.RRGL.create($("#gl")) : null;
  var heroMark = $("[data-hero-mark]");
  var heroSvg = $(".hero__mark-svg");
  var particles = null;
  var wolf = null;
  var planes = [];

  function disableGL() {
    engine = null;
    $("#gl").style.display = "none";
    $$(".is-gl").forEach(function (el) { el.classList.remove("is-gl"); });
    $$(".media").forEach(function (m) { m.classList.add("is-in"); });
    heroSvg.style.opacity = 1;
  }

  if (engine) {
    engine.onLost = disableGL;
    particles = engine.addParticles(heroMark, PATHS.pictogram, {
      count: mqSmall.matches ? 9000 : 16000,
      size: 1.9,
      color: "#CF1F00"
    });
    wolf = engine.addWolf($("[data-wolf]"), PATHS.pictogram, { color: "#EFDBC0", res: mqSmall.matches ? 760 : 1100 });
    $$("img[data-gl]").forEach(function (img) {
      var box = img.closest(".media");
      var item = engine.addImage(img, box, {
        gray: img.hasAttribute("data-gray"),
        onReady: function (it) { if (box.classList.contains("is-in")) it.reveal = 1; }
      });
      planes.push(item);
    });

    var setMouse = function (x, y) { if (particles) { particles.mouseT[0] = x; particles.mouseT[1] = y; } };
    window.addEventListener("pointermove", function (e) { setMouse(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener("touchmove", function (e) { var t = e.touches[0]; if (t) setMouse(t.clientX, t.clientY); }, { passive: true });
    window.addEventListener("touchend", function () { setMouse(-1e5, -1e5); }, { passive: true });
    document.addEventListener("pointerleave", function () { setMouse(-1e5, -1e5); });
  } else {
    disableGL();
  }

  /* Révélation des images au premier passage dans l'écran (vertical et horizontal) */
  var mediaBoxes = $$(".media");
  function checkReveals() {
    var vw = window.innerWidth, vh = window.innerHeight;
    for (var i = mediaBoxes.length - 1; i >= 0; i--) {
      var box = mediaBoxes[i];
      var r = box.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0 && r.left < vw * 0.96 && r.right > 0) {
        box.classList.add("is-in");
        var it = null;
        for (var k = 0; k < planes.length; k++) if (planes[k].box === box) it = planes[k];
        if (it) gsap.to(it, { reveal: 1, duration: 1.8, ease: "power3.out", delay: 0.05 });
        mediaBoxes.splice(i, 1);
      }
    }
  }

  /* boucle de rendu : après Lenis, dans le même tick */
  var intro = { crisp: 0, done: false };
  var heroState = { disperse: 0 };
  gsap.ticker.add(function (time, dt) {
    if (!engine) return;
    if (particles) {
      particles.disperse = heroState.disperse;
      var crispVis = intro.crisp * (1 - Math.min(heroState.disperse * 5, 1));
      heroSvg.style.opacity = crispVis;
      particles.alpha = 1 - crispVis;
    }
    engine.render(Math.min(dt, 50) / 1000);
    checkReveals();
  });
  if (!engine) gsap.ticker.add(checkReveals);

  window.addEventListener("resize", function () { if (engine) engine.resize(); });

  /* ------------------------------------------------------------------
     5. Intro : « Art direction Fabrizio Verrecchia × Abysse Lab » → logo
     ------------------------------------------------------------------ */
  var logoPaths = prepDraw($(".hero__logo-svg svg"));

  function splitChars(el) {
    var text = el.textContent;
    el.textContent = "";
    var frag = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement("span");
      s.className = "split-char";
      s.textContent = text[i] === " " ? " " : text[i];
      frag.appendChild(s);
    }
    el.appendChild(frag);
    el.setAttribute("aria-label", text);
    return $$(".split-char", el);
  }

  function runIntro() {
    var credit = $("[data-credit]");
    var chars = [];
    $$("[data-split-chars]", credit).forEach(function (el) { chars = chars.concat(splitChars(el)); });
    var x = $(".credit__x span", credit);
    var rule = $(".credit__rule", credit);

    gsap.set(chars, { yPercent: 115 });
    gsap.set(x, { yPercent: 110, rotate: -20 });
    gsap.set("[data-intro-fade], [data-signature], [data-scroll-hint]", { opacity: 0, y: 12 });
    gsap.set(".hero__logo", { opacity: 1 });

    var k = reduced ? 0.5 : 1;
    var tl = gsap.timeline({ delay: 0.25 });
    tl.to(chars, { yPercent: 0, duration: 1.1 * k, ease: "expo.out", stagger: 0.022 * k })
      .to(x, { yPercent: 0, rotate: 0, duration: 1 * k, ease: "expo.out" }, 0.35 * k)
      .to(rule, { scaleX: 1, duration: 1.2 * k, ease: "expo.inOut" }, 0.3 * k)
      .to(chars, { yPercent: -115, duration: 0.8 * k, ease: "expo.in", stagger: 0.012 * k }, "+=" + 0.55 * k)
      .to(x, { yPercent: -110, duration: 0.6 * k, ease: "expo.in" }, "<0.2")
      .to(rule, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.7 * k, ease: "expo.in" }, "<")
      .add("mark", "-=0.25");

    if (particles) {
      tl.to(particles, { assemble: 1, duration: 2.6 * k, ease: "power2.inOut" }, "mark")
        .to(intro, { crisp: 1, duration: 0.9 * k, ease: "power1.inOut" }, "mark+=" + 2.2 * k);
    } else {
      tl.fromTo(heroSvg, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 1.4 * k, ease: "expo.out" }, "mark");
    }
    tl.add(drawTimeline(logoPaths, { draw: 1.4 * k, stagger: 0.07 * k }), "mark+=" + 1.2 * k)
      .to("[data-signature]", { opacity: 1, y: 0, duration: 1, ease: "expo.out" }, "mark+=" + 2.4 * k)
      .to("[data-intro-fade]", { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.06 }, "mark+=" + 2.5 * k)
      .add(function () {
        document.body.classList.remove("is-loading");
        intro.done = true;
        lenis.start();
        ScrollTrigger.refresh();
      }, "mark+=" + 2.8 * k)
      .to("[data-scroll-hint]", { opacity: 1, y: 0, duration: 1, ease: "expo.out" }, "mark+=" + 3 * k);
  }

  /* ------------------------------------------------------------------
     6. Animations au scroll
     ------------------------------------------------------------------ */
  function setupScroll() {
    /* HERO : le pictogramme se disperse en particules, le logotype s'élargit */
    gsap.timeline({
      scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "+=75%", pin: true, scrub: 1 }
    })
      .to(heroState, { disperse: 1, ease: "none", duration: 1 }, 0)
      .to(".hero__logo", { scale: 1.18, yPercent: -40, opacity: 0, ease: "power1.in", duration: 0.8 }, 0.1)
      .to(".hero__signature, [data-scroll-hint]", { opacity: 0, y: -20, ease: "none", duration: 0.3 }, 0)
      .to(".hero__meta", { opacity: 0, ease: "none", duration: 0.4 }, 0.5)
      .to(heroSvg, { scale: 0.92, ease: "none", duration: 0.3 }, 0);

    /* Titres et paragraphes : lignes masquées */
    $$("[data-reveal-lines]").forEach(function (el) {
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "line",
        autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, {
            yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.08,
            scrollTrigger: { trigger: el, start: "top 88%", once: true }
          });
        }
      });
    });

    /* Manifeste : mots qui s'allument au scroll */
    $$("[data-scrub-words]").forEach(function (el) {
      SplitText.create(el, {
        type: "words",
        wordsClass: "word",
        autoSplit: true,
        onSplit: function (self) {
          return gsap.fromTo(self.words, { opacity: 0.13 }, {
            opacity: 1, ease: "none", stagger: 0.1,
            scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 50%", scrub: 0.8 }
          });
        }
      });
    });

    /* Parallaxe */
    $$("[data-parallax]").forEach(function (el) {
      var k = parseFloat(el.getAttribute("data-parallax")) || 0.1;
      gsap.fromTo(el, { yPercent: k * 100 }, {
        yPercent: -k * 100, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1.2 }
      });
    });

    /* Pictogrammes « encre » : révélation circulaire */
    $$("[data-ink]").forEach(function (el) {
      gsap.fromTo(el, { clipPath: "circle(0% at 50% 62%)", scale: 1.08 }, {
        clipPath: "circle(75% at 50% 50%)", scale: 1, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", end: "center 55%", scrub: 1 }
      });
    });

    /* Tracés dessinés (hors hero) */
    $$("[data-draw]").forEach(function (el) {
      if (el.closest("[data-hero]")) return;
      var paths = prepDraw($("svg", el));
      var tl = drawTimeline(paths, { draw: 1.6, stagger: 0.05, tl: { paused: true } });
      ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: function () { tl.play(); } });
    });

    /* ADN : trois mots, un pin */
    var words = $$("[data-adn-word]");
    var adn = gsap.timeline({
      scrollTrigger: { trigger: "[data-adn]", start: "top top", end: "+=220%", pin: true, scrub: 1 }
    });
    gsap.set(words, { opacity: 0, x: function () { return window.innerWidth * 0.18; } });
    words.forEach(function (w, i) {
      adn.to(w, { opacity: 1, x: 0, duration: 1, ease: "power3.out" }, i * 1.1);
      if (i > 0) adn.to(words[i - 1], { opacity: 0.22, duration: 0.8, ease: "none" }, i * 1.1);
    });
    adn.fromTo(".adn__img", { rotate: -8, scale: 0.9 }, { rotate: 8, scale: 1.08, duration: adn.duration(), ease: "none" }, 0)
       .to({}, { duration: 0.4 });

    /* LA LOUVE EN MARCHE — du 12 rue Dauphine au 9 rue de Nevers */
    var wolfEl = $("[data-wolf]");
    var stage = $(".walk__stage");
    var walk = gsap.timeline({
      scrollTrigger: {
        trigger: "[data-walk]", start: "top top", end: "+=260%", pin: true, scrub: 1.2, invalidateOnRefresh: true
      }
    });
    walk.fromTo(wolfEl, { x: function () { return -wolfEl.offsetWidth * 1.05; } },
      { x: function () { return stage.offsetWidth + wolfEl.offsetWidth * 0.05; }, ease: "none", duration: 1 }, 0)
      .fromTo("[data-marquee]", { xPercent: 0 }, { xPercent: -33.333, ease: "none", duration: 1 }, 0)
      .fromTo("[data-walk-line]", { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 1 }, 0)
      .fromTo("[data-walk-a]", { opacity: 1 }, { opacity: 0.35, duration: 0.3, ease: "none" }, 0.35)
      .fromTo("[data-walk-b]", { opacity: 0.35 }, { opacity: 1, duration: 0.3, ease: "none" }, 0.6);

    /* sans WebGL : petit rebond DOM pour suggérer la marche */
    if (!wolf) {
      var wolfSvg = $(".walk__wolf-svg");
      gsap.ticker.add(function () {
        var x = gsap.getProperty(wolfEl, "x");
        gsap.set(wolfSvg, { y: -Math.abs(Math.sin(x / (wolfEl.offsetWidth * 0.62) * Math.PI)) * wolfEl.offsetHeight * 0.012 });
      });
    }

    /* Couleurs */
    var vertical = mqSmall.matches;
    gsap.fromTo("[data-swatches] .sw", vertical ? { scaleX: 0 } : { scaleY: 0 }, {
      scaleX: 1, scaleY: 1, ease: "expo.out", duration: 1.4, stagger: 0.09,
      scrollTrigger: { trigger: "[data-swatches]", start: "top 80%", once: true }
    });
    gsap.from(".carminio__chip", {
      yPercent: 20, rotate: -4, opacity: 0, duration: 1.4, ease: "expo.out",
      scrollTrigger: { trigger: "[data-carminio]", start: "top 75%", once: true }
    });

    /* Dynamisme : Romolo / Remo */
    gsap.timeline({ scrollTrigger: { trigger: "[data-duo]", start: "top top", end: "+=130%", pin: true, scrub: 1 } })
      .fromTo("[data-duo-a]", { xPercent: -120 }, { xPercent: 0, ease: "power2.out", duration: 1 }, 0)
      .fromTo("[data-duo-b]", { xPercent: 120 }, { xPercent: 0, ease: "power2.out", duration: 1 }, 0)
      .fromTo("[data-duo-key]", { rotate: -180, scale: 0 }, { rotate: 0, scale: 1, ease: "power2.out", duration: 1 }, 0.2)
      .fromTo(".duo__addr", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.8)
      .to({}, { duration: 0.3 });

    /* Galerie horizontale */
    var track = $("[data-track]");
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    gsap.to(track, {
      x: function () { return -dist(); }, ease: "none",
      scrollTrigger: {
        trigger: "[data-gallery]", start: "top top", end: function () { return "+=" + dist(); },
        pin: true, scrub: 1, invalidateOnRefresh: true
      }
    });

    /* Processus */
    gsap.fromTo(".process__img", { xPercent: 4 }, {
      xPercent: -4, ease: "none",
      scrollTrigger: { trigger: ".process__img", start: "top bottom", end: "bottom top", scrub: 1.2 }
    });

    /* Fin */
    gsap.from(".end__thanks span, .end__thanks em", {
      yPercent: 60, opacity: 0, duration: 1.4, ease: "expo.out", stagger: 0.12,
      scrollTrigger: { trigger: ".end__thanks", start: "top 85%", once: true }
    });

    /* En-tête : thème, index de section, progression */
    var counter = $("[data-count]");
    /* une section épinglée est mesurée via son pin-spacer (durée du pin incluse) */
    var span = function (el) { var p = el.parentNode; return p && p.classList && p.classList.contains("pin-spacer") ? p : el; };
    $$("[data-theme]").forEach(function (el) {
      ScrollTrigger.create({
        trigger: span(el), start: "top 40px", end: "bottom 40px",
        onToggle: function (self) { if (self.isActive) document.body.setAttribute("data-theme", el.getAttribute("data-theme")); }
      });
    });
    document.body.setAttribute("data-theme", "sand");
    $$("[data-index]").forEach(function (el) {
      ScrollTrigger.create({
        trigger: span(el), start: "top 50%", end: "bottom 50%",
        onToggle: function (self) { if (self.isActive) counter.textContent = el.getAttribute("data-index"); },
        onLeaveBack: function () { if (el.getAttribute("data-index") === "01") counter.textContent = "00"; }
      });
    });
    var bar = $("[data-progress]");
    lenis.on("scroll", function (l) { gsap.set(bar, { scaleX: l.progress || 0 }); });
  }

  /* ------------------------------------------------------------------
     7. Démarrage
     ------------------------------------------------------------------ */
  var started = false;
  function start() {
    if (started) return;
    started = true;
    setupScroll();
    runIntro();
  }
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 2500); })]).then(start);
})();
