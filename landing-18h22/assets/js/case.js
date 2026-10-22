/* ==========================================================================
   Page projet : s'ouvre au clic sur un projet qui a une entrée dans CASES.
   Un calque plein écran qui défile seul (Lenis reste en pause derrière).
   ========================================================================== */
(function () {
  'use strict';

  var CASES = window.CASES || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.getElementById('case');
  if (!root) return;

  var T = {
    fr: { close: 'Fermer', back: 'Retour aux projets', client: 'Client', place: 'Lieu', missions: 'Missions', typeface: 'Typographie',
      mood: 'Atmosphère', logo: 'Construction du logo', system: 'Système', menus: 'Menus', print: 'Print & digital', palette: 'Palette', type: 'Typographie',
      moodT: 'La salle, la table, la lumière de Saint-Germain.', systemT: 'Logotype, monogramme, sceaux et fleur : un alphabet de signes pour toute la maison.',
      menusT: 'La carte d’hiver, en français et en anglais.', printT: 'Cartes, livre, tote bag, façade et réseaux sociaux.',
      paletteT: 'Cinq teintes prises au soleil de la Méditerranée.', typeT: 'Une capitale à deux voix : sobre pour lire, déliée pour signer.',
      steps: ['L’ellipse, au rapport 1 : 1,6', 'Le monogramme : l’alpha noué au A', 'La couronne de lettres', 'La signature complète'],
      uses: { base: 'Fond', light: 'Lumière', signature: 'Signature', text: 'Texte', warm: 'Chaleur' }, share: 'Usage', credit: 'Typographie : ' },
    en: { close: 'Close', back: 'Back to projects', client: 'Client', place: 'Location', missions: 'Scope', typeface: 'Typeface',
      mood: 'Atmosphere', logo: 'Logo construction', system: 'System', menus: 'Menus', print: 'Print & digital', palette: 'Palette', type: 'Typeface',
      moodT: 'The room, the table, the Saint-Germain light.', systemT: 'Logotype, monogram, seals and flower: an alphabet of signs for the whole house.',
      menusT: 'The winter menu, in French and English.', printT: 'Cards, book, tote bag, shopfront and social media.',
      paletteT: 'Five tones taken from the Mediterranean sun.', typeT: 'A capital with two voices: plain to read, flowing to sign.',
      steps: ['The ellipse, at a 1 : 1.6 ratio', 'The monogram: alpha knotted to A', 'The crown of letters', 'The complete signature'],
      uses: { base: 'Ground', light: 'Light', signature: 'Signature', text: 'Text', warm: 'Warmth' }, share: 'Use', credit: 'Typeface: ' },
    es: { close: 'Cerrar', back: 'Volver a los proyectos', client: 'Cliente', place: 'Lugar', missions: 'Misiones', typeface: 'Tipografía',
      mood: 'Atmósfera', logo: 'Construcción del logo', system: 'Sistema', menus: 'Menús', print: 'Print y digital', palette: 'Paleta', type: 'Tipografía',
      moodT: 'La sala, la mesa, la luz de Saint-Germain.', systemT: 'Logotipo, monograma, sellos y flor: un alfabeto de signos para toda la casa.',
      menusT: 'La carta de invierno, en francés y en inglés.', printT: 'Tarjetas, libro, tote bag, fachada y redes sociales.',
      paletteT: 'Cinco tonos tomados del sol del Mediterráneo.', typeT: 'Una capital a dos voces: sobria para leer, suelta para firmar.',
      steps: ['La elipse, en proporción 1 : 1,6', 'El monograma: la alfa anudada a la A', 'La corona de letras', 'La firma completa'],
      uses: { base: 'Fondo', light: 'Luz', signature: 'Firma', text: 'Texto', warm: 'Calidez' }, share: 'Uso', credit: 'Tipografía: ' },
    it: { close: 'Chiudi', back: 'Torna ai progetti', client: 'Cliente', place: 'Luogo', missions: 'Missioni', typeface: 'Tipografia',
      mood: 'Atmosfera', logo: 'Costruzione del logo', system: 'Sistema', menus: 'Menu', print: 'Print e digital', palette: 'Palette', type: 'Tipografia',
      moodT: 'La sala, la tavola, la luce di Saint-Germain.', systemT: 'Logotipo, monogramma, sigilli e fiore: un alfabeto di segni per tutta la casa.',
      menusT: 'Il menu d’inverno, in francese e in inglese.', printT: 'Biglietti, libro, tote bag, facciata e social.',
      paletteT: 'Cinque toni presi dal sole del Mediterraneo.', typeT: 'Una capitale a due voci: sobria per leggere, sciolta per firmare.',
      steps: ['L’ellisse, in rapporto 1 : 1,6', 'Il monogramma: l’alfa annodata alla A', 'La corona di lettere', 'La firma completa'],
      uses: { base: 'Fondo', light: 'Luce', signature: 'Firma', text: 'Testo', warm: 'Calore' }, share: 'Uso', credit: 'Tipografia: ' }
  };
  function lang() { var l = document.documentElement.lang; return T[l] ? l : 'fr'; }
  function tr(v) { return v && typeof v === 'object' ? (v[lang()] || v.fr) : (v || ''); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ramp(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var scroller = root.querySelector('.case__scroll');
  var inner = root.querySelector('.case__inner');
  var closeBtn = root.querySelector('.case__close');
  var data = null, at0 = null, running = false, sections = [], figs = [], io = null;

  /* ---------- Rendu ---------- */
  function head(b) {
    var t = T[lang()];
    return '<header class="case__head"><h3>' + esc(t[b.label]) + '</h3>' + (t[b.label + 'T'] ? '<p>' + esc(t[b.label + 'T']) + '</p>' : '') + '</header>';
  }
  function fig(im) {
    return '<figure class="cm" style="--ar:' + (im.w / im.h).toFixed(4) + '" data-ar="' + (im.w / im.h).toFixed(4) + '"><img src="' + im.src + '" width="' + im.w + '" height="' + im.h + '" alt="" loading="lazy" decoding="async"></figure>';
  }
  function gallery(b) {
    var html = '';
    b.rows.forEach(function (row, r) {
      html += '<div class="cg__row cg__row--' + row.length + (r % 2 ? ' is-odd' : '') + '">' +
        row.map(fig).join('') + '</div>';
    });
    return '<div class="cg">' + html + '</div>';
  }
  function logo(b) {
    var t = T[lang()];
    return '<div class="clogo__stage"><div class="clogo__svg" data-src="' + b.src + '"></div>' +
      '<ol class="clogo__steps">' + t.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>';
  }
  function menus(b) {
    return '<div class="cmenu__stage">' + b.items.map(function (src, i) {
      return '<figure class="cmenu__card cmenu__card--' + i + '"><img src="' + src.src + '" alt="" decoding="async"><i class="cmenu__shine"></i></figure>';
    }).join('') + head(b) + '</div>';
  }
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function cmyk(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, k = 1 - Math.max(r, g, b);
    if (k >= 1) return [0, 0, 0, 100];
    return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map(function (v) { return Math.round(v * 100); });
  }
  function palette(b) {
    var t = T[lang()];
    return '<div class="cpal">' + b.colors.map(function (c, i) {
      var v = rgb(c.hex), lum = (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) / 255;
      return '<div class="cpal__sw' + (lum > 0.6 ? ' is-light' : '') + '" style="--c:' + c.hex + ';--w:' + c.share + ';--i:' + i + '" tabindex="0">' +
        '<div class="cpal__fill"></div>' +
        '<div class="cpal__top"><span>' + esc(t.uses[c.use] || '') + '</span><span>' + c.share + '%</span></div>' +
        '<div class="cpal__info"><b>' + esc(c.name) + '</b>' +
        '<dl><dt>HEX</dt><dd>' + c.hex + '</dd><dt>RGB</dt><dd>' + v.join(' ') + '</dd><dt>CMYK</dt><dd>' + cmyk(v).join(' ') + '</dd></dl></div></div>';
    }).join('') + '</div>' +
    '<div class="cpal__bar">' + b.colors.map(function (c) { return '<i style="--c:' + c.hex + ';--w:' + c.share + '"></i>'; }).join('') + '</div>' +
    '<p class="cpal__note">' + esc(t.share) + '</p>';
  }
  function type(b) {
    var t = T[lang()];
    return '<div class="cg"><div class="cg__row cg__row--1">' + fig(b.img) + '</div></div>' +
      '<p class="ctype__credit">' + esc(t.credit) + esc(b.credit) + '</p>';
  }

  function render(c) {
    var t = T[lang()];
    var html = '<section class="chero" data-bg="#050c0c" data-ink="#dfe7ea"><div class="chero__img"><img src="' + c.cover.src + '" alt="' + esc(c.title) + '" decoding="async"></div>' +
      '<div class="chero__txt"><h2 class="chero__t"><span class="chero__mask"><span>' + esc(c.title) + '</span></span></h2>' +
      '<p class="chero__m"><span class="chero__mask"><span>' + esc(tr(c.place)) + '</span></span></p></div></section>' +
      '<section class="cintro" data-bg="#050c0c" data-ink="#dfe7ea"><p class="cintro__p">' + esc(tr(c.intro)) + '</p><dl class="cintro__facts">' +
      c.facts.map(function (f) { return '<div><dt>' + esc(t[f[0]]) + '</dt><dd>' + esc(tr(f[1])) + '</dd></div>'; }).join('') + '</dl></section>';
    c.blocks.forEach(function (b) {
      var ink = b.ink || (isDark(b.bg) ? '#dfe7ea' : '#1b1d24');
      var body = b.type === 'gallery' ? gallery(b) : b.type === 'logo' ? logo(b) : b.type === 'menus' ? menus(b) : b.type === 'palette' ? palette(b) : type(b);
      html += '<section class="cs cs--' + b.type + '" data-bg="' + b.bg + '" data-ink="' + ink + '"' + (b.color ? ' style="--accent:' + b.color + '"' : '') + '>' +
        (b.type === 'logo' || b.type === 'menus' ? '' : head(b)) + body + '</section>';
    });
    html += '<footer class="cend" data-bg="#050c0c" data-ink="#dfe7ea"><button type="button" class="case__back">' + esc(t.back) + '</button>' +
      '<p>' + esc(c.title) + ' · 18H22</p></footer>';
    inner.innerHTML = html;
    closeBtn.textContent = t.close;
    inner.querySelector('.case__back').addEventListener('click', close);
  }
  function isDark(hex) { var v = rgb(hex); return (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) / 255 < 0.5; }

  /* ---------- Galeries : rangées à hauteur égale, sans dépasser l'écran ---------- */
  function layoutRows() {
    var vh = window.innerHeight, mobile = window.innerWidth < 700;
    [].forEach.call(inner.querySelectorAll('.cg__row'), function (row) {
      var figsR = row.querySelectorAll('.cm'), n = figsR.length;
      var cs = getComputedStyle(row), gap = parseFloat(cs.columnGap) || 0;
      var W = row.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var sum = 0;
      [].forEach.call(figsR, function (f) { sum += +f.getAttribute('data-ar'); });
      var h = (W - gap * (n - 1)) / sum;
      var cap = vh * (mobile ? 0.9 : n > 1 ? 0.84 : 0.88);
      if (n === 1 && sum < 1.35) cap = Math.min(cap, (W * (mobile ? 0.8 : 0.6)) / sum);
      h = Math.min(h, cap);
      // sur téléphone, deux visuels larges côte à côte deviennent illisibles : on les empile
      var stack = mobile && n > 1 && h < vh * 0.22;
      row.classList.toggle('is-stack', stack);
      [].forEach.call(figsR, function (f) {
        var ar = +f.getAttribute('data-ar');
        f.style.width = (stack ? Math.min(W, cap * ar) : h * ar).toFixed(1) + 'px';
      });
    });
  }

  /* ---------- Logo : on dessine la construction ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  var logoParts = null;
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function buildLogo(box) {
    fetch(box.getAttribute('data-src')).then(function (r) { return r.text(); }).then(function (txt) {
      box.innerHTML = txt.replace(/<\?xml[^>]*>/, '').replace(/<style>[\s\S]*?<\/style>/, '');
      var svg = box.querySelector('svg');
      if (!svg) return;
      svg.removeAttribute('id');
      svg.setAttribute('viewBox', '-14 -14 229 198');
      svg.setAttribute('aria-hidden', 'true');
      var groups = svg.querySelectorAll(':scope > g');
      var main = groups[2] ? groups[2].querySelectorAll(':scope > g') : [];
      var shape = main[0] ? main[0].querySelectorAll('path') : [];
      var crown = main[1] ? main[1].querySelectorAll('path') : [];
      var words = [].slice.call(groups[0] ? groups[0].querySelectorAll('path') : []).concat([].slice.call(groups[1] ? groups[1].querySelectorAll('path') : []));

      // traits de construction, sous le logo
      var g = el('g', { class: 'clogo__guides' });
      svg.insertBefore(g, svg.firstChild);
      var guides = [
        el('ellipse', { cx: 98.18, cy: 101.73, rx: 42.59, ry: 68.12 }, g),
        el('ellipse', { cx: 98.18, cy: 101.73, rx: 39.2, ry: 64.56 }, g),
        el('circle', { cx: 98.2, cy: 104.5, r: 99.5, class: 'is-dash' }, g),
        el('line', { x1: 38, y1: 101.73, x2: 158, y2: 101.73 }, g),
        el('line', { x1: 98.18, y1: 22, x2: 98.18, y2: 182 }, g),
        el('line', { x1: 56, y1: 77.8, x2: 140, y2: 77.8, class: 'is-dash' }, g),
        el('line', { x1: 56, y1: 120.6, x2: 140, y2: 120.6, class: 'is-dash' }, g),
        el('line', { x1: 98.99, y1: 70.13, x2: 121.9, y2: 126, class: 'is-key' }, g),
        el('circle', { cx: 80.3, cy: 106.4, r: 11.6, class: 'is-key' }, g)
      ];
      guides.forEach(function (e) { e.setAttribute('pathLength', '1'); });
      var notes = [
        ['1 : 1,6', 145, 60], ['68°', 123.5, 110], ['x', 101, 75.5], ['base', 57, 124.5]
      ].map(function (n) { var t = el('text', { x: n[1], y: n[2], class: 'clogo__note' }, g); t.textContent = n[0]; return t; });

      [].forEach.call(shape, function (p) { p.setAttribute('pathLength', '1'); p.classList.add('clogo__draw'); });
      [].forEach.call(crown, function (p) { p.classList.add('clogo__letter'); });
      words.forEach(function (p) { p.classList.add('clogo__letter'); });
      logoParts = { svg: svg, guides: guides, notes: notes, shape: shape, crown: [].slice.call(crown), words: words };
      paintLogo(0);
    }).catch(function () { box.classList.add('is-static'); });
  }
  function paintLogo(p) {
    var L = logoParts;
    if (!L) return;
    var gOut = 1 - 0.7 * ramp(p, 0.82, 0.96);
    L.guides.forEach(function (e, i) {
      var k = ease(ramp(p, 0.02 + i * 0.015, 0.16 + i * 0.015));
      if (e.classList.contains('is-dash')) e.style.opacity = (k * gOut).toFixed(3);
      else { e.style.strokeDashoffset = (1 - k).toFixed(4); e.style.opacity = gOut.toFixed(3); }
    });
    L.notes.forEach(function (n, i) { n.style.opacity = (ramp(p, 0.14 + i * 0.02, 0.22 + i * 0.02) * gOut).toFixed(3); });
    var fill = ramp(p, 0.46, 0.6);
    [].forEach.call(L.shape, function (s, i) {
      s.style.strokeDashoffset = (1 - ease(ramp(p, 0.18 + i * 0.06, 0.46 + i * 0.04))).toFixed(4);
      s.style.fillOpacity = fill.toFixed(3);
      s.style.strokeOpacity = (1 - ramp(p, 0.6, 0.7)).toFixed(3);
    });
    var n = L.crown.length;
    L.crown.forEach(function (s, i) {
      var k = ramp(p, 0.6 + (i / n) * 0.18, 0.64 + (i / n) * 0.18);
      s.style.opacity = k.toFixed(3);
    });
    L.words.forEach(function (s, i) { s.style.opacity = ramp(p, 0.8 + i * 0.006, 0.86 + i * 0.006).toFixed(3); });
    var step = p < 0.17 ? 0 : p < 0.58 ? 1 : p < 0.8 ? 2 : 3;
    var lis = root.querySelectorAll('.clogo__steps li');
    for (var i = 0; i < lis.length; i++) lis[i].classList.toggle('is-on', i === step);
  }

  /* ---------- Menus : les deux cartes se séparent en diptyque ---------- */
  var tilt = { x: 0, y: 0, sx: 0, sy: 0 };
  root.addEventListener('pointermove', function (e) {
    tilt.x = e.clientX / window.innerWidth * 2 - 1;
    tilt.y = e.clientY / window.innerHeight * 2 - 1;
  });
  function paintMenus(sec, p) {
    var cards = sec.querySelectorAll('.cmenu__card');
    if (cards.length < 2) return;
    var w = cards[0].offsetWidth, mobile = window.innerWidth < 700;
    var e = ease(ramp(p, 0.08, 0.62));
    var open = Math.sin(Math.PI * ramp(p, 0.08, 0.62)); // ouverture en livre, puis à plat
    var gap = mobile ? 0.53 : 0.6;
    tilt.sx += (tilt.x - tilt.sx) * 0.08; tilt.sy += (tilt.y - tilt.sy) * 0.08;
    var settle = ramp(p, 0.62, 0.8);
    [0, 1].forEach(function (i) {
      var s = i ? 1 : -1;
      var x = s * e * w * gap + (1 - e) * (i ? 14 : -6);
      var y = (1 - e) * (i ? 10 : -4) + Math.sin(p * 6 + i) * 4 * settle;
      var rz = (1 - e) * (i ? 5 : -3) + s * 1.2 * settle;
      var ry = -s * (open * 28 + settle * 6) + tilt.sx * 8 * settle;
      var rx = -tilt.sy * 6 * settle;
      cards[i].style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotateY(' + ry.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg) rotateZ(' + rz.toFixed(2) + 'deg)';
      cards[i].style.zIndex = i ? 1 : 2;
      cards[i].querySelector('.cmenu__shine').style.transform = 'translateX(' + (-120 + 240 * ramp(p, 0.55 + i * 0.05, 0.9 + i * 0.05)).toFixed(1) + '%)';
    });
  }

  /* ---------- Boucle de défilement ---------- */
  var bgNow = '';
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    var vh = window.innerHeight, y = scroller.scrollTop;
    var hero = inner.querySelector('.chero__img img');
    if (hero) hero.style.transform = 'translate3d(0,' + (y * 0.35).toFixed(1) + 'px,0) scale(' + (1.04 + Math.min(y / vh, 1) * 0.08).toFixed(4) + ')';
    var txt = inner.querySelector('.chero__txt');
    if (txt) txt.style.opacity = (1 - clamp(y / (vh * 0.55), 0, 1)).toFixed(3);
    // couleur du fond : la section qui occupe le milieu de l'écran
    var pick = null;
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      if (r.top <= vh * 0.55 && r.bottom > vh * 0.55) pick = sections[i];
      if (sections[i].classList.contains('cs--logo')) paintLogo(clamp(-r.top / Math.max(1, r.height - vh), 0, 1));
      if (sections[i].classList.contains('cs--menus') && r.top < vh && r.bottom > 0) paintMenus(sections[i], clamp(-r.top / Math.max(1, r.height - vh), 0, 1));
    }
    if (pick && pick.getAttribute('data-bg') !== bgNow) {
      bgNow = pick.getAttribute('data-bg');
      root.style.setProperty('--case-bg', bgNow);
      root.style.setProperty('--case-ink', pick.getAttribute('data-ink'));
    }
    // légère parallaxe dans les images
    for (var j = 0; j < figs.length; j++) {
      var f = figs[j], fr = f.getBoundingClientRect();
      if (fr.bottom < 0 || fr.top > vh) continue;
      var d = (fr.top + fr.height / 2 - vh / 2) / vh;
      f.firstChild.style.transform = 'translate3d(0,' + (d * -6).toFixed(2) + '%,0) scale(1.12)';
    }
  }

  /* ---------- Ouvrir / fermer ---------- */
  function has(title) { return !!CASES[String(title || '').trim().toLowerCase()]; }
  function open(title, at) {
    data = CASES[String(title).trim().toLowerCase()];
    if (!data) return false;
    render(data);
    sections = [].slice.call(inner.querySelectorAll('section, footer'));
    figs = [].slice.call(inner.querySelectorAll('.cm'));
    layoutRows();
    var box = inner.querySelector('.clogo__svg');
    logoParts = null;
    if (box) buildLogo(box);
    if (io) io.disconnect();
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { root: scroller, rootMargin: '0px 0px -12% 0px' });
    [].forEach.call(inner.querySelectorAll('.cm, .cs__head, .case__head, .cpal, .cintro, .ctype__credit, .cpal__bar'), function (n) { io.observe(n); });

    scroller.scrollTop = 0;
    bgNow = '';
    root.style.setProperty('--case-bg', '#050c0c');
    root.style.setProperty('--case-ink', '#dfe7ea');
    at0 = at || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked', 'is-case');
    running = true;
    requestAnimationFrame(frame);
    var masks = inner.querySelectorAll('.chero__mask > span');
    if (window.gsap && !reduce) {
      var big = Math.hypot(window.innerWidth, window.innerHeight);
      gsap.fromTo(root, { clipPath: 'circle(0px at ' + at0.x + 'px ' + at0.y + 'px)' },
        { clipPath: 'circle(' + big + 'px at ' + at0.x + 'px ' + at0.y + 'px)', duration: 1.2, ease: 'expo.inOut', onComplete: function () { root.style.clipPath = 'none'; } });
      gsap.fromTo(inner.querySelector('.chero__img'), { scale: 1.25, filter: 'blur(10px)' }, { scale: 1, filter: 'blur(0px)', duration: 1.6, ease: 'expo.out', delay: 0.2 });
      gsap.fromTo(masks, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, delay: 0.7 });
      gsap.fromTo(closeBtn, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.9 });
    }
    return true;
  }
  function close() {
    if (!root.classList.contains('is-open')) return;
    var end = function () {
      running = false;
      root.classList.remove('is-open');
      root.setAttribute('aria-hidden', 'true');
      root.style.clipPath = '';
      document.body.classList.remove('is-locked', 'is-case');
      inner.innerHTML = '';
      if (io) io.disconnect();
    };
    if (!window.gsap || reduce) return end();
    var at = at0 || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var big = Math.hypot(window.innerWidth, window.innerHeight);
    gsap.fromTo(root, { clipPath: 'circle(' + big + 'px at ' + at.x + 'px ' + at.y + 'px)' },
      { clipPath: 'circle(0px at ' + at.x + 'px ' + at.y + 'px)', duration: 0.9, ease: 'expo.inOut', onComplete: end });
  }
  closeBtn.addEventListener('click', close);
  window.addEventListener('resize', function () { if (root.classList.contains('is-open')) layoutRows(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('is-open')) close(); });
  // palette : au toucher, la teinte s'ouvre
  root.addEventListener('click', function (e) {
    var sw = e.target.closest && e.target.closest('.cpal__sw');
    if (!sw) return;
    var on = sw.classList.contains('is-on');
    [].forEach.call(root.querySelectorAll('.cpal__sw.is-on'), function (s) { s.classList.remove('is-on'); });
    if (!on) sw.classList.add('is-on');
  });

  window.CASE = { has: has, open: open, close: close };
})();
