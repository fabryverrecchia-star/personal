// Cartes animées : réseau en France, franchise (radar), Italie (caméra), Italie → France (flux).
// Chaque carte se construit depuis #maps-data, se lance quand elle entre à l'écran,
// et porte ses contrôles : rejouer, pause, et pour l'Italie région précédente ou suivante.
// Les cartes placées dans un écran Il Ristorante (data-ui) sont cliquables.
(function () {
  var M = JSON.parse(document.getElementById('maps-data').textContent);
  var NS = 'http://www.w3.org/2000/svg';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var uid = 0;
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function svgFor(box, W, H, label) {
    var s = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': label });
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
    return el('path', { d: d, class: 'land-line ' + (cls || ''), pathLength: 1000 }, g);
  }
  function t(v) { return v.toFixed(2) + 's'; }
  function emit(box, detail) { box.dispatchEvent(new CustomEvent('mapselect', { detail: detail, bubbles: true })); }

  // ---------- 1. Réseau en France ----------
  function network(box) {
    var F = M.fr, id = 'n' + (uid++);
    var s = svgFor(box, F.W, F.H, 'Carte des ' + F.restos.length + ' restaurants Il Ristorante en France');
    defs(s, id);
    var g = el('g', { class: 'plane' }, s);
    land(g, F.path, id);
    var links = el('g', { class: 'links' }, g), rings = el('g', {}, g), dots = el('g', {}, g), labels = el('g', { class: 'rlabels' }, g);
    var order = F.restos.map(function (r, i) { return i; }).sort(function (a, b) { return F.restos[a].xy[1] - F.restos[b].xy[1]; });
    var start = 1.3, step = 0.085, seen = {}, nl = 0;
    F.restos.forEach(function (a, i) {
      F.restos.map(function (b, j) { return { j: j, d: Math.hypot(a.xy[0] - b.xy[0], a.xy[1] - b.xy[1]) }; })
        .filter(function (o) { return o.j !== i; }).sort(function (x, y) { return x.d - y.d; }).slice(0, 2)
        .forEach(function (o) {
          var k = Math.min(i, o.j) + '-' + Math.max(i, o.j);
          if (seen[k]) return; seen[k] = 1; nl++;
          var b = F.restos[o.j], mx = (a.xy[0] + b.xy[0]) / 2, my = (a.xy[1] + b.xy[1]) / 2 - o.d * 0.18;
          el('path', { d: 'M' + a.xy + 'Q' + mx + ',' + my + ' ' + b.xy, pathLength: 100, style: '--t:' + t(start + order.length * step + nl * 0.03) }, links);
        });
    });
    var dotEls = [];
    order.forEach(function (ri, n) {
      var r = F.restos[ri], d = start + n * step;
      el('circle', { cx: r.xy[0], cy: r.xy[1], r: 16, class: 'ring', style: '--t:' + t(d) }, rings);
      var hit = el('g', { class: 'hit', 'data-i': ri, tabindex: box.hasAttribute('data-ui') ? 0 : -1 }, dots);
      el('circle', { cx: r.xy[0], cy: r.xy[1], r: 14, class: 'hitarea' }, hit);
      var c = el('circle', { cx: r.xy[0], cy: r.xy[1], r: 5.5, class: 'pt', style: '--t:' + t(d) + ';--w:' + t((r.xy[1] / F.H) * 1.6), filter: 'url(#glow-' + id + ')' }, hit);
      el('title', {}, c).textContent = r.name;
      dotEls[ri] = hit;
    });
    if (!box.hasAttribute('data-nolabels')) F.regions.forEach(function (rg, i) {
      el('text', { x: rg.xy[0], y: rg.xy[1] - 22, class: 'rl', style: '--t:' + t(start + order.length * step + 0.9 + i * 0.12) }, labels).textContent = rg.name + ' · ' + rg.n;
    });
    var api = { total: start + order.length * step + 1.8, count: order.length, start: start, step: step };
    api.select = function (i) {
      dotEls.forEach(function (h, k) { h.classList.toggle('is-sel', k === i); });
      emit(box, { kind: 'resto', index: i, resto: F.restos[i] });
    };
    if (box.hasAttribute('data-ui')) dotEls.forEach(function (h, i) {
      h.addEventListener('click', function () { api.select(i); });
      h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api.select(i); } });
    });
    return api;
  }

  // ---------- 2. Franchise : radar sur les agglomérations ----------
  function radar(box) {
    var F = M.fr, id = 'r' + (uid++);
    var s = svgFor(box, F.W, F.H, 'Carte des restaurants et des agglomérations où ouvrir');
    var d = defs(s, id);
    el('path', { d: F.path }, el('clipPath', { id: 'clip-' + id }, d));
    var g = el('g', { class: 'plane' }, s);
    land(g, F.path, id);
    var cx = F.W * 0.52, cy = F.H * 0.52, R = 520, period = 5.2;
    var rot = el('g', { class: 'sweep-rot', style: 'transform-origin:' + cx + 'px ' + cy + 'px' }, el('g', { class: 'sweep', 'clip-path': 'url(#clip-' + id + ')' }, g));
    for (var k = 0; k < 14; k++) {
      var a0 = (-k * 3 - 3) * Math.PI / 180, a1 = (-k * 3) * Math.PI / 180;
      el('path', { d: 'M' + cx + ',' + cy + 'L' + (cx + R * Math.cos(a0)) + ',' + (cy + R * Math.sin(a0)) + 'L' + (cx + R * Math.cos(a1)) + ',' + (cy + R * Math.sin(a1)) + 'Z', class: 'wedge', style: 'opacity:' + (0.34 * (1 - k / 14)).toFixed(3) }, rot);
    }
    el('line', { x1: cx, y1: cy, x2: cx + R, y2: cy, class: 'beam' }, rot);
    var big = { Paris: 1, Lyon: 1, Nice: 1, Montpellier: 1, Grenoble: 1, 'Clermont-Ferrand': 1, Brest: 1, Caen: 1, Limoges: 1, Perpignan: 1, 'Le Havre': 1, Angers: 1 };
    var rg = el('g', {}, g);
    F.restos.forEach(function (r) { el('circle', { cx: r.xy[0], cy: r.xy[1], r: 4.5, class: 'pt pt-s' }, rg); });
    var og = el('g', {}, g), hits = [];
    F.opps.forEach(function (o, i) {
      var ang = (Math.atan2(o.xy[1] - cy, o.xy[0] - cx) * 180 / Math.PI + 360) % 360, delay = (ang / 360) * period;
      var h = el('g', { class: 'hit', tabindex: box.hasAttribute('data-ui') ? 0 : -1 }, og);
      el('circle', { cx: o.xy[0], cy: o.xy[1], r: 13, class: 'hitarea' }, h);
      el('circle', { cx: o.xy[0], cy: o.xy[1], r: 7, class: 'opp', style: '--t:' + t(1.2 + delay) + ';--p:' + t(delay) }, h);
      el('title', {}, h).textContent = o.name;
      if (big[o.name]) el('text', { x: o.xy[0] + 11, y: o.xy[1] + 4, class: 'ol', style: '--t:' + t(1.4 + delay) + ';--p:' + t(delay) }, h).textContent = o.name;
      hits.push(h);
    });
    var api = { total: 2 };
    api.select = function (i) {
      hits.forEach(function (h, k) { h.classList.toggle('is-sel', k === i); });
      emit(box, { kind: 'opp', index: i, opp: F.opps[i] });
    };
    if (box.hasAttribute('data-ui')) hits.forEach(function (h, i) {
      h.addEventListener('click', function () { api.select(i); });
      h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api.select(i); } });
    });
    return api;
  }

  // ---------- 3. Italie : caméra sur les régions ----------
  var REGIONS = ['Émilie-Romagne', 'Piémont', 'Pouilles'];
  function italy(box) {
    var I = M.it, id = 'i' + (uid++);
    var s = svgFor(box, I.W, I.H, 'Carte d’Italie des régions de nos produits');
    defs(s, id);
    var g = el('g', { class: 'plane' }, s);
    land(g, I.path, id);
    var og = el('g', {}, g), regions = {};
    var L = { parmigiano: [10, -10, 'start'], prosciutto: [10, 16, 'start'], nocciola: [-10, -6, 'end'], gorgonzola: [10, -6, 'start'], burrata: [10, -14, 'start'], olio: [10, 18, 'start'] };
    I.origins.forEach(function (o, i) {
      (regions[o.region] = regions[o.region] || []).push(o);
      var d = 1.6 + i * 0.16, p = L[o.id] || [10, -8, 'start'];
      var h = el('g', { class: 'hit', 'data-region': o.region, tabindex: box.hasAttribute('data-ui') ? 0 : -1 }, og);
      el('circle', { cx: o.xy[0], cy: o.xy[1], r: 16, class: 'hitarea' }, h);
      el('circle', { cx: o.xy[0], cy: o.xy[1], r: 14, class: 'ring ' + o.status, style: '--t:' + t(d) }, h);
      el('circle', { cx: o.xy[0], cy: o.xy[1], r: 5, class: 'pt ' + o.status, style: '--t:' + t(d), filter: 'url(#glow-' + id + ')' }, h);
      var lg = el('g', { class: 'lab', style: '--t:' + t(d + 0.3) }, h);
      el('text', { x: o.xy[0] + p[0], y: o.xy[1] + p[1], class: 'il', 'text-anchor': p[2] }, lg).textContent = o.product;
      el('text', { x: o.xy[0] + p[0], y: o.xy[1] + p[1] + 12, class: 'ip', 'text-anchor': p[2] }, lg).textContent = o.place;
    });
    var full = [0, 0, I.W, I.H], asp = I.W / I.H;
    function boxOf(list) {
      var xs = list.map(function (o) { return o.xy[0]; }), ys = list.map(function (o) { return o.xy[1]; });
      var x0 = Math.min.apply(0, xs) - 90, x1 = Math.max.apply(0, xs) + 150, y0 = Math.min.apply(0, ys) - 50, y1 = Math.max.apply(0, ys) + 50;
      var w = x1 - x0, h = y1 - y0;
      if (w / h > asp) { var nh = w / asp; y0 -= (nh - h) / 2; h = nh; } else { var nw = h * asp; x0 -= (nw - w) / 2; w = nw; }
      return [x0, y0, w, h];
    }
    var vb = full.slice(), raf = 0, timer = 0, auto = false, pos = -1;
    function setVB(b) { s.setAttribute('viewBox', b.map(function (v) { return v.toFixed(1); }).join(' ')); s.style.setProperty('--z', (I.W / b[2]).toFixed(3)); s.style.overflow = b[2] < I.W - 1 ? 'hidden' : 'visible'; }
    function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    function fly(to, dur, done) {
      cancelAnimationFrame(raf);
      var from = vb.slice(), t0 = performance.now();
      (function f(now) {
        var k = Math.min(1, (now - t0) / (dur * 1000)), e = ease(k);
        vb = from.map(function (v, i) { return v + (to[i] - v) * e; });
        setVB(vb);
        if (k < 1) raf = requestAnimationFrame(f); else if (done) done();
      })(t0);
    }
    var api = { total: 3, regions: REGIONS };
    api.focus = function (key, user) {
      clearTimeout(timer);
      pos = REGIONS.indexOf(key);
      box.querySelectorAll('.hit').forEach(function (h) { h.classList.toggle('is-sel', h.getAttribute('data-region') === key); });
      emit(box, { kind: 'region', region: key, user: !!user });
      fly(key ? boxOf(regions[key]) : full, reduced ? 0.01 : 1.6);
    };
    api.overview = function () { api.focus(null); pos = -1; };
    api.next = function (dir) { auto = false; var n = pos + dir; if (n < -1) n = REGIONS.length - 1; if (n >= REGIONS.length) n = -1; if (n < 0) api.overview(); else api.focus(REGIONS[n], true); };
    function tour() {
      if (!auto) return;
      var n = pos + 1;
      if (n >= REGIONS.length) { api.overview(); timer = setTimeout(function () { pos = -1; tour(); }, 2800); return; }
      api.focus(REGIONS[n]);
      timer = setTimeout(tour, 4200);
    }
    api.live = function () { if (reduced || auto) return; auto = true; timer = setTimeout(tour, 1400); };
    api.pause = function () { auto = false; clearTimeout(timer); };
    api.stop = function () { auto = false; clearTimeout(timer); cancelAnimationFrame(raf); vb = full.slice(); setVB(vb); pos = -1; box.querySelectorAll('.hit').forEach(function (h) { h.classList.remove('is-sel'); }); };
    if (box.hasAttribute('data-ui')) box.querySelectorAll('.hit').forEach(function (h) {
      var go = function () { auto = false; api.focus(h.getAttribute('data-region'), true); };
      h.addEventListener('click', go);
      h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    return api;
  }

  // ---------- 4. De l'Italie à vos tables : flux ----------
  function flows(box) {
    var D = M.duo, id = 'f' + (uid++);
    var s = svgFor(box, D.W, D.H, 'Flux des produits d’Italie vers les restaurants en France');
    defs(s, id);
    var g = el('g', { class: 'plane' }, s);
    land(g, D.fr, id, 'fr');
    land(g, D.it, id, 'it');
    var arcs = el('g', { class: 'arcs' }, g), parts = el('g', { class: 'parts' }, g), seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    D.origins.forEach(function (o, oi) {
      D.restos.forEach(function (r, ri) {
        var dx = r.xy[0] - o.xy[0], dy = r.xy[1] - o.xy[1], len = Math.hypot(dx, dy);
        var mx = (o.xy[0] + r.xy[0]) / 2 - dy * 0.22, my = (o.xy[1] + r.xy[1]) / 2 + dx * 0.22 - len * 0.12;
        var d = 'M' + o.xy + 'Q' + mx.toFixed(1) + ',' + my.toFixed(1) + ' ' + r.xy, dl = 2.4 + oi * 0.18 + ri * 0.02;
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
    return { total: 5 };
  }

  var builders = { network: network, radar: radar, italy: italy, flows: flows };
  var maps = [];

  // ---------- Contrôles ----------
  var ICON = {
    replay: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8a4.5 4.5 0 1 0 1.3-3.2M3.5 2.5v2.8h2.8" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9M11 3.5v9" stroke="currentColor" stroke-width="1.8"/></svg>',
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6L12.5 8Z" fill="currentColor"/></svg>',
    prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  };
  function btn(label, icon, fn) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'mc'; b.setAttribute('aria-label', label); b.title = label;
    b.innerHTML = ICON[icon];
    b.addEventListener('click', fn);
    return b;
  }
  function controls(m) {
    var bar = document.createElement('div');
    bar.className = 'mapctl';
    var pp = btn('Pause', 'pause', function () { setPaused(m, !m.paused); });
    m.pp = pp;
    bar.appendChild(btn('Rejouer l’animation', 'replay', function () { replay(m); }));
    bar.appendChild(pp);
    if (m.kind === 'italy') {
      bar.appendChild(btn('Région précédente', 'prev', function () { m.api.next(-1); }));
      bar.appendChild(btn('Région suivante', 'next', function () { m.api.next(1); }));
    }
    m.box.parentElement.appendChild(bar);
  }
  function setPaused(m, v) {
    m.paused = v;
    m.box.classList.toggle('paused', v);
    m.pp.innerHTML = v ? ICON.play : ICON.pause;
    m.pp.setAttribute('aria-label', v ? 'Lecture' : 'Pause'); m.pp.title = v ? 'Lecture' : 'Pause';
    if (m.api.pause) { if (v) m.api.pause(); else if (m.box.classList.contains('live')) m.api.live(); }
  }

  // ---------- Lecture ----------
  function build(m) {
    m.box.innerHTML = '';
    m.box.classList.remove('go', 'live', 'instant', 'paused');
    m.api = builders[m.kind](m.box);
    m.played = false;
  }
  function play(m) {
    if (m.played) return; m.played = true;
    void m.box.offsetWidth;
    m.box.classList.add('go');
    if (reduced) m.box.classList.add('instant');
    (m.timers || []).forEach(clearTimeout); m.timers = [];
    if (m.counter && m.api.count) {
      var n = 0;
      m.counter.textContent = reduced ? m.api.count : 0;
      if (!reduced) for (var i = 0; i < m.api.count; i++) m.timers.push(setTimeout(function () { m.counter.textContent = ++n; }, (m.api.start + i * m.api.step) * 1000));
    }
    m.timers.push(setTimeout(function () { m.box.classList.add('live'); if (m.api.live && !m.paused) m.api.live(); }, m.api.total * 1000));
  }
  function replay(m) {
    (m.timers || []).forEach(clearTimeout);
    if (m.api.stop) m.api.stop();
    build(m);
    if (m.pp) { m.paused = false; m.pp.innerHTML = ICON.pause; }
    requestAnimationFrame(function () { play(m); });
    m.box.dispatchEvent(new CustomEvent('mapreplay', { bubbles: true }));
  }

  document.querySelectorAll('[data-map]').forEach(function (box) {
    var m = { box: box, kind: box.getAttribute('data-map') };
    build(m);
    var stage = box.getAttribute('data-stage');
    if (stage) { box.classList.add('stage-' + stage, 'go', 'instant'); m.still = true; }
    else controls(m);
    m.counter = box.getAttribute('data-counter') ? document.querySelector(box.getAttribute('data-counter')) : null;
    box.__map = m;
    maps.push(m);
  });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var m = e.target.__map;
      if (!m || m.still) return;
      if (e.isIntersecting) { if (!m.played) play(m); else if (m.api.live && !m.paused && m.box.classList.contains('live')) m.api.live(); }
      else if (m.api.pause) m.api.pause();
    });
  }, { threshold: 0.3 });
  maps.forEach(function (m) { io.observe(m.box); });
  window.__maps = maps;

  // Impression : état final, sans mouvement
  window.__mapsFinal = function () {
    maps.forEach(function (m) {
      if (m.api.stop) m.api.stop();
      m.box.classList.add('go', 'instant', 'live');
      if (m.counter && m.api.count) m.counter.textContent = m.api.count;
    });
  };

  // ---------- Écrans Il Ristorante : panneaux reliés aux cartes ----------
  function $(s, r) { return (r || document).querySelector(s); }
  // Italie : liste des régions, fiche de la région choisie
  document.querySelectorAll('[data-ui-italy]').forEach(function (ui) {
    var box = $('[data-map="italy"]', ui), m = box.__map;
    var tabs = ui.querySelectorAll('[data-go-region]');
    tabs.forEach(function (b) { b.addEventListener('click', function () { var k = b.getAttribute('data-go-region'); if (k) m.api.focus(k, true); else m.api.overview(); }); });
    ui.addEventListener('mapselect', function (e) {
      var k = e.detail.region;
      tabs.forEach(function (b) { b.classList.toggle('is-on', (b.getAttribute('data-go-region') || null) === k); });
      ui.querySelectorAll('[data-card]').forEach(function (c) { c.hidden = c.getAttribute('data-card') !== (k || 'all'); });
    });
  });
  // Réseau : fiche du restaurant choisi
  document.querySelectorAll('[data-ui-network]').forEach(function (ui) {
    var card = $('[data-resto-card]', ui);
    ui.addEventListener('mapselect', function (e) {
      var r = e.detail.resto;
      card.hidden = false;
      $('[data-r-name]', card).textContent = r.name;
      $('[data-r-addr]', card).textContent = (r.street || '') + ', ' + (r.cp || '') + ' ' + (r.city || '');
      $('[data-r-hours]', card).textContent = (r.hours || []).join(' · ');
      $('[data-r-phone]', card).textContent = r.phone || '';
      $('[data-r-url]', card).textContent = 'ilristorante.fr/' + (r.slug || '');
      card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
    });
    ui.addEventListener('mapreplay', function () { card.hidden = true; });
  });
  // Franchise : fiche de la ville choisie
  document.querySelectorAll('[data-ui-franchise]').forEach(function (ui) {
    var card = $('[data-city-card]', ui);
    ui.addEventListener('mapselect', function (e) {
      var o = e.detail.opp;
      card.hidden = false;
      ui.querySelectorAll('[data-city]').forEach(function (n) { n.textContent = o.name; });
      $('[data-near]', card).textContent = o.near;
      $('[data-km]', card).textContent = o.km + ' km';
      card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
    });
    ui.addEventListener('mapreplay', function () { card.hidden = true; });
    var f = $('form', ui);
    if (f) f.addEventListener('submit', function (e) { e.preventDefault(); $('[data-cand-status]', ui).textContent = 'Candidature préparée pour ' + $('[data-city]', ui).textContent + ' (démonstration).'; });
  });
})();
