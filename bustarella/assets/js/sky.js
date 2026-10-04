/* ==========================================================================
   The sky before the gift: clouds (some shaped like hearts) drift past in
   layers, a little four-seat touring plane rises from below, cruises a
   moment, then flies off — and the gift appears.
   Plain SVG + GSAP transforms, light enough for phones. Tap to skip.
   ========================================================================== */
(function () {
  "use strict";

  var NAVY = "#14295a", WAX = "#7d1f2c";

  // a puffy cloud: overlapping circles on a flat base, with a soft underside
  function cloudSVG(seed) {
    var r = rand(seed);
    var bumps = [], x = 18, n = 4 + Math.floor(r() * 3);
    for (var i = 0; i < n; i++) {
      var rad = 14 + r() * 16;
      bumps.push([x + rad * 0.6, 44 - rad * (0.55 + r() * 0.35), rad]);
      x += rad * (0.9 + r() * 0.4);
    }
    var w = x + 24;
    var circles = function (dy, fill) {
      return bumps.map(function (b) { return '<circle cx="' + b[0].toFixed(1) + '" cy="' + (b[1] + dy).toFixed(1) + '" r="' + b[2].toFixed(1) + '" fill="' + fill + '"/>'; }).join("") +
        '<rect x="8" y="' + (34 + dy) + '" width="' + (w - 16).toFixed(1) + '" height="18" rx="9" fill="' + fill + '"/>';
    };
    return { w: w, svg: '<svg viewBox="0 0 ' + w.toFixed(1) + ' 60" xmlns="http://www.w3.org/2000/svg">' +
      '<g>' + circles(5, "rgba(20,41,90,.07)") + '</g><g>' + circles(0, "#fffefb") + "</g></svg>" };
  }

  // a heart-shaped cloud: the classic heart curve, made puffy with little bumps along its edge
  function heartSVG() {
    var pts = [], bumps = "";
    for (var i = 0; i <= 60; i++) {
      var t = i / 60 * Math.PI * 2;
      var x = 16 * Math.pow(Math.sin(t), 3), y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      pts.push([x * 3 + 60, y * 3 + 56]);
      if (i % 4 === 0) bumps += '<circle cx="' + (x * 3 + 60).toFixed(1) + '" cy="' + (y * 3 + 56).toFixed(1) + '" r="7"/>';
    }
    var d = "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L") + "Z";
    return '<svg viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg">' +
      '<g fill="rgba(125,31,44,.10)" transform="translate(0 5)"><path d="' + d + '"/>' + bumps + "</g>" +
      '<g fill="#fff6f4"><path d="' + d + '"/>' + bumps + "</g>" +
      '<path d="' + d + '" fill="none" stroke="rgba(232,205,198,.9)" stroke-width="3" transform="translate(60 56) scale(.62) translate(-60 -56)"/></svg>';
  }

  // the little touring plane, side view, flying to the right (high wing, struts, four windows)
  var PLANE =
    '<svg viewBox="0 0 260 120" xmlns="http://www.w3.org/2000/svg">' +
    // tail
    '<path d="M34 58 L24 20 L42 20 L66 52 Z" fill="#fffdf8" stroke="' + NAVY + '" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M25 24 L41 24 L45 30 L27 30 Z" fill="' + NAVY + '"/>' +
    '<path d="M18 60 L62 57 L62 62 L22 64 Z" fill="#fffdf8" stroke="' + NAVY + '" stroke-width="1.4" stroke-linejoin="round"/>' +
    // fuselage
    '<path d="M30 58 C44 51 86 45 128 44 L184 44 C201 45 214 51 220 59 C214 67 200 71 182 72 L126 73 C86 73 50 69 30 63 Z" fill="#fffdf8" stroke="' + NAVY + '" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M44 64 C90 70 150 70 214 63" fill="none" stroke="' + NAVY + '" stroke-width="3.2" stroke-linecap="round"/>' +
    '<path d="M48 68 C92 73 150 73 206 67" fill="none" stroke="' + WAX + '" stroke-width="1.2" stroke-linecap="round"/>' +
    // windows: windshield + side windows
    '<path d="M178 46 L193 47 L203 56 L180 56 Z" fill="#cfe0f2" stroke="' + NAVY + '" stroke-width="1.4" stroke-linejoin="round"/>' +
    '<rect x="148" y="48" width="26" height="9" rx="3" fill="#cfe0f2" stroke="' + NAVY + '" stroke-width="1.4"/>' +
    '<rect x="118" y="48" width="25" height="9" rx="3" fill="#cfe0f2" stroke="' + NAVY + '" stroke-width="1.4"/>' +
    // high wing, seen edge-on, with its strut
    '<rect x="104" y="36" width="92" height="7" rx="3.5" fill="#fffdf8" stroke="' + NAVY + '" stroke-width="1.6"/>' +
    '<path d="M140 69 L176 43" stroke="' + NAVY + '" stroke-width="2" stroke-linecap="round"/>' +
    // registration
    '<text x="70" y="61" font-family="Cormorant, Garamond, serif" font-size="11" font-weight="600" letter-spacing="1.5" fill="' + NAVY + '">F-LOVE</text>' +
    // landing gear
    '<path d="M140 72 L134 86 M202 70 L204 84" stroke="' + NAVY + '" stroke-width="2" stroke-linecap="round"/>' +
    '<ellipse cx="134" cy="88" rx="9" ry="5" fill="#fffdf8" stroke="' + NAVY + '" stroke-width="1.4"/>' +
    '<circle cx="134" cy="90" r="4.5" fill="' + NAVY + '"/>' +
    '<circle cx="204" cy="87" r="3.6" fill="' + NAVY + '"/>' +
    // spinner + spinning propeller
    '<path d="M219 53 Q233 59 219 65 Z" fill="' + NAVY + '"/>' +
    '<g class="sky-prop"><ellipse cx="228" cy="59" rx="3" ry="27" fill="' + NAVY + '" fill-opacity=".22"/>' +
    '<rect x="226.6" y="33" width="2.8" height="52" rx="1.4" fill="' + NAVY + '" fill-opacity=".55"/></g>' +
    "</svg>";

  function rand(seed) { var s = seed * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  function play() {
    var gsap = window.gsap;
    if (!gsap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();

    return new Promise(function (done) {
      var W = window.innerWidth, H = window.innerHeight;
      var sky = document.createElement("div");
      sky.className = "sky";
      sky.innerHTML = '<p class="sky__text">Embarquement immédiat</p><div class="sky__plane">' + PLANE + "</div>";
      document.body.appendChild(sky);
      var tweens = [];

      // three layers of clouds: far (small, pale, slow) → near (big, fast)
      var layers = [
        { n: 10, w: [70, 120], speed: 22, op: 0.75, z: 1, top: [0.02, 0.95] },
        { n: 8, w: [130, 210], speed: 13, op: 0.92, z: 2, top: [0.03, 0.9] },
        { n: 4, w: [240, 360], speed: 7.5, op: 1, z: 4, top: [0.55, 0.95] }
      ];
      var seed = 1;
      layers.forEach(function (L, li) {
        for (var i = 0; i < L.n; i++) {
          var heart = (li === 1 && i % 2 === 0) || (li === 0 && i % 3 === 1);
          var el = document.createElement("div");
          el.className = "sky__cloud" + (heart ? " is-heart" : "");
          var w = L.w[0] + Math.random() * (L.w[1] - L.w[0]);
          if (heart) { el.innerHTML = heartSVG(); w *= 0.62; } else el.innerHTML = cloudSVG(seed++).svg;
          el.style.width = w.toFixed(0) + "px";
          el.style.opacity = L.op;
          el.style.zIndex = L.z;
          el.style.top = ((L.top[0] + Math.random() * (L.top[1] - L.top[0])) * H).toFixed(0) + "px";
          sky.appendChild(el);
          drift(el, w, L.speed, Math.random() * (W + w) - w, heart);
        }
      });

      function drift(el, w, speed, startX, heart) {
        var dist = W + w * 2, dur = speed * (W + w) / W;
        var tw = gsap.fromTo(el, { x: startX }, {
          x: -w, duration: dur * (startX + w) / dist + 0.01, ease: "none",
          onComplete: function () {
            var loop = gsap.fromTo(el, { x: W + 10 }, { x: -w, duration: dur, ease: "none", repeat: -1 });
            tweens.push(loop);
          }
        });
        tweens.push(tw);
        if (heart) tweens.push(gsap.to(el, { rotate: 6, y: -8, duration: 2.4 + Math.random(), yoyo: true, repeat: -1, ease: "sine.inOut" }));
      }

      var plane = sky.querySelector(".sky__plane");
      var prop = sky.querySelector(".sky-prop");
      tweens.push(gsap.to(prop, { scaleY: 0.25, transformOrigin: "228px 59px", duration: 0.06, yoyo: true, repeat: -1, ease: "none" }));

      var tl = gsap.timeline();
      tl.fromTo(sky, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power2.out" })
        .fromTo(".sky__text", { opacity: 0, y: 10, letterSpacing: "0.8em" }, { opacity: 1, y: 0, letterSpacing: "0.38em", duration: 1.6, ease: "expo.out" }, 0.3)
        // the plane surges up from below the screen
        .fromTo(plane, { yPercent: 0, y: H * 0.75, x: -W * 0.08, rotate: -16 }, { y: 0, x: 0, rotate: -4, duration: 2.6, ease: "expo.out" }, 0.4)
        .add(function () {
          tweens.push(gsap.to(plane, { y: -10, rotate: -1.5, duration: 1.5, yoyo: true, repeat: -1, ease: "sine.inOut" }));
        })
        .to({}, { duration: 2.6 })
        // …then flies off, climbing to the right
        .add(function () { tweens.forEach(function (t) { if (t.targets && t.targets()[0] === plane) t.kill(); }); })
        .to(plane, { x: W * 0.95, y: -H * 0.45, rotate: -14, scale: 0.7, duration: 2.2, ease: "power2.in" })
        .to(".sky__text", { opacity: 0, duration: 0.6 }, "<")
        .to(sky, { opacity: 0, duration: 1.1, ease: "power2.inOut" }, "-=0.9")
        .add(finish);

      var finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        tl.kill();
        tweens.forEach(function (t) { t.kill(); });
        sky.remove();
        done();
      }
      // tap to skip
      sky.addEventListener("click", function () {
        gsap.to(sky, { opacity: 0, duration: 0.5, onComplete: finish });
      });
    });
  }

  window.SkyIntro = { play: play };
})();
