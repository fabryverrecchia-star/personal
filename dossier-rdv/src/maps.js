// Cartes animées : réseau en France, franchise (radar), Italie (caméra), Italie → France (flux).
// Chaque carte se construit depuis #maps-data et se lance quand sa slide entre à l'écran.
(function () {
  var M = JSON.parse(document.getElementById('maps-data').textContent);
  var NS = 'http://www.w3.org/2000/svg';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function svgFor(box, W, H) {
    var s = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' });
    box.appendChild(s);
    return s;
  }
  function defs(s, id) {
    var d = el('defs', {}, s);
    var p = el('pattern', { id: 'dots-' + id, width: 7, height: 7, patternUnits: 'userSpaceOnUse' }, d);
    el('circle', { cx: 3.5, cy: 3.5, r: 0.9, class: 'dotp' }, p);
    var f = el('filter', { id: 'glow-' + id, x: '-50%', y: '-50%', width: '200%', height: '200%' }, d);
    el('feGaussianBlur', { stdDeviation: 3.2, result: 'b' }, f);
    var m = el('feMerge', {}, f);
    el('feMergeNode', { in: 'b' }, m);
    el('feMergeNode', { in: 'SourceGraphic' }, m);
    return d;
  }
  function land(g, d, id, cls) {
    el('path', { d: d, class: 'land-fill ' + (cls || ''), fill: 'url(#dots-' + id + ')' }, g);
    var st = el('path', { d: d, class: 'land-line ' + (cls || ''), pathLength: 1000 }, g);
    return st;
  }
  function t(v) { return v.toFixed(2) + 's'; }

  // ---------- 1. Réseau en France ----------
  function network(box, opts) {
    var F = M.fr, id = 'n' + Math.random().toString(36).slice(2, 6);
    var s = svgFor(box, F.W, F.H);
    s.setAttribute('aria-label', 'Carte des ' + F.restos.length + ' restaurants Il Ristorante en France');
    defs(s, id);
    var g = el('g', { class: 'plane' }, s);
    land(g, F.path, id);
    var links = el('g', { class: 'links' }, g);
    var rings = el('g', {}, g);
    var dots = el('g', {}, g);
    var labels = el('g', { class: 'rlabels' }, g);
    var list = F.restos.slice().sort(function (a, b) { return a.xy[1] - b.xy[1]; });
    var start = 1.3, step = 0.085;
    // Réseau : chaque restaurant relié à ses deux voisins les plus proches
    var seen = {};
    F.restos.forEach(function (a, i) {
      F.restos.map(function (b, j) { return { j: j, d: Math.hypot(a.xy[0] - b.xy[0], a.xy[1] - b.xy[1]) }; })
        .filter(function (o) { return o.j !== i; }).sort(function (x, y) { return x.d - y.d; }).slice(0, 2)
        .forEach(function (o) {
          var k = Math.min(i, o.j) + '-' + Math.max(i, o.j);
          if (seen[k]) return; seen[k] = 1;
          var b = F.restos[o.j];
          var mx = (a.xy[0] + b.xy[0]) / 2, my = (a.xy[1] + b.xy[1]) / 2 - o.d * 0.18;
          el('path', { d: 'M' + a.xy + 'Q' + mx + ',' + my + ' ' + b.xy, pathLength: 100, style: '--t:' + t(start + list.length * step + Object.keys(seen).length * 0.03) }, links);
        });
    });
    list.forEach(function (r, i) {
      var d = start + i * step;
      el('circle', { cx: r.xy[0], cy: r.xy[1], r: 16, class: 'ring', style: '--t:' + t(d) }, rings);
      var c = el('circle', { cx: r.xy[0], cy: r.xy[1], r: 5.5, class: 'pt', style: '--t:' + t(d) + ';--w:' + t((r.xy[1] / F.H) * 1.6), filter: 'url(#glow-' + id + ')' }, dots);
      var ti = el('title', {}, c); ti.textContent = r.name;
    });
    if (opts.labels !== false) F.regions.forEach(function (rg, i) {
      var x = rg.xy[0], y = rg.xy[1] - 22;
      var tx = el('text', { x: x, y: y, class: 'rl', style: '--t:' + t(start + list.length * step + 0.9 + i * 0.12) }, labels);
      tx.textContent = rg.name + ' · ' + rg.n;
    });
    return { svg: s, total: start + list.length * step + 1.8, list: list, start: start, step: step };
  }

  // ---------- 2. Franchise : radar sur les agglomérations ----------
  function radar(box) {
    var F = M.fr, id = 'r' + Math.random().toString(36).slice(2, 6);
    var s = svgFor(box, F.W, F.H);
    s.setAttribute('aria-label', 'Carte des restaurants et des agglomérations où ouvrir');
    var d = defs(s, id);
    var cp = el('clipPath', { id: 'clip-' + id }, d);
    el('path', { d: F.path }, cp);
    var g = el('g', { class: 'plane' }, s);
    land(g, F.path, id);
    var cx = F.W * 0.52, cy = F.H * 0.52, R = 520;
    var sw = el('g', { class: 'sweep', 'clip-path': 'url(#clip-' + id + ')' }, g);
    var rot = el('g', { class: 'sweep-rot', style: 'transform-origin:' + cx + 'px ' + cy + 'px' }, sw);
    for (var k = 0; k < 14; k++) {
      var a0 = (-k * 3 - 3) * Math.PI / 180, a1 = (-k * 3) * Math.PI / 180;
      el('path', { d: 'M' + cx + ',' + cy + 'L' + (cx + R * Math.cos(a0)) + ',' + (cy + R * Math.sin(a0)) + 'L' + (cx + R * Math.cos(a1)) + ',' + (cy + R * Math.sin(a1)) + 'Z', class: 'wedge', style: 'opacity:' + (0.34 * (1 - k / 14)).toFixed(3) }, rot);
    }
    el('line', { x1: cx, y1: cy, x2: cx + R, y2: cy, class: 'beam' }, rot);
    var period = 5.2;
    var big = { Paris: 1, Lyon: 1, Nice: 1, Montpellier: 1, Grenoble: 1, 'Clermont-Ferrand': 1, Brest: 1, Caen: 1, Limoges: 1, Perpignan: 1, 'Le Havre': 1, Angers: 1 };
    var og = el('g', {}, g);
    F.opps.forEach(function (o) {
      var ang = (Math.atan2(o.xy[1] - cy, o.xy[0] - cx) * 180 / Math.PI + 360) % 360;
      var delay = (ang / 360) * period;
      el('circle', { cx: o.xy[0], cy: o.xy[1], r: 7, class: 'opp', style: '--t:' + t(1.2 + delay) + ';--p:' + t(delay) }, og);
      if (big[o.name]) {
        var tx = el('text', { x: o.xy[0] + 11, y: o.xy[1] + 4, class: 'ol', style: '--t:' + t(1.4 + delay) }, og);
        tx.textContent = o.name;
      }
    });
    var rg = el('g', {}, g);
    F.restos.forEach(function (r) { el('circle', { cx: r.xy[0], cy: r.xy[1], r: 4.5, class: 'pt pt-s' }, rg); });
    return { svg: s, total: 2 };
  }

  // ---------- 3. Italie : caméra sur les régions ----------
  function italy(box, panel) {
    var I = M.it, id = 'i' + Math.random().toString(36).slice(2, 6);
    var s = svgFor(box, I.W, I.H);
    s.setAttribute('aria-label', 'Carte d’Italie des régions de nos produits');
    defs(s, id);
    var g = el('g', { class: 'plane' }, s);
    land(g, I.path, id);
    var og = el('g', {}, g);
    var regions = {};
    I.origins.forEach(function (o, i) {
      (regions[o.region] = regions[o.region] || []).push(o);
      var d = 1.6 + i * 0.16;
      el('circle', { cx: o.xy[0], cy: o.xy[1], r: 14, class: 'ring ' + o.status, style: '--t:' + t(d) }, og);
      el('circle', { cx: o.xy[0], cy: o.xy[1], r: 5, class: 'pt ' + o.status, style: '--t:' + t(d), filter: 'url(#glow-' + id + ')' }, og);
      // Placement des étiquettes, point par point, pour éviter les chevauchements
      var L = { parmigiano: [10, -10, 'start'], prosciutto: [10, 16, 'start'], nocciola: [-10, -6, 'end'], gorgonzola: [10, -6, 'start'], burrata: [10, -14, 'start'], olio: [10, 18, 'start'] }[o.id] || [10, -8, 'start'];
      var lg = el('g', { class: 'lab', style: '--t:' + t(d + 0.3) }, og);
      var tx = el('text', { x: o.xy[0] + L[0], y: o.xy[1] + L[1], class: 'il', 'text-anchor': L[2] }, lg);
      tx.textContent = o.product;
      var tp = el('text', { x: o.xy[0] + L[0], y: o.xy[1] + L[1] + 12, class: 'ip', 'text-anchor': L[2] }, lg);
      tp.textContent = o.place;
    });
    // Plans de caméra : vue d'ensemble, puis chaque région
    var full = [0, 0, I.W, I.H], asp = I.W / I.H;
    function boxOf(list) {
      var xs = list.map(function (o) { return o.xy[0]; }), ys = list.map(function (o) { return o.xy[1]; });
      var x0 = Math.min.apply(0, xs) - 90, x1 = Math.max.apply(0, xs) + 150, y0 = Math.min.apply(0, ys) - 50, y1 = Math.max.apply(0, ys) + 50;
      var w = x1 - x0, h = y1 - y0;
      if (w / h > asp) { var nh = w / asp; y0 -= (nh - h) / 2; h = nh; } else { var nw = h * asp; x0 -= (nw - w) / 2; w = nw; }
      return [x0, y0, w, h];
    }
    var shots = [{ box: full, key: null, hold: 2.2 }];
    ['Émilie-Romagne', 'Piémont', 'Pouilles'].forEach(function (k) { shots.push({ box: boxOf(regions[k]), key: k, hold: 2.6 }); shots.push({ box: full, key: null, hold: 0.8 }); });
    var items = panel ? Array.prototype.slice.call(panel.querySelectorAll('[data-region]')) : [];
    var vb = full.slice(), raf = 0, running = false;
    function setVB(b) { s.setAttribute('viewBox', b.map(function (v) { return v.toFixed(1); }).join(' ')); s.style.setProperty('--z', (I.W / b[2]).toFixed(3)); s.style.overflow = b[2] < I.W - 1 ? 'hidden' : 'visible'; }
    function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    function fly(to, dur, done) {
      var from = vb.slice(), t0 = performance.now();
      (function f(now) {
        var k = Math.min(1, (now - t0) / (dur * 1000)), e = ease(k);
        vb = from.map(function (v, i) { return v + (to[i] - v) * e; });
        setVB(vb);
        if (k < 1 && running) raf = requestAnimationFrame(f); else if (done) done();
      })(t0);
    }
    function tour(i) {
      if (!running) return;
      var sh = shots[i % shots.length];
      items.forEach(function (it) { it.classList.toggle('is-on', it.getAttribute('data-region') === sh.key); });
      fly(sh.box, 1.6, function () { setTimeout(function () { tour(i + 1); }, sh.hold * 1000); });
    }
    return {
      svg: s, total: 3,
      live: function () { if (reduced || running) return; running = true; setTimeout(function () { tour(1); }, 3200); },
      stop: function () { running = false; cancelAnimationFrame(raf); vb = full.slice(); setVB(vb); items.forEach(function (it) { it.classList.remove('is-on'); }); },
    };
  }

  // ---------- 4. De l'Italie à vos tables : flux ----------
  function flows(box) {
    var D = M.duo, id = 'f' + Math.random().toString(36).slice(2, 6);
    var s = svgFor(box, D.W, D.H);
    s.setAttribute('aria-label', 'Flux des produits d’Italie vers les restaurants en France');
    defs(s, id);
    var g = el('g', { class: 'plane' }, s);
    land(g, D.fr, id, 'fr');
    land(g, D.it, id, 'it');
    var arcs = el('g', { class: 'arcs' }, g);
    var parts = el('g', { class: 'parts' }, g);
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    D.origins.forEach(function (o, oi) {
      D.restos.forEach(function (r, ri) {
        var dx = r.xy[0] - o.xy[0], dy = r.xy[1] - o.xy[1], len = Math.hypot(dx, dy);
        var mx = (o.xy[0] + r.xy[0]) / 2 - dy * 0.22, my = (o.xy[1] + r.xy[1]) / 2 + dx * 0.22 - len * 0.12;
        var d = 'M' + o.xy + 'Q' + mx.toFixed(1) + ',' + my.toFixed(1) + ' ' + r.xy;
        var dl = 2.4 + oi * 0.18 + ri * 0.02;
        el('path', { d: d, pathLength: 100, class: 'arc ' + o.status, style: '--t:' + t(dl) }, arcs);
        el('path', { d: d, pathLength: 100, class: 'part ' + o.status, style: '--t:' + t(dl + 1) + ';--s:' + (2.6 + rnd() * 2.4).toFixed(2) + 's;--o:' + (-rnd() * 4).toFixed(2) + 's' }, parts);
      });
    });
    var pg = el('g', {}, g);
    D.restos.forEach(function (r, i) { el('circle', { cx: r.xy[0], cy: r.xy[1], r: 4, class: 'pt pt-s', style: '--t:' + t(1.2 + i * 0.04) }, pg); });
    D.origins.forEach(function (o, i) {
      el('circle', { cx: o.xy[0], cy: o.xy[1], r: 13, class: 'ring ' + o.status, style: '--t:' + t(1.6 + i * 0.12) }, pg);
      el('circle', { cx: o.xy[0], cy: o.xy[1], r: 5.5, class: 'pt ' + o.status, style: '--t:' + t(1.6 + i * 0.12), filter: 'url(#glow-' + id + ')' }, pg);
    });
    return { svg: s, total: 5 };
  }

  // ---------- Montage et déclenchement ----------
  var maps = [];
  document.querySelectorAll('[data-map]').forEach(function (box) {
    var kind = box.getAttribute('data-map');
    var stage = box.getAttribute('data-stage');
    var m = kind === 'network' ? network(box, { labels: box.hasAttribute('data-nolabels') ? false : true })
      : kind === 'radar' ? radar(box)
      : kind === 'italy' ? italy(box, document.querySelector(box.getAttribute('data-panel')))
      : flows(box);
    m.box = box; m.kind = kind;
    if (stage) box.classList.add('stage-' + stage, 'go', 'instant');
    maps.push(m);
    var counter = box.getAttribute('data-counter') ? document.querySelector(box.getAttribute('data-counter')) : null;
    m.counter = counter;
  });
  function play(m) {
    if (m.played) return; m.played = true;
    m.box.classList.add('go');
    if (reduced) m.box.classList.add('instant');
    if (m.counter && m.list) {
      var n = 0, total = m.list.length;
      if (reduced) m.counter.textContent = total;
      else m.list.forEach(function (r, i) { setTimeout(function () { m.counter.textContent = ++n; }, (m.start + i * m.step) * 1000); });
    }
    setTimeout(function () { m.box.classList.add('live'); if (m.live) m.live(); }, m.total * 1000);
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var m = maps.filter(function (x) { return x.box === e.target; })[0];
      if (!m || m.box.getAttribute('data-stage')) return;
      if (e.isIntersecting) play(m);
      else if (m.stop) m.stop();
      if (e.isIntersecting && m.played && m.live) m.live();
    });
  }, { threshold: 0.3 });
  maps.forEach(function (m) { io.observe(m.box); });
  // Impression : état final, sans mouvement
  window.__mapsFinal = function () {
    maps.forEach(function (m) {
      if (m.stop) m.stop();
      m.box.classList.add('go', 'instant', 'live');
      if (m.counter && m.list) m.counter.textContent = m.list.length;
    });
  };
})();
