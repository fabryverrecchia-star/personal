/* ==========================================================================
   Page projet : s'ouvre au clic sur un projet qui a une entrée dans CASES.
   Un calque plein écran qui défile seul (Lenis reste en pause derrière).
   ========================================================================== */
(function () {
  'use strict';

  var CASES = window.CASES || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // au doigt, le défilement natif est composé hors du JS : toute parallaxe calculée image par image
  // arrive avec une image de retard et fait trembler le contenu. On la confie au CSS quand il sait le faire.
  var touch = window.matchMedia('(pointer: coarse)').matches;
  var cssScroll = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'));
  if (cssScroll) document.documentElement.classList.add('has-sda');
  var root = document.getElementById('case');
  if (!root) return;

  var T = {
    fr: { close: 'Fermer', back: 'Retour aux projets', client: 'Client', place: 'Lieu', missions: 'Missions', typeface: 'Typographie',
      mood: 'Atmosphère', logo: 'Construction du logo', system: 'Système', menus: 'Menus', print: 'Print & digital', palette: 'Palette', type: 'Typographie',
      moodT: 'La salle, la table, la lumière de Saint-Germain.', systemT: 'Logotype, monogramme, sceaux et fleur : un alphabet de signes pour toute la maison.',
      menusT: 'La carte d’hiver, en français et en anglais.', printT: 'Cartes, livre, tote bag, façade et réseaux sociaux.',
      paletteT: 'Cinq teintes prises au soleil de la Méditerranée.', typeT: 'Une capitale à deux voix : sobre pour lire, déliée pour signer.',
      steps: ['L’ellipse, au rapport 1 : 1,6', 'Le monogramme : l’alpha noué au A', 'La couronne de lettres', 'La signature complète'],
      plates: { wordmark: 'Logotype', alt: 'Logotype, variante et médaillon', scales: 'Monogramme, trois échelles', seals: 'Sceaux', fleur: 'Emblème', badge: 'Médaillon', photos: 'Applications' }, rows: ['Capitales', 'Capitales', 'Ornées', 'Ornées', 'Chiffres et signes', 'Chiffres et signes'], pick: 'Touchez une lettre', uses: { base: 'Fond', light: 'Lumière', signature: 'Signature', text: 'Texte', warm: 'Chaleur' }, share: 'Usage', credit: 'Typographie : ' },
    en: { close: 'Close', back: 'Back to projects', client: 'Client', place: 'Location', missions: 'Scope', typeface: 'Typeface',
      mood: 'Atmosphere', logo: 'Logo construction', system: 'System', menus: 'Menus', print: 'Print & digital', palette: 'Palette', type: 'Typeface',
      moodT: 'The room, the table, the Saint-Germain light.', systemT: 'Logotype, monogram, seals and flower: an alphabet of signs for the whole house.',
      menusT: 'The winter menu, in French and English.', printT: 'Cards, book, tote bag, shopfront and social media.',
      paletteT: 'Five tones taken from the Mediterranean sun.', typeT: 'A capital with two voices: plain to read, flowing to sign.',
      steps: ['The ellipse, at a 1 : 1.6 ratio', 'The monogram: alpha knotted to A', 'The crown of letters', 'The complete signature'],
      plates: { wordmark: 'Logotype', alt: 'Logotype, variant and medallion', scales: 'Monogram, three scales', seals: 'Seals', fleur: 'Emblem', badge: 'Medallion', photos: 'Applications' }, rows: ['Capitals', 'Capitals', 'Swash', 'Swash', 'Figures and signs', 'Figures and signs'], pick: 'Tap a letter', uses: { base: 'Ground', light: 'Light', signature: 'Signature', text: 'Text', warm: 'Warmth' }, share: 'Use', credit: 'Typeface: ' },
    es: { close: 'Cerrar', back: 'Volver a los proyectos', client: 'Cliente', place: 'Lugar', missions: 'Misiones', typeface: 'Tipografía',
      mood: 'Atmósfera', logo: 'Construcción del logo', system: 'Sistema', menus: 'Menús', print: 'Print y digital', palette: 'Paleta', type: 'Tipografía',
      moodT: 'La sala, la mesa, la luz de Saint-Germain.', systemT: 'Logotipo, monograma, sellos y flor: un alfabeto de signos para toda la casa.',
      menusT: 'La carta de invierno, en francés y en inglés.', printT: 'Tarjetas, libro, tote bag, fachada y redes sociales.',
      paletteT: 'Cinco tonos tomados del sol del Mediterráneo.', typeT: 'Una capital a dos voces: sobria para leer, suelta para firmar.',
      steps: ['La elipse, en proporción 1 : 1,6', 'El monograma: la alfa anudada a la A', 'La corona de letras', 'La firma completa'],
      plates: { wordmark: 'Logotipo', alt: 'Logotipo, variante y medallón', scales: 'Monograma, tres escalas', seals: 'Sellos', fleur: 'Emblema', badge: 'Medallón', photos: 'Aplicaciones' }, rows: ['Mayúsculas', 'Mayúsculas', 'Ornamentadas', 'Ornamentadas', 'Cifras y signos', 'Cifras y signos'], pick: 'Toca una letra', uses: { base: 'Fondo', light: 'Luz', signature: 'Firma', text: 'Texto', warm: 'Calidez' }, share: 'Uso', credit: 'Tipografía: ' },
    it: { close: 'Chiudi', back: 'Torna ai progetti', client: 'Cliente', place: 'Luogo', missions: 'Missioni', typeface: 'Tipografia',
      mood: 'Atmosfera', logo: 'Costruzione del logo', system: 'Sistema', menus: 'Menu', print: 'Print e digital', palette: 'Palette', type: 'Tipografia',
      moodT: 'La sala, la tavola, la luce di Saint-Germain.', systemT: 'Logotipo, monogramma, sigilli e fiore: un alfabeto di segni per tutta la casa.',
      menusT: 'Il menu d’inverno, in francese e in inglese.', printT: 'Biglietti, libro, tote bag, facciata e social.',
      paletteT: 'Cinque toni presi dal sole del Mediterraneo.', typeT: 'Una capitale a due voci: sobria per leggere, sciolta per firmare.',
      steps: ['L’ellisse, in rapporto 1 : 1,6', 'Il monogramma: l’alfa annodata alla A', 'La corona di lettere', 'La firma completa'],
      plates: { wordmark: 'Logotipo', alt: 'Logotipo, variante e medaglione', scales: 'Monogramma, tre scale', seals: 'Sigilli', fleur: 'Emblema', badge: 'Medaglione', photos: 'Applicazioni' }, rows: ['Maiuscole', 'Maiuscole', 'Ornate', 'Ornate', 'Cifre e segni', 'Cifre e segni'], pick: 'Tocca una lettera', uses: { base: 'Fondo', light: 'Luce', signature: 'Firma', text: 'Testo', warm: 'Calore' }, share: 'Uso', credit: 'Tipografia: ' }
  };
  // pages construites à partir des visuels du projet (clients sans page écrite)
  var TA = {
    fr: { web: 'En ligne', webT: 'Le site, écran par écran.', work: 'Réalisations', workT: '', paletteA: 'Les teintes du projet, relevées dans ses images.', untitled: 'Projet', year: 'Année' },
    en: { web: 'Online', webT: 'The website, screen by screen.', work: 'Work', workT: '', paletteA: 'The project’s hues, sampled from its images.', untitled: 'Project', year: 'Year' },
    es: { web: 'En línea', webT: 'El sitio, pantalla a pantalla.', work: 'Trabajos', workT: '', paletteA: 'Los tonos del proyecto, tomados de sus imágenes.', untitled: 'Proyecto', year: 'Año' },
    it: { web: 'Online', webT: 'Il sito, schermata per schermata.', work: 'Lavori', workT: '', paletteA: 'Le tinte del progetto, rilevate nelle sue immagini.', untitled: 'Progetto', year: 'Anno' }
  };
  for (var tl in TA) for (var tk in TA[tl]) T[tl][tk] = TA[tl][tk];
  var SV = {
    'website': { fr: 'Site web', en: 'Website', es: 'Sitio web', it: 'Sito web' },
    'identity design': { fr: 'Identité visuelle', en: 'Identity design', es: 'Identidad visual', it: 'Identità visiva' },
    'retail design': { fr: 'Design d’espace', en: 'Retail design', es: 'Diseño de espacios', it: 'Design degli spazi' }
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
  var data = null, at0 = null, running = false, sections = [], figs = [];

  /* ---------- Rendu ---------- */
  function head(b) {
    var t = T[lang()];
    var txt = t[b.textKey || b.label + 'T'];
    return '<header class="case__head"><h3>' + esc(t[b.label]) + '</h3>' + (txt ? '<p>' + esc(txt) + '</p>' : '') + '</header>';
  }
  function fig(im) {
    // le dévoilement passe par deux calques qui glissent en sens inverse (pas de clip-path :
    // Safari laissait voir l'image en place un instant avant l'animation)
    return '<figure class="cm" style="--ar:' + (im.w / im.h).toFixed(4) + '" data-ar="' + (im.w / im.h).toFixed(4) + '"><div class="cm__m"><div class="cm__c">' +
      '<img src="' + im.src + '" width="' + im.w + '" height="' + im.h + '" alt="" decoding="async"></div></div></figure>';
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
  /* ---------- Sites : une fenêtre de navigateur où les écrans se succèdent au défilement ---------- */
  function screens(b) {
    var n = b.items.length;
    return '<div class="cscr__stage">' + head(b) + '<div class="cscr__win"><div class="cscr__bar"><i></i><i></i><i></i><span>' + esc(b.name || '') + '</span></div>' +
      '<div class="cscr__view">' + b.items.map(function (im, i) {
        return '<div class="cscr__s" style="z-index:' + (i + 1) + '"><div class="cscr__c"><img src="' + im.src + '" alt="" decoding="async"></div></div>';
      }).join('') + '</div></div>' +
      '<p class="cscr__n"><span class="cscr__k">01</span> / ' + (n < 10 ? '0' : '') + n + '</p></div>';
  }

  /* ---------- Planches vectorielles (logotypes, sceaux, fleur, glyphes) ---------- */
  var RED = '#d75443', BROWN = '#3c2217';
  function vec() { return (window.CASE_VECTORS || {})[String(data && data.title || '').toLowerCase()] || {}; }
  function word(w, cls) {
    return '<svg class="cwm ' + (cls || '') + '" viewBox="0 0 ' + w.w + ' ' + w.h + '" aria-hidden="true">' +
      w.letters.map(function (d, i) { return '<path class="cl" style="--i:' + i + '" d="' + d + '"/>'; }).join('') + '</svg>';
  }
  function mono(cls, extra) {
    var m = vec().monogram;
    return '<svg class="cmono ' + (cls || '') + '" viewBox="69 76 57 47" aria-hidden="true"' + (extra || '') + '><path d="' + m.d + '"/></svg>';
  }
  function badge(cls) {
    var m = vec().monogram;
    return '<svg class="cbadge ' + (cls || '') + '" viewBox="0 0 120 180" aria-hidden="true">' +
      '<ellipse class="cbadge__ring" cx="60" cy="90" rx="55" ry="85" pathLength="1"/>' +
      '<g transform="translate(60 91) scale(1.45) translate(-97.5 -99)"><path class="cbadge__mono" d="' + m.d + '"/></g></svg>';
  }
  function plate(label, inner, cls, attrs) {
    return '<figure class="cplate ' + (cls || '') + '" data-rev' + (attrs || '') + '>' + inner + '<figcaption>' + esc(label) + '</figcaption></figure>';
  }
  function system(b) {
    var t = T[lang()], V = vec(), html = '';
    if (!V.wordmark) return gallery(b);
    html += plate(t.plates.wordmark,
      '<div class="cplate__duo"><div class="cplate__cell" style="background:#fff;color:#161616">' + word(V.wordmark) + '</div>' +
      '<div class="cplate__cell" style="background:#faf7f3;color:' + RED + '">' + word(V.wordmark) + '</div></div>', 'cplate--wm');
    html += plate(t.plates.alt,
      '<div class="cplate__cell cplate__cell--alt" style="color:' + RED + '">' + badge() + word(V.logotype, 'cwm--alt') + '</div>', 'cplate--alt');
    html += plate(t.plates.scales,
      '<div class="cplate__duo"><div class="cplate__cell cplate__scales" style="background:#fff;color:#161616">' + mono('s1') + mono('s2') + mono('s3') + '</div>' +
      '<div class="cplate__cell cplate__scales" style="background:#faf7f3;color:' + RED + '">' + mono('s1') + mono('s2') + mono('s3') + '</div></div>', 'cplate--scales');
    html += plate(t.plates.seals, '<div class="cplate__duo">' + V.seals.map(function (sl, i) {
      return '<div class="cplate__cell" style="background:' + (i ? '#f4f3f1' : '#fff') + ';color:' + (i ? BROWN : RED) + '">' +
        '<svg class="cseal" viewBox="0 0 ' + sl.w + ' ' + sl.h + '" aria-hidden="true"><g class="cseal__ring" data-cx="' + sl.w / 2 + '" data-cy="' + sl.h / 2 + '"><path fill-rule="evenodd" d="' + sl.ring + '"/></g>' +
        '<path class="cseal__core" fill-rule="evenodd" d="' + sl.core + '"/></svg></div>';
    }).join('') + '</div>', 'cplate--seals');
    var F = V.fleur;
    html += plate(t.plates.fleur, '<div class="cplate__duo"><div class="cplate__cell" style="background:#fff;color:' + RED + '">' +
      '<svg class="cfleur" viewBox="0 0 ' + F.w + ' ' + F.h + '" aria-hidden="true"><defs><clipPath id="cfleurClip"><rect class="cfleur__grow" x="-10" width="' + (F.w + 20) + '" y="' + F.h + '" height="' + (F.h + 10) + '"/></clipPath></defs>' +
      '<path class="cfleur__ghost" fill-rule="evenodd" d="' + F.d + '"/><path clip-path="url(#cfleurClip)" fill-rule="evenodd" d="' + F.d + '"/></svg></div>' +
      '<div class="cplate__cell cplate__cell--photo">' + photo(b.photos.fleur) + '</div></div>', 'cplate--fleur');
    html += plate(t.plates.badge, '<div class="cplate__duo"><div class="cplate__cell cplate__cell--photo">' + photo(b.photos.coupe) + '</div>' +
      '<div class="cplate__cell" style="background:#fff;color:' + RED + '">' + badge('cbadge--solo') + '</div></div>', 'cplate--badge');
    return '<div class="csys">' + html + '</div>' + (b.rows ? '<p class="csys__label">' + esc(t.plates.photos) + '</p>' + gallery(b) : '');
  }
  function photo(im) { return '<img src="' + im.src + '" width="' + im.w + '" height="' + im.h + '" alt="" decoding="async">'; }

  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function cmyk(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, k = 1 - Math.max(r, g, b);
    if (k >= 1) return [0, 0, 0, 100];
    return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map(function (v) { return Math.round(v * 100); });
  }
  function palette(b) {
    if (!b.colors) return '<div class="cpal" data-auto></div><div class="cpal__bar"></div><p class="cpal__note">' + esc(T[lang()].share) + '</p>';
    return swatches(b.colors);
  }
  function swatches(colors) {
    var t = T[lang()];
    return '<div class="cpal">' + colors.map(function (c, i) {
      var v = rgb(c.hex), lum = (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) / 255;
      return '<div class="cpal__sw' + (lum > 0.6 ? ' is-light' : '') + '" style="--c:' + c.hex + ';--w:' + c.share + ';--i:' + i + '" tabindex="0">' +
        '<div class="cpal__fill"></div>' +
        '<div class="cpal__top"><span>' + esc(t.uses[c.use] || '') + '</span><span>' + c.share + '%</span></div>' +
        '<div class="cpal__info"><b>' + esc(c.name) + '</b>' +
        '<dl><dt>HEX</dt><dd>' + c.hex + '</dd><dt>RGB</dt><dd>' + v.join(' ') + '</dd><dt>CMYK</dt><dd>' + cmyk(v).join(' ') + '</dd></dl></div></div>';
    }).join('') + '</div>' +
    '<div class="cpal__bar">' + colors.map(function (c) { return '<i style="--c:' + c.hex + ';--w:' + c.share + '"></i>'; }).join('') + '</div>' +
    '<p class="cpal__note">' + esc(t.share) + '</p>';
  }
  function type(b) {
    var t = T[lang()], Gl = vec().glyphs;
    if (!Gl) return '<p class="ctype__credit" data-rev>' + esc(t.credit) + esc(b.credit) + '</p>';
    var grid = '<svg class="ctype__grid" viewBox="-6 -6 ' + (Gl.w + 12) + ' ' + (Gl.h + 12) + '" aria-hidden="true">' + Gl.items.map(function (g, i) {
      return '<g class="ctype__g" data-k="' + i + '" style="--r:' + g.row + ';--i:' + i + '" transform="translate(' + g.x + ' ' + g.y + ')">' +
        '<rect x="-4" y="-4" width="' + (g.w + 8) + '" height="' + (g.h + 8) + '"/><path fill-rule="evenodd" d="' + g.d + '"/></g>';
    }).join('') + '</svg>';
    return '<div class="ctype" data-rev><div class="ctype__view"><svg class="ctype__big" viewBox="0 0 100 100" aria-hidden="true"><path fill-rule="evenodd"/></svg>' +
      '<p class="ctype__name"><span class="ctype__ch"></span><span class="ctype__row"></span></p></div>' +
      '<div class="ctype__side">' + grid + '<p class="ctype__hint">' + esc(t.pick) + '</p></div></div>' +
      (b.photo ? '<div class="cg"><div class="cg__row cg__row--1 is-odd">' + fig(b.photo) + '</div></div>' : '') +
      '<p class="ctype__credit" data-rev>' + esc(t.credit) + esc(b.credit) + '</p>';
  }
  var glyphAt = -1, glyphAuto = null, glyphTouched = false;
  function showGlyph(k) {
    var Gl = vec().glyphs, sec = inner.querySelector('.ctype');
    if (!Gl || !sec) return;
    k = (k + Gl.items.length) % Gl.items.length;
    if (k === glyphAt) return;
    glyphAt = k;
    var g = Gl.items[k], big = sec.querySelector('.ctype__big'), path = big.querySelector('path');
    // même hauteur de ligne pour toutes les lettres d'une rangée : la lettre garde sa taille relative
    var size = Math.max(g.w, 76);
    big.setAttribute('viewBox', (-(size - g.w) / 2).toFixed(1) + ' ' + (g.h / 2 - size / 2).toFixed(1) + ' ' + size + ' ' + size);
    path.setAttribute('d', g.d);
    sec.querySelector('.ctype__ch').textContent = g.ch;
    sec.querySelector('.ctype__row').textContent = T[lang()].rows[g.row];
    [].forEach.call(sec.querySelectorAll('.ctype__g.is-on'), function (n) { n.classList.remove('is-on'); });
    var on = sec.querySelector('.ctype__g[data-k="' + k + '"]'); if (on) on.classList.add('is-on');
    big.classList.remove('is-pop'); void big.getBoundingClientRect(); big.classList.add('is-pop');
  }

  function render(c) {
    var t = T[lang()];
    var html = '<section class="chero' + (c.web ? ' chero--web' : '') + '" data-bg="#050c0c" data-ink="#dfe7ea"><div class="chero__img"><img src="' + c.cover.src + '" alt="' + esc(c.title) + '" decoding="async"></div>' +
      '<div class="chero__txt"><h2 class="chero__t"><span class="chero__mask"><span>' + esc(c.title) + '</span></span></h2>' +
      '<p class="chero__m"><span class="chero__mask"><span>' + esc(tr(c.place)) + '</span></span></p></div></section>' +
      '<section class="cintro" data-bg="#050c0c" data-ink="#dfe7ea"><p class="cintro__p">' + esc(tr(c.intro)) + '</p><dl class="cintro__facts">' +
      c.facts.map(function (f) { return '<div><dt>' + esc(t[f[0]]) + '</dt><dd>' + esc(tr(f[1])) + '</dd></div>'; }).join('') + '</dl></section>';
    c.blocks.forEach(function (b) {
      var ink = b.ink || (isDark(b.bg) ? '#dfe7ea' : '#1b1d24');
      var body = b.type === 'screens' ? screens(b) : b.type === 'gallery' ? gallery(b) : b.type === 'system' ? system(b) : b.type === 'logo' ? logo(b) : b.type === 'menus' ? menus(b) : b.type === 'palette' ? palette(b) : type(b);
      var st = (b.color ? '--accent:' + b.color + ';' : '') + (b.type === 'screens' ? 'height:' + (b.items.length * 100 + 60) + 'svh;' : '');
      html += '<section class="cs cs--' + b.type + '" data-bg="' + b.bg + '" data-ink="' + ink + '"' + (st ? ' style="' + st + '"' : '') + '>' +
        (b.type === 'logo' || b.type === 'menus' || b.type === 'screens' ? '' : head(b)) + body + '</section>';
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
      var stack = mobile && n > 1 && h < vh * 0.3;
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
    if (touch) { var now = performance.now() / 1000; tilt.x = Math.sin(now * 0.7) * 0.7; tilt.y = Math.cos(now * 0.55) * 0.5; }
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

  /* ---------- Écrans : la fenêtre se redresse, puis chaque page monte sur la précédente ---------- */
  function paintScreens(sec, p) {
    var win = sec.querySelector('.cscr__win'), ss = sec.querySelectorAll('.cscr__s'), n = ss.length;
    if (!win || !n) return;
    var o = ease(ramp(p, 0, 0.16));
    tilt.sx += (tilt.x - tilt.sx) * 0.08; tilt.sy += (tilt.y - tilt.sy) * 0.08;
    if (touch) { var now = performance.now() / 1000; tilt.x = Math.sin(now * 0.7) * 0.5; tilt.y = Math.cos(now * 0.55) * 0.4; }
    win.style.transform = 'translate3d(0,' + ((1 - o) * 12).toFixed(2) + 'vh,0) rotateX(' + ((1 - o) * 26 - tilt.sy * 3 * o).toFixed(2) + 'deg) rotateY(' + (tilt.sx * 4 * o).toFixed(2) + 'deg) scale(' + (0.82 + 0.18 * o).toFixed(4) + ')';
    var span = 0.84 / n, cur = 0;
    for (var i = 0; i < n; i++) {
      var a = 0.16 + (i - 1) * span + span * 0.35, k = i ? ease(ramp(p, a, a + span * 0.65)) : 1;
      var next = i < n - 1 ? ease(ramp(p, 0.16 + i * span + span * 0.35, 0.16 + (i + 1) * span)) : 0;
      if (k > 0.5) cur = i;
      ss[i].style.transform = 'translate3d(0,' + ((1 - k) * 100).toFixed(2) + '%,0)';
      var c = ss[i].firstChild;
      c.style.transform = 'translate3d(0,' + ((k - 1) * 100 + next * 18).toFixed(2) + '%,0) scale(' + (1.08 - 0.08 * k).toFixed(4) + ')';
      c.style.opacity = (1 - next * 0.55).toFixed(3);
    }
    var lbl = sec.querySelector('.cscr__k'), txt = (cur + 1 < 10 ? '0' : '') + (cur + 1);
    if (lbl && lbl.textContent !== txt) lbl.textContent = txt;
  }

  /* ---------- Boucle de défilement ---------- */
  var bgNow = '', revs = [], seals = [], grow = null, pal = null;
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    var vh = window.innerHeight, y = scroller.scrollTop;
    var hero = !cssScroll && !touch && inner.querySelector('.chero__img img');
    if (hero) hero.style.transform = 'translate3d(0,' + (y * 0.35).toFixed(1) + 'px,0) scale(' + (1.04 + Math.min(y / vh, 1) * 0.08).toFixed(4) + ')';
    var txt = inner.querySelector('.chero__txt');
    if (txt && !cssScroll) txt.style.opacity = (1 - clamp(y / (vh * 0.55), 0, 1)).toFixed(3);
    // couleur du fond : la section qui occupe le milieu de l'écran
    var pick = null;
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      if (r.top <= vh * 0.55 && r.bottom > vh * 0.55) pick = sections[i];
      if (sections[i].classList.contains('cs--logo')) paintLogo(clamp(-r.top / Math.max(1, r.height - vh), 0, 1));
      if (sections[i].classList.contains('cs--menus') && r.top < vh && r.bottom > 0) paintMenus(sections[i], clamp(-r.top / Math.max(1, r.height - vh), 0, 1));
      if (sections[i].classList.contains('cs--screens') && r.top < vh && r.bottom > 0) paintScreens(sections[i], clamp(-r.top / Math.max(1, r.height - vh), 0, 1));
    }
    if (pick && pick.getAttribute('data-bg') !== bgNow) {
      bgNow = pick.getAttribute('data-bg');
      root.style.setProperty('--case-bg', bgNow);
      root.style.setProperty('--case-ink', pick.getAttribute('data-ink'));
    }
    // apparitions : tout élément qui entre dans l'écran se dévoile (calcul direct, sans observateur)
    for (var k = 0; k < revs.length; k++) {
      var rv = revs[k];
      if (rv.classList.contains('is-in')) continue;
      var rr = rv.getBoundingClientRect();
      if (rr.top < vh * 0.94) rv.classList.add('is-in'); // y compris ce qu'un défilement rapide a sauté
    }
    // sceaux : la couronne de lettres tourne avec le défilement ; la fleur pousse
    for (var q = 0; q < seals.length; q++) {
      var sr = seals[q].getBoundingClientRect();
      if (sr.bottom < 0 || sr.top > vh) continue;
      var a = ((sr.top + sr.height / 2) / vh - 0.5) * -70;
      seals[q].setAttribute('transform', 'rotate(' + a.toFixed(2) + ' ' + seals[q].getAttribute('data-cx') + ' ' + seals[q].getAttribute('data-cy') + ')');
    }
    if (grow) {
      var gr = grow.svg.getBoundingClientRect();
      var gp = ease(clamp((vh * 0.95 - gr.top) / (vh * 0.75), 0, 1));
      grow.rect.setAttribute('y', (grow.h * (1 - gp)).toFixed(1));
    }
    // palette au doigt : la teinte qui passe au milieu de l'écran s'ouvre, comme au survol
    if (touch && pal) {
      var pr = pal.getBoundingClientRect(), sws = pal.children;
      if (sws.length && pr.top < vh && pr.bottom > 0) {
        var pk = Math.floor(clamp((vh * 0.5 - pr.top) / pr.height, 0, 0.999) * sws.length);
        for (var s2 = 0; s2 < sws.length; s2++) if (sws[s2].classList.contains('is-on') !== (s2 === pk)) sws[s2].classList.toggle('is-on', s2 === pk);
      }
    }
    // légère parallaxe dans les images (souris uniquement, sinon le CSS s'en charge)
    for (var j = 0; !cssScroll && !touch && j < figs.length; j++) {
      var f = figs[j], fr = f.getBoundingClientRect();
      if (fr.bottom < 0 || fr.top > vh) continue;
      var d = (fr.top + fr.height / 2 - vh / 2) / vh;
      f.querySelector('img').style.transform = 'translate3d(0,' + (d * -6).toFixed(2) + '%,0) scale(1.12)';
    }
  }

  /* ---------- Ouvrir / fermer ---------- */
  /* ---------- Projets sans page écrite : on la compose avec leurs visuels ---------- */
  function resolve(x) {
    var title = typeof x === 'string' ? x : (x && x.title) || '';
    var key = title.trim().toLowerCase();
    if (key && CASES[key]) return CASES[key];
    var items = x && x.items ? x.items : (window.PROJECTS || []).filter(function (p) { return key && (p.title || '').trim().toLowerCase() === key; });
    return items.length ? auto(title.trim(), items) : null;
  }
  function svc(s) { var m = SV[String(s).toLowerCase()]; return m ? tr(m) : s; }
  function auto(title, items) {
    var sv = [], yr = '';
    items.forEach(function (p) { if (p.service && sv.indexOf(p.service) < 0) sv.push(p.service); if (!yr && p.year) yr = p.year; });
    var web = items.filter(function (p) { return /web|commerce/i.test(p.service || ''); });
    var rest = items.filter(function (p) { return web.indexOf(p) < 0; });
    var cover = rest[0] || items[0];
    var pics = rest; // la couverture revient aussi dans la galerie, à sa place
    var rows = [], wait = null;
    pics.forEach(function (p) {
      var im = { src: p.src, w: p.w || 1000, h: p.h || 1000 };
      if (im.w / im.h > 1.25) rows.push([im]);
      else if (wait) { rows.push([wait, im]); wait = null; } else wait = im;
    });
    if (wait) rows.push([wait]);
    var miss = { fr: [], en: [], es: [], it: [] };
    sv.forEach(function (s) { for (var l in miss) { var m = SV[s.toLowerCase()]; miss[l].push(m ? m[l] : s); } });
    var mObj = {}, iObj = {}, pObj = {};
    for (var l in miss) {
      pObj[l] = miss[l].concat(yr ? [yr] : []).join(' · ');
      mObj[l] = miss[l].join(', ');
      iObj[l] = miss[l].length ? miss[l].join(', ').replace(/^./, function (c) { return c.toUpperCase(); }) + '.' : '';
    }
    var name = title || T[lang()].untitled;
    var facts = [];
    if (title) facts.push(['client', title]);
    if (sv.length) facts.push(['missions', mObj]);
    if (yr) facts.push(['year', yr]);
    var blocks = [];
    if (web.length) blocks.push({ type: 'screens', label: 'web', bg: '#0d1414', name: name, items: web.map(function (p) { return { src: p.src, w: p.w, h: p.h }; }) });
    if (rows.length) blocks.push({ type: 'gallery', label: 'work', bg: '#f4f1ec', rows: rows });
    blocks.push({ type: 'palette', label: 'palette', textKey: 'paletteA', bg: '#ffffff', from: items.map(function (p) { return p.src; }) });
    return { web: !rest.length, title: name, cover: { src: cover.src, w: cover.w, h: cover.h }, place: pObj, intro: iObj, facts: facts, blocks: blocks };
  }
  // palette relevée dans les images : petit k-moyennes sur des vignettes
  function extract(srcs, done) {
    var px = [], left = srcs.length;
    srcs.forEach(function (src) {
      var im = new Image();
      im.onload = im.onerror = function () {
        try {
          var c = document.createElement('canvas'); c.width = c.height = 40;
          var x = c.getContext('2d'); x.drawImage(im, 0, 0, 40, 40);
          var d = x.getImageData(0, 0, 40, 40).data;
          for (var i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
        } catch (e) {}
        if (--left === 0) done(kmeans(px, 5));
      };
      im.src = src;
    });
  }
  function kmeans(px, k) {
    if (!px.length) return [];
    function dist(a, b) { var r = a[0] - b[0], g = a[1] - b[1], bl = a[2] - b[2]; return r * r + g * g + bl * bl; }
    var cs = [px[Math.floor(px.length / 2)].slice()];
    while (cs.length < k) { // le point le plus éloigné des centres déjà pris
      var best = null, bd = -1;
      for (var i = 0; i < px.length; i += 7) { var m = Infinity; for (var j = 0; j < cs.length; j++) m = Math.min(m, dist(px[i], cs[j])); if (m > bd) { bd = m; best = px[i]; } }
      cs.push(best.slice());
    }
    var cnt;
    for (var it = 0; it < 10; it++) {
      var sum = cs.map(function () { return [0, 0, 0]; }); cnt = cs.map(function () { return 0; });
      px.forEach(function (p) {
        var bi = 0, bv = Infinity;
        for (var j = 0; j < cs.length; j++) { var v = dist(p, cs[j]); if (v < bv) { bv = v; bi = j; } }
        sum[bi][0] += p[0]; sum[bi][1] += p[1]; sum[bi][2] += p[2]; cnt[bi]++;
      });
      cs = cs.map(function (c, j) { return cnt[j] ? [sum[j][0] / cnt[j], sum[j][1] / cnt[j], sum[j][2] / cnt[j]] : c; });
    }
    var out = cs.map(function (c, j) {
      var hex = '#' + c.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('').toUpperCase();
      return { hex: hex, share: cnt[j] / px.length };
    }).filter(function (c) { return c.share > 0.02; }).sort(function (a, b) { return b.share - a.share; });
    var tot = out.reduce(function (a, c) { return a + c.share; }, 0), acc = 0;
    out.forEach(function (c, i) {
      c.share = i === out.length - 1 ? 100 - acc : Math.max(1, Math.round(c.share / tot * 100));
      acc += c.share;
      c.name = 'Nº ' + (i < 9 ? '0' : '') + (i + 1);
    });
    return out;
  }

  function has(x) { return !!resolve(x); }
  function open(title, at) {
    data = resolve(title);
    if (!data) return false;
    render(data);
    sections = [].slice.call(inner.querySelectorAll('section, footer'));
    figs = [].slice.call(inner.querySelectorAll('.cm'));
    layoutRows();
    var box = inner.querySelector('.clogo__svg');
    logoParts = null;
    if (box) buildLogo(box);
    [].forEach.call(inner.querySelectorAll('.cm, .case__head, .cpal, .cintro, .cpal__bar'), function (n) { n.setAttribute('data-rev', ''); });
    revs = [].slice.call(inner.querySelectorAll('[data-rev]'));
    seals = [].slice.call(inner.querySelectorAll('.cseal__ring'));
    pal = inner.querySelector('.cpal');
    var autoPal = inner.querySelector('.cpal[data-auto]');
    if (autoPal) {
      var srcB = data.blocks.filter(function (b) { return b.type === 'palette'; })[0];
      var mine = data;
      extract(srcB.from, function (cols) {
        if (data !== mine || !cols.length) return;
        var tmp = document.createElement('div'); tmp.innerHTML = swatches(cols);
        autoPal.innerHTML = tmp.querySelector('.cpal').innerHTML;
        autoPal.nextElementSibling.innerHTML = tmp.querySelector('.cpal__bar').innerHTML;
      });
    }
    var fl = inner.querySelector('.cfleur');
    grow = fl ? { svg: fl, rect: fl.querySelector('.cfleur__grow'), h: +fl.viewBox.baseVal.height } : null;
    glyphAt = -1; glyphTouched = false;
    clearInterval(glyphAuto);
    if (inner.querySelector('.ctype')) {
      showGlyph(0);
      // tant qu'on ne touche rien, la loupe parcourt l'alphabet orné
      glyphAuto = setInterval(function () {
        if (glyphTouched || !running) return;
        var Gl = vec().glyphs, n = glyphAt + 1;
        if (!Gl.items[n] || Gl.items[n].row > 3) n = 0;
        showGlyph(n);
      }, 1400);
    }

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
      gsap.fromTo(inner.querySelector('.chero__img'), { scale: 1.25, filter: 'blur(10px)' }, { scale: 1, filter: 'blur(0px)', duration: 1.6, ease: 'expo.out', delay: 0.2, clearProps: 'transform,filter' });
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
      clearInterval(glyphAuto);
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
  // glyphes : survol ou toucher pour voir la lettre en grand
  function glyphFrom(e) { var g = e.target.closest && e.target.closest('.ctype__g'); return g ? +g.getAttribute('data-k') : -1; }
  root.addEventListener('pointerover', function (e) { var k = glyphFrom(e); if (k > -1 && e.pointerType === 'mouse') { glyphTouched = true; showGlyph(k); } });
  root.addEventListener('click', function (e) { var k = glyphFrom(e); if (k > -1) { glyphTouched = true; showGlyph(k); } });
  // palette : au toucher, la teinte s'ouvre
  root.addEventListener('click', function (e) {
    var sw = e.target.closest && e.target.closest('.cpal__sw');
    if (!sw || touch) return; // au doigt, c'est le défilement qui ouvre les teintes
    var on = sw.classList.contains('is-on');
    [].forEach.call(root.querySelectorAll('.cpal__sw.is-on'), function (s) { s.classList.remove('is-on'); });
    if (!on) sw.classList.add('is-on');
  });

  window.CASE = { has: has, open: open, close: close };
})();
