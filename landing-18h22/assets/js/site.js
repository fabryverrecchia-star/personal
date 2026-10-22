/* 18H22 : la suite du site, sous la montre.
   Défilement fluide (Lenis), manifeste qui s'allume au défilement, showreel,
   tunnel du temps (three.js), services en volets horizontaux, bandeau clients,
   contact magnétique, petite montre de progression. */
(function () {
  'use strict';

  // pour les curieux qui ouvrent la console
  try {
    console.log('%c18H22', 'font: 500 42px Helvetica, Arial, sans-serif; letter-spacing: -2px; color: #1e2042;');
    console.log('%cVous cherchez qui a fait ce site ? Un robot ? Une IA ?\nNon : des humains, du café, et une montre bloquée sur 18h22.\nOn recrute les curieux comme vous : contact@18h22.com', 'font: 13px Helvetica, Arial, sans-serif; color: #1e2042; line-height: 1.6;');
  } catch (e) {}

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var PROJECTS = window.PROJECTS || [];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  /* ------------------------------------------------------------------------
     Textes
     ------------------------------------------------------------------------ */
  var SERVICES = [
    { t: 'Design Strategy', i: ['Branding & Re-branding', 'Naming', 'Communication Strategy', 'Concept Development', 'Creative Direction'] },
    { t: 'Creative & Digital', i: ['Creative Direction', 'Identity Design', 'Digital & Print', 'Mobile, Web & App Development', 'UI/UX Design', 'Packaging & Retail Design', 'Copy Writing & Content Creation'] },
    { t: 'Social Media', i: ['Social Media Strategy', 'Content Map & Development', 'Community Management', 'Paid & Promotional Campaigns', 'Analysis & Reporting'] }
  ];
  // nos points forts, dans le bandeau qui défile
  var STRENGTHS = {
    fr: ['Logiciel de création dédié', 'Calendrier des services, actions et tournages', 'Développement et consolidation de l’image de marque', 'Positionnement'],
    en: ['Dedicated creative software', 'Calendar of services, actions and shoots', 'Brand image development and consolidation', 'Positioning'],
    es: ['Software de creación dedicado', 'Calendario de servicios, acciones y rodajes', 'Desarrollo y consolidación de la imagen de marca', 'Posicionamiento'],
    it: ['Software di creazione dedicato', 'Calendario di servizi, azioni e riprese', 'Sviluppo e consolidamento dell’immagine di marca', 'Posizionamento']
  };

  var COPY = {
    fr: {
      cue: 'Entrer',
      manifesto: '18h22 est l’heure où la lumière change. Studio de création, nous donnons aux marques une image juste, et le temps de la faire vivre.',
      reelLabel: 'Showreel', reelLine: 'Paris, 18h22.',
      workLabel: 'Projets', workTitle: 'Sélection', workHint: 'Défiler', workAll: 'Index', statProj: 'projets en 2026', statYears: 'années d’activité, depuis 2017', statBriefs: 'briefings créatifs', footSeo: 'Agence de création à Paris. Création de logo, identité visuelle, sites web et applications, packaging, réseaux sociaux. Paris et toute la France.',
      servicesLabel: 'Services',
      endTitle: 'Un projet ?', endCta: 'Écrivez-nous', copied: 'Adresse copiée',
      need: 'Objet', needOther: 'Autre',
      vClose: 'Fermer', vPrev: 'Précédent', vNext: 'Suivant',
      cur: { play: 'Lecture', view: 'Index', go: 'Écrire', copy: 'Copier' }
    },
    en: {
      cue: 'Enter',
      manifesto: '18:22 is the hour the light changes. As a creative studio, we give brands the right image, and the time to make it live.',
      reelLabel: 'Showreel', reelLine: 'Paris, 18:22.',
      workLabel: 'Work', workTitle: 'Selection', workHint: 'Scroll', workAll: 'Index', statProj: 'projects in 2026', statYears: 'years in practice, since 2017', statBriefs: 'creative briefs', footSeo: 'Creative agency in Paris. Logo design, visual identity, websites and apps, packaging, social media. Paris and all of France.',
      servicesLabel: 'Services',
      endTitle: 'A project?', endCta: 'Write to us', copied: 'Address copied',
      need: 'Subject', needOther: 'Other',
      vClose: 'Close', vPrev: 'Previous', vNext: 'Next',
      cur: { play: 'Play', view: 'Index', go: 'Write', copy: 'Copy' }
    },
    es: {
      cue: 'Entrar',
      manifesto: 'Las 18:22 son la hora en que cambia la luz. Como estudio creativo, damos a las marcas la imagen justa, y el tiempo para hacerla vivir.',
      reelLabel: 'Showreel', reelLine: 'París, 18:22.',
      workLabel: 'Proyectos', workTitle: 'Selección', workHint: 'Desplazar', workAll: 'Índice', statProj: 'proyectos en 2026', statYears: 'años de actividad, desde 2017', statBriefs: 'briefings creativos', footSeo: 'Agencia creativa en París. Diseño de logotipos, identidad visual, sitios web y apps, packaging, redes sociales. París y toda Francia.',
      servicesLabel: 'Servicios',
      endTitle: '¿Un proyecto?', endCta: 'Escríbenos', copied: 'Dirección copiada',
      need: 'Asunto', needOther: 'Otro',
      vClose: 'Cerrar', vPrev: 'Anterior', vNext: 'Siguiente',
      cur: { play: 'Ver', view: 'Índice', go: 'Escribir', copy: 'Copiar' }
    },
    it: {
      cue: 'Entra',
      manifesto: 'Le 18:22 sono l’ora in cui la luce cambia. Come studio creativo, diamo ai marchi l’immagine giusta, e il tempo per farla vivere.',
      reelLabel: 'Showreel', reelLine: 'Parigi, 18:22.',
      workLabel: 'Progetti', workTitle: 'Selezione', workHint: 'Scorri', workAll: 'Indice', statProj: 'progetti nel 2026', statYears: 'anni di attività, dal 2017', statBriefs: 'brief creativi', footSeo: 'Agenzia creativa a Parigi. Logo, identità visiva, siti web e app, packaging, social media. Parigi e tutta la Francia.',
      servicesLabel: 'Servizi',
      endTitle: 'Un progetto?', endCta: 'Scriveteci', copied: 'Indirizzo copiato',
      need: 'Oggetto', needOther: 'Altro',
      vClose: 'Chiudi', vPrev: 'Precedente', vNext: 'Successivo',
      cur: { play: 'Play', view: 'Indice', go: 'Scrivi', copy: 'Copia' }
    }
  };
  var MAIL = 'contact@18h22.com';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* Lettres qui basculent en 3D à l'entrée */
  function splitChars(el, text) {
    el.innerHTML = text.split(' ').map(function (w) {
      return '<span class="wd">' + Array.prototype.map.call(w, function (ch) {
        return '<span class="ch"><span>' + esc(ch) + '</span></span>';
      }).join('') + '</span>';
    }).join(' ');
  }
  function revealChars(el, delay) {
    if (!window.gsap || reduce) return;
    gsap.fromTo($$('.ch > span', el), { yPercent: 110, rotateX: -80 }, {
      yPercent: 0, rotateX: 0, duration: 1.3, ease: 'expo.out', stagger: 0.022, delay: delay || 0
    });
  }

  var current = 'fr';
  function render(l) {
    var c = COPY[l] || COPY.fr;
    current = l;
    $$('[data-s]').forEach(function (el) {
      var v = c[el.dataset.s];
      if (v != null) el.textContent = v;
    });
    $$('#contact [data-i18n]').forEach(function (el) {
      var v = c[el.dataset.i18n];
      if (v != null) el.textContent = v;
    });
    // manifeste, mot à mot
    $('#manifesto').innerHTML = c.manifesto.split(' ').map(function (w) { return '<span>' + esc(w) + '</span>'; }).join(' ');
    manifestoWords = $$('#manifesto span');
    splitChars($('#endTitle'), c.endTitle);
    endShown = false;
  }

  /* ------------------------------------------------------------------------
     Défilement fluide
     ------------------------------------------------------------------------ */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    // pas de défilement pendant l'intro, l'index ou le contact
    var syncLock = function () {
      var locked = document.body.classList.contains('is-intro') || document.body.classList.contains('is-locked');
      if (locked) lenis.stop(); else lenis.start();
    };
    new MutationObserver(syncLock).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    syncLock();
  }
  function scrollToEl(el, offset) {
    var y = el === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY + (offset || 0);
    if (lenis) lenis.scrollTo(y, { duration: 1.8, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-contact]');
    if (b && window.APP) { e.preventDefault(); window.APP.openContact(b.dataset.contact || ''); return; }
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var h = a.getAttribute('href');
    if (h === '#top') { e.preventDefault(); scrollToEl(0); return; }
    var t = h.length > 1 && document.getElementById(h.slice(1));
    if (t) { e.preventDefault(); scrollToEl(t); }
  });
  $('#workAll').addEventListener('click', function () { if (window.APP) window.APP.openGallery(); });

  /* ------------------------------------------------------------------------
     Curseur : le même œil partout ; boutons magnétiques
     ------------------------------------------------------------------------ */
  var cursor = $('#cursor'), cursorLabel = $('#cursorLabel');
  if (fine) {
    var mags = [];
    var collectMags = function () { mags = $$('[data-magnetic]').map(function (el) { return { el: el, x: 0, y: 0 }; }); };
    collectMags();
    var mp = { x: -1e4, y: -1e4 };
    window.addEventListener('pointermove', function (e) { mp.x = e.clientX; mp.y = e.clientY; }, { passive: true });
    (function magLoop() {
      mags.forEach(function (m) {
        var r = m.el.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = mp.x - cx, dy = mp.y - cy;
        var d = Math.hypot(dx, dy), R = Math.max(90, r.width * 0.9);
        var tx = d < R ? dx * 0.32 : 0, ty = d < R ? dy * 0.32 : 0;
        m.x += (tx - m.x) * 0.15; m.y += (ty - m.y) * 0.15;
        m.el.style.transform = 'translate3d(' + m.x.toFixed(2) + 'px,' + m.y.toFixed(2) + 'px,0)';
      });
      requestAnimationFrame(magLoop);
    })();
  }

  /* ------------------------------------------------------------------------
     Défilement : la montre recule, le manifeste s'allume, la petite montre tourne
     ------------------------------------------------------------------------ */
  var hero = $('#hero'), top = $('#top'), tick = $('#tick');
  var manifesto = $('#agence'), manifestoWords = [];
  var H = window.innerHeight;
  window.addEventListener('resize', function () { H = window.innerHeight; });

  function sectionProgress(sec) {
    var r = sec.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1);
  }

  /* ------------------------------------------------------------------------
     Matière : un liquide teal sur papier crème, avec un cœur orange.
     Le défilement le fait tourner et se transformer ; la nuit l'éteint en indigo.
     ------------------------------------------------------------------------ */
  var mist = $('#mist');
  // encre claire sur fond sombre et l'inverse : le corps passe en nuit avec la vague,
  // le haut de page et la petite montre suivent aussi le showreel plein écran
  var reelCover = false, toneState = '';
  function tone() {
    var n = flowState.nightS > 0.5;
    var key = (n ? 'n' : 'd') + (reelCover ? 'r' : '');
    if (key === toneState) return;
    toneState = key;
    document.body.classList.toggle('is-night', n);
    var dark = n || reelCover;
    $('#top').classList.toggle('on-dark', dark);
    $('#tick').classList.toggle('on-dark', dark);
  }
  var flowOn = false;
  var flowState = { night: 0, nightS: 0, time: 0, cover: 0.2, sc: 0, mx: 0.22, my: -0.06 };
  (function flow() {
    var cv = $('#flow'), gl = null;
    try { gl = cv.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false }); } catch (e) { gl = null; }
    if (!gl) return;
    var vs = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';
    var fs = [
      'precision highp float;',
      'uniform vec2 uRes; uniform float uTime, uScroll, uNight, uCover; uniform vec2 uCore;',
      'float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }',
      'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);',
      '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }',
      'float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);',
      '  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; } return v; }',
      'void main(){',
      '  vec2 uv = gl_FragCoord.xy / uRes; float asp = uRes.x / uRes.y;',
      '  vec2 p = (uv - 0.5) * vec2(asp, 1.0);',
      '  float t = uTime * 0.035 + uScroll * 0.9;',
      // la nuit arrive comme une vague : un front liquide qui balaie l'écran
      '  float nm = fbm(p * 1.6 + vec2(0.0, uTime * 0.05));',
      '  float kk = uNight * 1.5 - 0.25;',
      '  float N = smoothstep(nm - 0.05, nm + 0.05, kk);',
      '  float rim = exp(-pow((kk - nm) / 0.018, 2.0)) * step(0.001, uNight) * step(uNight, 0.999);',
      '  float ang = -0.55 + uScroll * 0.7;',
      '  mat2 R = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));',
      '  vec2 q0 = R * p; q0.x *= 0.42;',
      // double déformation : la matière coule et se replie
      '  vec2 q = vec2(fbm(q0 * 1.7 + vec2(0.0, t)), fbm(q0 * 1.7 + vec2(5.2, 1.3) - t));',
      '  vec2 r = vec2(fbm(q0 * 1.7 + 3.0 * q + vec2(1.7, 9.2) + t * 0.7), fbm(q0 * 1.7 + 3.0 * q + vec2(8.3, 2.8) - t * 0.5));',
      '  float f = fbm(q0 * 1.4 + 3.2 * r);',
      // un front de liquide venu d'un bord, frangé comme un tissu balayé
      '  vec2 dir = normalize(vec2(-0.55 + sin(uScroll * 0.8) * 0.5, -1.0));',
      '  float brush = noise((R * p) * vec2(2.0, 46.0) + r * 3.0);',
      '  float s = dot(p, dir) * 0.95 + (f - 0.5) * 1.35 + (brush - 0.5) * 0.07;',
      '  float th = 0.62 - uCover - 0.22 * N;',
      '  float L = smoothstep(th, th + 0.32, s);',
      '  float D = smoothstep(th + 0.2, th + 0.8, s);',
      '  vec3 cream = mix(vec3(0.957, 0.925, 0.851), vec3(0.020, 0.047, 0.047), N);',
      '  vec3 tealL = mix(vec3(0.52, 0.74, 0.79), vec3(0.10, 0.34, 0.46), N);',
      '  vec3 teal = mix(vec3(0.10, 0.42, 0.53), vec3(0.04, 0.18, 0.25), N);',
      '  vec3 deep = vec3(0.02, 0.06, 0.09);',
      '  vec3 col = mix(cream, tealL, L);',
      '  col = mix(col, teal, smoothstep(0.1, 0.65, D));',
      '  col = mix(col, deep, smoothstep(0.62, 1.0, D) * 0.92);',
      // reflets d'eau sur la matière
      '  float c = pow(1.0 - abs(fract(f * 5.0 + r.x * 2.0 - t * 2.0) - 0.5) * 2.0, 14.0);',
      '  col = mix(col, vec3(0.98, 0.95, 0.88), c * L * (1.0 - D * 0.6) * 0.55 * (1.0 - 0.55 * N));',
      // le cœur orange, filamenteux, qui suit le curseur
      '  vec2 dc = (p - uCore) * vec2(1.0, 0.8);',
      '  float fil = smoothstep(0.42, 0.72, fbm(p * 11.0 + r * 3.0 + t));',
      '  float g = exp(-dot(dc, dc) * 70.0) * (0.35 + 1.1 * fil) + exp(-dot(dc, dc) * 14.0) * 0.12;',
      '  col = mix(col, vec3(1.0, 0.36, 0.10), clamp(g, 0.0, 1.0) * (0.55 + 0.35 * N));',
      // le bord de la vague brûle un instant, orange
      '  col = mix(col, vec3(1.0, 0.42, 0.14), clamp(rim, 0.0, 1.0) * 0.85);',
      // lumière qui retombe, un léger halo vers le haut
      '  col += (1.0 - N) * 0.03 * smoothstep(0.2, -0.6, p.y);',
      '  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');
    function sh(type, src) { var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; }
    var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var al = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ['uRes', 'uTime', 'uScroll', 'uNight', 'uCover', 'uCore'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    document.documentElement.classList.add('has-flow');
    flowOn = true;

    // basse définition : la matière est floue par nature, le GPU respire
    var q = window.innerWidth < 700 ? 0.4 : 0.5;
    function size() {
      var k = q;
      cv.width = Math.max(2, Math.round(window.innerWidth * k));
      cv.height = Math.max(2, Math.round(window.innerHeight * k));
      gl.viewport(0, 0, cv.width, cv.height);
    }
    size(); window.addEventListener('resize', size);

    var tgt = { x: 0.22, y: -0.06 }, sm = { sc: 0, night: 0, cover: 0.2 };
    if (fine) window.addEventListener('pointermove', function (e) {
      var a = window.innerWidth / window.innerHeight;
      tgt.x = (e.clientX / window.innerWidth - 0.5) * a; tgt.y = 0.5 - e.clientY / window.innerHeight;
    }, { passive: true });
    var t0 = performance.now();
    var covered = function () {
      return ['#viewer', '#theatre', '#gallery'].some(function (id) { var el = $(id); return el && el.classList.contains('is-open'); });
    };
    var last = t0, slow = 0, skip = 0, mob = !fine;
    (function loop(now) {
      requestAnimationFrame(loop);
      if (document.hidden || covered()) return;
      // sur téléphone, une image sur deux suffit à la matière
      if (mob && (skip = 1 - skip)) return;
      // si l'appareil peine, on baisse la définition (la matière est floue de toute façon)
      var dt = now - last; last = now;
      slow = dt > (mob ? 45 : 24) ? slow + 1 : Math.max(0, slow - 1);
      if (slow > 40 && q > 0.26) { q *= 0.8; slow = 0; size(); }
      sm.sc += (flowState.sc - sm.sc) * 0.06;
      sm.night += (flowState.night - sm.night) * 0.08;
      flowState.nightS = sm.night;
      tone();
      flowState.time = reduce ? 0 : (now - t0) / 1000;
      sm.cover += (flowState.cover - sm.cover) * 0.05;
      flowState.mx += (tgt.x - flowState.mx) * 0.035;
      flowState.my += (tgt.y - flowState.my) * 0.035;
      // sur mobile, le cœur dérive seul
      if (!fine) { var tt = (now - t0) * 0.0002; tgt.x = Math.sin(tt) * 0.12 + 0.05; tgt.y = Math.cos(tt * 1.3) * 0.12 - 0.05; }
      gl.uniform2f(U.uRes, cv.width, cv.height);
      gl.uniform1f(U.uTime, reduce ? 0 : (now - t0) / 1000);
      gl.uniform1f(U.uScroll, sm.sc);
      gl.uniform1f(U.uNight, sm.night);
      gl.uniform1f(U.uCover, sm.cover);
      gl.uniform2f(U.uCore, flowState.mx, flowState.my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    })(t0);
  })();

  var YEARS = Math.max(1, new Date().getFullYear() - 2017);
  var figs = $$('.fig').map(function (el) {
    var n = el.querySelector('.fig__n');
    var to = n.dataset.to === 'years' ? YEARS : +n.dataset.to;
    return { el: el, n: n, to: to, pre: n.dataset.pre, post: n.dataset.post, k: -1 };
  });
  var endShown = false, night = 0;
  function onScroll() {
    var y = window.scrollY;
    var p = Math.min(1, y / H);
    hero.style.opacity = (1 - p * 0.85).toFixed(3);
    hero.style.transform = p > 0 ? 'scale(' + (1 - p * 0.08).toFixed(4) + ')' : '';
    hero.style.visibility = p >= 1 ? 'hidden' : '';
    top.classList.toggle('is-solid', y > H * 0.92);

    // manifeste : chaque mot s'allume quand on le dépasse
    var mp = sectionProgress(manifesto);
    var n = manifestoWords.length;
    manifestoWords.forEach(function (w, i) {
      var k = clamp(mp * 1.25 * n - i, 0, 1);
      w.style.opacity = (0.16 + 0.84 * k).toFixed(3);
    });

    // petite montre : 9h00 en haut de page, 18h22 tout en bas
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var m = 9 * 60 + (18 * 60 + 22 - 9 * 60) * clamp(y / max, 0, 1);
    $('#tickH').setAttribute('transform', 'rotate(' + (m * 0.5).toFixed(1) + ')');
    $('#tickM').setAttribute('transform', 'rotate(' + (m * 6).toFixed(1) + ')');
    $('#tickTime').textContent = pad(Math.floor(m / 60)) + ':' + pad(Math.floor(m % 60));
    tick.classList.toggle('is-on', y > H * 0.9 && y < max - 140 && !document.body.classList.contains('is-locked'));

    // brume : le teal et l'ambre montent quand arrivent les services
    var sr = $('#services').getBoundingClientRect().top;
    mist.style.setProperty('--dusk', clamp((H * 0.75 - sr) / (H * 0.9), 0, 1).toFixed(3));

    // côté nuit : le tunnel du temps passe en sombre, entrée et sortie en fondu
    var tr = $('#selection').getBoundingClientRect(), fr = $('#chiffres').getBoundingClientRect();
    night = Math.min(clamp((H * 0.9 - tr.top) / (H * 0.7), 0, 1), clamp((fr.bottom - H * 0.15) / (H * 0.7), 0, 1));

    // chiffres clés : chaque ligne monte depuis le bas et compte, l'une après l'autre
    var fp = sectionProgress($('#chiffres'));
    figs.forEach(function (f, i) {
      var k = clamp((fp - i * 0.2) / 0.28, 0, 1);
      k = 1 - Math.pow(1 - k, 3);
      if (Math.abs(k - f.k) < 0.001) return;
      f.k = k;
      f.el.style.setProperty('--k', k.toFixed(3));
      var v = Math.round(f.to * k);
      if (f.to >= 100) v = Math.round(v / 10) * 10;
      f.n.textContent = (f.pre || '') + v + (k >= 1 ? (f.post || '') : '');
    });
    mist.style.setProperty('--night', night.toFixed(3));
    var maxY = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    flowState.sc = y / H * 0.35;
    flowState.night = night;
    flowState.cover = (window.innerWidth < 700 ? 0.26 : 0.18) + 0.2 * clamp(y / maxY, 0, 1);
    if (!flowOn) { flowState.nightS = night; tone(); }

    // titre final
    var et = $('#endTitle').getBoundingClientRect().top;
    if (!endShown && et < H * 0.85) { endShown = true; revealChars($('#endTitle')); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------------------------------
     Services : volets horizontaux pilotés par le défilement vertical
     ------------------------------------------------------------------------ */
  var hs = $('#services'), track = $('#hsTrack'), bar = $('#hsBar');
  track.innerHTML = SERVICES.map(function (s, k) {
    // chaque service a sa propre image
    var own = ['assets/services/strategy.webp', 'assets/services/branding.webp', 'assets/services/social.webp'][k];
    var img = own ? { src: own } : PROJECTS.filter(function (pj) { return (pj.file || pj.src).indexOf('/p08.') > -1; })[0] ||
      (PROJECTS.length ? PROJECTS[(k * 6 + 3) % PROJECTS.length] : null);
    return '<article class="panel">' +
      '<h3 class="panel__t">' + esc(s.t) + '</h3>' +
      '<ul class="panel__list">' + s.i.map(function (x) { return '<li><span>' + esc(x) + '</span></li>'; }).join('') + '</ul>' +
      (img ? '<figure class="panel__img"><img src="' + img.src + '" alt="" loading="lazy" decoding="async"></figure>' : '') +
      '<button class="link panel__cta" type="button" data-contact="' + ['strategy', 'creative', 'social'][k] + '" data-magnetic><span data-s="endCta"></span></button>' +
      '</article>';
  }).join('');
  var panels = $$('.panel', track);
  var panelSeen = panels.map(function () { return false; });
  var hsX = 0;
  function hsFrame() {
    requestAnimationFrame(hsFrame);
    var r = hs.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) return;
    var p = sectionProgress(hs);
    var dist = track.scrollWidth - window.innerWidth;
    var target = -dist * clamp((p - 0.08) / 0.84, 0, 1);
    hsX += (target - hsX) * (lenis ? 1 : 0.2);
    var skew = clamp((target - hsX) * 0.01, -4, 4);
    track.style.transform = 'translate3d(' + hsX.toFixed(1) + 'px,0,0) skewX(' + skew.toFixed(2) + 'deg)';
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    panels.forEach(function (pn, k) {
      var pr = pn.getBoundingClientRect();
      var vis = clamp(1 - (pr.left - window.innerWidth * 0.15) / (window.innerWidth * 0.75), 0, 1);
      var img = pn.querySelector('.panel__img img');
      if (img) img.style.transform = 'translate3d(' + ((pr.left / window.innerWidth) * -12).toFixed(2) + '%,0,0) scale(1.25)';
      var fig = pn.querySelector('.panel__img');
      if (fig) fig.style.clipPath = 'inset(' + ((1 - vis) * 100).toFixed(1) + '% 0 0 0)';
      if (!panelSeen[k] && pr.left < window.innerWidth * 0.7) {
        panelSeen[k] = true;
        if (window.gsap && !reduce) {
          revealChars(pn.querySelector('.panel__t'));
          gsap.fromTo($$('.panel__list li span', pn), { yPercent: 105 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.05, delay: 0.25 });
        }
      }
    });
  }
  function renderPanels() {
    panels.forEach(function (pn) {
      var t = pn.querySelector('.panel__t');
      splitChars(t, t.textContent);
      if (!panelSeen[panels.indexOf(pn)] && window.gsap && !reduce) {
        gsap.set($$('.ch > span', t), { yPercent: 110 });
        gsap.set($$('.panel__list li span', pn), { yPercent: 105 });
      }
    });
  }
  renderPanels();
  hsFrame();

  /* ------------------------------------------------------------------------
     Bandeau clients : défile en continu, accélère et penche avec le défilement
     ------------------------------------------------------------------------ */
  var marquee = $('#marquee');
  function renderStrengths(l) {
    var row = (STRENGTHS[l] || STRENGTHS.fr).map(function (n) { return '<span>' + esc(n) + '</span><i></i>'; }).join('');
    marquee.innerHTML = '<div>' + row + '</div><div aria-hidden="true">' + row + '</div>';
  }
  renderStrengths(current);
  var mq = { x: 0, v: 0, lastY: window.scrollY };
  (function mqLoop() {
    var y = window.scrollY;
    var dy = y - mq.lastY; mq.lastY = y;
    mq.v += (dy * 0.6 - mq.v) * 0.1;
    var speed = 0.6 + Math.abs(mq.v) * 0.5;
    mq.x -= speed * (mq.v < -0.5 ? -1 : 1);
    var w = marquee.firstChild.offsetWidth || 1;
    if (mq.x <= -w) mq.x += w;
    if (mq.x > 0) mq.x -= w;
    marquee.style.transform = 'translate3d(' + mq.x.toFixed(1) + 'px,0,0) skewX(' + clamp(-mq.v * 0.4, -10, 10).toFixed(2) + 'deg)';
    requestAnimationFrame(mqLoop);
  })();

  /* ------------------------------------------------------------------------
     Contact : copier l'adresse
     ------------------------------------------------------------------------ */
  $('#mailText').textContent = MAIL;
  $('#mailCopy').addEventListener('click', function () {
    var done = function () {
      var el = $('#mailText');
      el.textContent = COPY[current].copied;
      setTimeout(function () { el.textContent = MAIL; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(MAIL).then(done, function () { location.href = 'mailto:' + MAIL; });
    else location.href = 'mailto:' + MAIL;
  });

  /* ------------------------------------------------------------------------
     Tunnel du temps (three.js) : on avance dans l'axe, les projets défilent
     en spirale, un cadran à chaque étape, les aiguilles avancent vers 18h22
     ------------------------------------------------------------------------ */
  // three.js ne se charge qu'à l'approche du tunnel : la page s'ouvre plus vite
  function tunnel() {
    if (window.THREE) return tunnelInit();
    var sec = $('#selection'), started = false;
    var go = function () {
      if (started) return; started = true;
      var sc = document.createElement('script');
      sc.src = 'assets/vendor/three.min.js';
      sc.onload = tunnelInit;
      sc.onerror = tunnelInit;
      document.head.appendChild(sc);
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); go(); } }, { rootMargin: '250% 0px' });
      io.observe(sec);
    } else go();
  }
  function tunnelInit() {
    var section = $('#selection');
    var canvas = $('#tunnelGl');
    var ptitle = $('#ptitle');
    var ok = false;
    try {
      ok = !!window.THREE && !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch (e) { ok = false; }
    if (!ok || !PROJECTS.length) {
      document.documentElement.classList.add('no-tunnel');
      $('#tunnelFallback').innerHTML = PROJECTS.map(function (p) {
        return '<figure><img src="' + p.src + '" alt="" loading="lazy"><figcaption>' + esc(p.title || '') + '</figcaption></figure>';
      }).join('');
      return;
    }
    var T = window.THREE;
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(55, 1, 0.05, 120);
    var mobile = false;
    var GAP = 5.2;
    var N = PROJECTS.length;
    var LEN = (N + 1) * GAP;

    var vert = [
      'uniform float uVel;',
      'uniform float uTime;',
      'uniform float uPress;',
      'uniform vec2 uHit;',
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = uv;',
      '  vec3 p = position;',
      '  float bend = sin(uv.x * 3.14159) * sin(uv.y * 3.14159);',
      '  p.z += bend * uVel * 1.1;',
      // au clic, une onde part du point touché et la photo vient vers nous
      '  float hd = distance(uv, uHit);',
      '  p.z += sin(hd * 26.0 - uPress * 16.0) * exp(-hd * 3.5) * 0.18 * sin(uPress * 3.14159) + uPress * 0.6;',
      '  p.x += sin(uv.y * 6.0 + uTime) * uVel * 0.12;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
      '}'
    ].join('\n');
    var frag = [
      'uniform sampler2D uTex;',
      'uniform float uVel;',
      'uniform float uAlpha;',
      'uniform float uReady;',
      'uniform float uFog;',
      'uniform vec3 uMist;',
      'uniform vec2 uRes;',
      'uniform float uNight, uClock, uPress;',
      'uniform vec2 uHit;',
      'varying vec2 vUv;',
      'float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }',
      'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);',
      '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }',
      'float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);',
      '  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; } return v; }',
      'void main() {',
      '  vec2 uv = vUv;',
      // le même front liquide que le fond : il déforme les photos en passant
      '  vec2 sp = (gl_FragCoord.xy / uRes - 0.5) * vec2(uRes.x / uRes.y, 1.0);',
      '  float nm = fbm(sp * 1.6 + vec2(0.0, uClock * 0.05));',
      '  float kk = uNight * 1.5 - 0.25;',
      '  float N = smoothstep(nm - 0.05, nm + 0.05, kk);',
      '  float edge = exp(-pow((kk - nm) / 0.07, 2.0)) * step(0.001, uNight) * step(uNight, 0.999);',
      '  uv += (vec2(noise(sp * 9.0 + uClock), noise(sp * 9.0 - uClock + 4.0)) - 0.5) * 0.16 * edge;',
      '  vec2 hv = uv - uHit; float hl = length(hv);',
      '  uv += hv / max(hl, 0.001) * sin(hl * 40.0 - uPress * 22.0) * 0.012 * sin(uPress * 3.14159) * exp(-hl * 3.0);',
      '  float s = clamp(abs(uVel), 0.0, 1.0) * 0.012;',
      '  vec4 c = texture2D(uTex, uv);',
      '  float r = texture2D(uTex, uv + vec2(s, 0.0)).r;',
      '  float b = texture2D(uTex, uv - vec2(s, 0.0)).b;',
      '  vec3 col = vec3(r, c.g, b);',
      // les images sortent de la brume : voilées au loin, nettes de près
      '  col = mix(uMist, col, uFog);',
      // derrière la vague, la photo passe dans la nuit : ombres noir vert, lumières bleu pétrole
      '  float lum = dot(col, vec3(0.299, 0.587, 0.114));',
      '  vec3 nightTone = mix(vec3(0.02, 0.05, 0.05), vec3(0.62, 0.80, 0.86), smoothstep(0.05, 0.95, lum));',
      '  col = mix(col, mix(nightTone, col, 0.3), N * 0.8);',
      '  col = mix(col, vec3(1.0, 0.42, 0.14), clamp(exp(-pow((kk - nm) / 0.018, 2.0)) * step(0.001, uNight) * step(uNight, 0.999), 0.0, 1.0) * 0.8);',
      '  gl_FragColor = vec4(col, uAlpha * uReady);',
      '}'
    ].join('\n');

    // brume claire le jour, nuit indigo dans le tunnel
    var dayMist = new T.Color(0xf2ead8), nightMist = new T.Color(0x050c0c), mistCol = new T.Color(0xf2ead8);
    var dayInk = new T.Color(0x1e2042), nightInk = new T.Color(0xdfe7ea);
    var resV = new T.Vector2(1, 1);
    var loader = new T.TextureLoader();
    var geo = new T.PlaneGeometry(1, 1, 24, 24);
    var planes = PROJECTS.map(function (p, i) {
      var mat = new T.ShaderMaterial({
        vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false,
        uniforms: { uTex: { value: null }, uVel: { value: 0 }, uTime: { value: 0 }, uAlpha: { value: 0 }, uReady: { value: 0 }, uFog: { value: 1 }, uMist: { value: mistCol }, uRes: { value: resV }, uNight: { value: 0 }, uClock: { value: 0 }, uPress: { value: 0 }, uHit: { value: new T.Vector2(0.5, 0.5) } }
      });
      var m = new T.Mesh(geo, mat);
      m.userData = { i: i, ang: i * 2.39996 + 0.6, ar: (p.w && p.h) ? p.w / p.h : 1.3, ready: 0 };
      loader.load(p.src, function (tex) {
        tex.minFilter = T.LinearFilter;
        tex.generateMipmaps = false;
        mat.uniforms.uTex.value = tex;
        m.userData.loaded = true;
      });
      scene.add(m);
      return m;
    });

    // un cadran entre deux projets : anneau, graduations et deux aiguilles
    var ink = new T.Color(0x1e2042);
    var lineMats = [];
    var rings = [];
    for (var i = 0; i <= N; i++) {
      var g = new T.Group();
      var pts = [];
      for (var a = 0; a <= 128; a++) pts.push(new T.Vector3(Math.cos(a / 128 * Math.PI * 2), Math.sin(a / 128 * Math.PI * 2), 0));
      var lineMat = new T.LineBasicMaterial({ color: ink, transparent: true, opacity: 0, depthWrite: false });
      g.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), lineMat));
      var tp = [];
      for (var t = 0; t < 60; t++) {
        var an = t / 60 * Math.PI * 2, r0 = t % 5 ? 0.965 : 0.92;
        tp.push(new T.Vector3(Math.sin(an), Math.cos(an), 0), new T.Vector3(Math.sin(an) * r0, Math.cos(an) * r0, 0));
      }
      g.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(tp), lineMat));
      // l'heure de ce cadran : de 9h00 au premier à 18h22 au dernier
      var mins = 9 * 60 + (18 * 60 + 22 - 9 * 60) * (i / N);
      var hand = function (len, deg) {
        var r = -deg * Math.PI / 180;
        return new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(-Math.sin(r) * len, Math.cos(r) * len, 0)]), lineMat);
      };
      g.add(hand(0.5, mins * 0.5));
      g.add(hand(0.8, mins * 6));
      g.position.z = -(i + 0.5) * GAP;
      g.userData = { mat: lineMat };
      lineMats.push(lineMat);
      scene.add(g);
      rings.push(g);
    }

    function layout() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      mobile = w < 700;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 1.75));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = mobile ? 68 : 52;
      camera.updateProjectionMatrix();
      var spreadX = mobile ? 0.55 : 1.55, spreadY = mobile ? 0.9 : 0.75, size = mobile ? 1.15 : 1.5;
      planes.forEach(function (m) {
        var u = m.userData;
        var hh = size * (u.ar < 1 ? 1.15 : 1);
        m.scale.set(hh * u.ar, hh, 1);
        m.position.set(Math.cos(u.ang) * spreadX, Math.sin(u.ang) * spreadY, -(u.i + 1) * GAP);
      });
      var rs = mobile ? 1.9 : 2.6;
      rings.forEach(function (g) { g.scale.set(rs, rs, 1); });
    }
    layout();
    window.addEventListener('resize', layout);

    var inView = false;
    new IntersectionObserver(function (e) { inView = e[0].isIntersecting; }, { rootMargin: '10% 0px' }).observe(section);

    var mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    window.addEventListener('pointermove', function (e) {
      mouse.x = e.clientX / window.innerWidth * 2 - 1;
      mouse.y = e.clientY / window.innerHeight * 2 - 1;
    }, { passive: true });
    // sur téléphone, l'inclinaison oriente la caméra
    window.addEventListener('deviceorientation', function (e) {
      if (e.gamma == null || e.beta == null || fine) return;
      mouse.x = clamp(e.gamma / 30, -1, 1);
      mouse.y = clamp((e.beta - 50) / 30, -1, 1);
    });

    var prog = 0, smooth = 0, vel = 0, lastTitle = -1;
    var head = $('.tunnel__head'), hint = $('.tunnel__hint');
    // le titre du projet qui arrive monte depuis le bas ; le précédent part par le haut
    var curTitle = null;
    function swapTitle(p) {
      var old = curTitle;
      curTitle = null;
      if (old) {
        if (window.gsap) gsap.to(old.querySelectorAll('.ptitle__mask > span'), { yPercent: -110, duration: 0.55, ease: 'expo.in', stagger: 0.04, onComplete: function () { old.remove(); } });
        else old.remove();
      }
      if (!p || !p.title) return;
      var meta = [p.service, p.year].filter(Boolean).join(' · ');
      var el = document.createElement('div');
      el.className = 'ptitle__item';
      el.innerHTML = '<h3 class="ptitle__t"><span class="ptitle__mask"><span>' + esc(p.title) + '</span></span></h3>' +
        (meta ? '<p class="ptitle__m"><span class="ptitle__mask"><span>' + esc(meta) + '</span></span></p>' : '');
      ptitle.appendChild(el);
      curTitle = el;
      var lines = el.querySelectorAll('.ptitle__mask > span');
      if (window.gsap) gsap.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, delay: old ? 0.3 : 0 });
      
    }

    function progress() {
      var r = section.getBoundingClientRect();
      var span = r.height - window.innerHeight;
      return Math.max(0, Math.min(1, -r.top / Math.max(1, span)));
    }

    function frame(t) {
      requestAnimationFrame(frame);
      if (!inView) return;
      prog = progress();
      var prev = smooth;
      smooth += (prog - smooth) * 0.085;
      vel += ((smooth - prev) * 60 - vel) * 0.15;
      mouse.sx += (mouse.x - mouse.sx) * 0.05;
      mouse.sy += (mouse.y - mouse.sy) * 0.05;

      var camZ = 3.2 - smooth * (LEN - 1.2);
      camera.position.set(mouse.sx * 0.35, -mouse.sy * 0.25, camZ);
      camera.lookAt(mouse.sx * 0.8, -mouse.sy * 0.5, camZ - 6);
      camera.rotation.z = smooth * 0.9 + vel * 0.06;

      var nS = flowState.nightS;
      mistCol.copy(dayMist).lerp(nightMist, nS);
      ink.copy(dayInk).lerp(nightInk, nS);
      renderer.getDrawingBufferSize(resV);
      var time = t * 0.001, nearest = -1, best = 1e9;
      planes.forEach(function (m) {
        var d = camZ - m.position.z; // distance devant la caméra
        var u = m.material.uniforms;
        var fadeIn = 1 - Math.min(1, Math.max(0, (d - GAP * 1.2) / (GAP * 3.2)));
        var near = mobile ? 2.1 : 1.0;
        var fadeOut = Math.min(1, Math.max(0, (d - near) / 1.6));
        u.uAlpha.value = fadeIn * fadeOut;
        u.uFog.value = 0.25 + 0.75 * Math.pow(fadeIn, 1.6);
        u.uVel.value = Math.max(-0.8, Math.min(0.8, vel * 1.6));
        u.uTime.value = time;
        u.uNight.value = nS;
        u.uClock.value = flowState.time;
        if (m.userData.loaded) u.uReady.value = Math.min(1, u.uReady.value + 0.04);
        m.visible = u.uAlpha.value > 0.002;
        // les images regardent légèrement la caméra
        m.rotation.y = -m.position.x * 0.12 + mouse.sx * 0.05;
        m.rotation.x = m.position.y * 0.08;
        if (d > 1.6 && d < best) { best = d; nearest = m.userData.i; }
      });
      rings.forEach(function (g) {
        g.userData.mat.color.copy(ink);
        var d = camZ - g.position.z;
        var a = (1 - Math.min(1, Math.max(0, (d - 3) / 14))) * Math.min(1, Math.max(0, (d - 0.2) / 1.6));
        g.userData.mat.opacity = a * 0.55;
        g.rotation.z = -smooth * 0.9;
        g.visible = a > 0.002;
      });

      head.style.opacity = Math.max(0, 1 - smooth * 9).toFixed(3);
      hint.style.opacity = Math.max(0, 1 - smooth * 6).toFixed(3);
      var show = nearest >= 0 && best < GAP * 1.4 && smooth > 0.02 ? nearest : -1;
      if (show !== lastTitle) {
        lastTitle = show;
        swapTitle(show >= 0 ? PROJECTS[show] : null);
      }
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);

    // un projet se clique seul : on vise l'image sous le doigt ou le curseur
    var ray = new T.Raycaster(), ndc = new T.Vector2();
    function pickHit(x, y) {
      var r = canvas.getBoundingClientRect();
      ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      var hits = ray.intersectObjects(planes.filter(function (m) { return m.visible && m.material.uniforms.uAlpha.value > 0.3; }), false);
      return hits[0] || null;
    }
    function pick(x, y) {
      var r = canvas.getBoundingClientRect();
      ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      var hits = ray.intersectObjects(planes.filter(function (m) { return m.visible && m.material.uniforms.uAlpha.value > 0.3; }), false);
      return hits.length ? hits[0].object : null;
    }
    function screenRect(m) {
      var r = canvas.getBoundingClientRect(), box = new T.Box3().setFromObject(m), pts = [];
      [box.min.x, box.max.x].forEach(function (x) { [box.min.y, box.max.y].forEach(function (y) { [box.min.z, box.max.z].forEach(function (z) {
        var v = new T.Vector3(x, y, z).project(camera);
        pts.push([r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]);
      }); }); });
      var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
      return { l: Math.min.apply(null, xs), t: Math.min.apply(null, ys), r: Math.max.apply(null, xs), b: Math.max.apply(null, ys) };
    }
    if (fine) canvas.addEventListener('pointermove', function (e) {
      $('#cursor').classList.toggle('is-hit', !!pick(e.clientX, e.clientY));
    });
    canvas.addEventListener('pointerleave', function () { $('#cursor').classList.remove('is-hit'); });
    canvas.addEventListener('click', function (e) {
      var hit = pickHit(e.clientX, e.clientY);
      if (!hit) return;
      var m = hit.object, u = m.material.uniforms;
      if (hit.uv) u.uHit.value.copy(hit.uv);
      var from = screenRect(m), at = { x: e.clientX, y: e.clientY };
      if (window.gsap && !reduce) {
        gsap.fromTo(u.uPress, { value: 0 }, { value: 1, duration: 0.9, ease: 'power2.out', onComplete: function () { u.uPress.value = 0; } });
        setTimeout(function () { openViewer(m.userData.i, screenRect(m), at); }, 260);
      } else openViewer(m.userData.i, from, at);
    });
  }



  /* ------------------------------------------------------------------------
     Showreel : un cadre qui s'ouvre jusqu'au plein écran ; un clic lance le film avec le son
     ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------
     Un projet seul : il s'ouvre depuis l'endroit où on l'a touché
     ------------------------------------------------------------------------ */
  var viewer = $('#viewer'), vImg = $('#viewerImg'), vCap = $('#viewerCap'), vAt = 0;
  function showProject(i) {
    vAt = (i + PROJECTS.length) % PROJECTS.length;
    var p = PROJECTS[vAt];
    vImg.src = p.src;
    vImg.alt = p.title || '';
    vCap.textContent = p.title || '';
  }
  var vFrom = null, vAt0 = null;
  function openViewer(i, rect, at) {
    if (!PROJECTS.length) return;
    showProject(i);
    vFrom = rect; vAt0 = at || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    viewer.classList.add('is-open');
    viewer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    if (!window.gsap || reduce) return;
    var c = 'circle(0px at ' + vAt0.x + 'px ' + vAt0.y + 'px)';
    var big = Math.hypot(window.innerWidth, window.innerHeight);
    gsap.fromTo(viewer, { clipPath: c }, { clipPath: 'circle(' + big + 'px at ' + vAt0.x + 'px ' + vAt0.y + 'px)', duration: 1.1, ease: 'expo.inOut' });
    gsap.set($$('.viewer__btn, .viewer__cap'), { opacity: 0 });
    var land = function () {
      var to = vImg.getBoundingClientRect();
      if (rect && to.width) {
        var sx = (rect.r - rect.l) / to.width, sy = (rect.b - rect.t) / to.height, s1 = Math.max(0.05, Math.min(sx, sy));
        gsap.fromTo(vImg, {
          x: (rect.l + rect.r) / 2 - (to.left + to.width / 2), y: (rect.t + rect.b) / 2 - (to.top + to.height / 2),
          scale: s1, opacity: 1, filter: 'blur(6px)'
        }, { x: 0, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.25, ease: 'expo.inOut' });
      } else gsap.fromTo(vImg, { scale: 1.12, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, ease: 'expo.out' });
      gsap.to($$('.viewer__btn, .viewer__cap'), { opacity: 1, duration: 0.8, delay: 0.8, stagger: 0.06 });
    };
    if (vImg.complete && vImg.naturalWidth) land(); else vImg.onload = function () { vImg.onload = null; land(); };
  }
  function closeViewer() {
    if (!viewer.classList.contains('is-open')) return;
    var end = function () {
      viewer.classList.remove('is-open');
      viewer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      viewer.style.clipPath = '';
      if (window.gsap) gsap.set(vImg, { clearProps: 'transform,filter,opacity' });
    };
    if (!window.gsap || reduce) return end();
    var at = vAt0 || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    gsap.to($$('.viewer__btn, .viewer__cap'), { opacity: 0, duration: 0.25 });
    gsap.to(vImg, { scale: 0.86, opacity: 0, filter: 'blur(8px)', duration: 0.6, ease: 'power3.in' });
    gsap.to(viewer, { clipPath: 'circle(0px at ' + at.x + 'px ' + at.y + 'px)', duration: 0.9, ease: 'expo.inOut', delay: 0.15, onComplete: end });
  }
  function stepViewer(d) {
    if (window.gsap) {
      gsap.to(vImg, { opacity: 0, x: -30 * d, duration: 0.25, ease: 'power2.in', onComplete: function () {
        showProject(vAt + d);
        gsap.fromTo(vImg, { opacity: 0, x: 30 * d }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out' });
      } });
    } else showProject(vAt + d);
  }
  $('#viewerClose').addEventListener('click', closeViewer);
  $('#viewerPrev').addEventListener('click', function () { stepViewer(-1); });
  $('#viewerNext').addEventListener('click', function () { stepViewer(1); });
  document.addEventListener('keydown', function (e) {
    if (!viewer.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowRight') stepViewer(1);
    if (e.key === 'ArrowLeft') stepViewer(-1);
  });
  var sw = null;
  viewer.addEventListener('touchstart', function (e) { sw = e.touches[0].clientX; }, { passive: true });
  viewer.addEventListener('touchend', function (e) {
    if (sw === null) return;
    var dx = e.changedTouches[0].clientX - sw; sw = null;
    if (Math.abs(dx) > 50) stepViewer(dx < 0 ? 1 : -1);
  }, { passive: true });

  (function reel() {
    var sec = $('#reel'), frame = $('#reelFrame'), video = $('#reelVideo');
    var line = $('#reelLine'), label = $('#reelLabel');
    var theatre = $('#theatre'), tv = $('#theatreVideo');
    var visible = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        visible = e[0].isIntersecting;
        if (visible) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
        else video.pause();
      }, { threshold: 0.05 }).observe(sec);
    }
    function openTheatre() {
      if (!tv.src) tv.src = video.currentSrc || video.src;
      tv.currentTime = video.currentTime || 0;
      tv.muted = false;
      theatre.classList.add('is-open');
      theatre.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      video.pause();
      var p = tv.play(); if (p && p.catch) p.catch(function () { tv.muted = true; tv.play(); });
      if (window.gsap) gsap.fromTo(theatre, { clipPath: 'inset(50% 50% 50% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut' });
    }
    function closeTheatre() {
      if (!theatre.classList.contains('is-open')) return;
      var end = function () {
        theatre.classList.remove('is-open');
        theatre.setAttribute('aria-hidden', 'true');
        tv.pause();
        document.body.classList.remove('is-locked');
        if (visible) video.play();
      };
      if (window.gsap) gsap.to(theatre, { clipPath: 'inset(50% 50% 50% 50%)', duration: 0.8, ease: 'expo.inOut', onComplete: end });
      else end();
    }
    frame.addEventListener('click', openTheatre);
    $('#theatreClose').addEventListener('click', closeTheatre);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTheatre(); });
    function paint() {
      requestAnimationFrame(paint);
      if (!visible) { if (reelCover) { reelCover = false; toneState = ''; tone(); } return; }
      var r = sec.getBoundingClientRect();
      var vh = window.innerHeight, vw = window.innerWidth;
      var p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
      var e = p < 0.62 ? 1 - Math.pow(1 - p / 0.62, 3) : 1;
      var small = vw < 700 ? 0.78 : 0.42;
      var w = vw * (small + (1 - small) * e);
      var h = Math.min(vh, w / 1.283);
      h = h + (vh - h) * e;
      var x = (vw - w) / 2, y = (vh - h) / 2;
      frame.style.clipPath = 'inset(' + y.toFixed(1) + 'px ' + x.toFixed(1) + 'px)';
      video.style.transform = 'scale(' + (1.18 - 0.18 * e).toFixed(4) + ')';
      line.style.opacity = clamp((p - 0.55) / 0.15, 0, 1).toFixed(3);
      label.style.opacity = (1 - e).toFixed(3);
      var rc = e > 0.9 && r.top <= 1 && r.bottom >= vh - 1;
      if (rc !== reelCover) { reelCover = rc; toneState = ''; tone(); }
    }
    paint();
  })();

  /* ------------------------------------------------------------------------
     Départ
     ------------------------------------------------------------------------ */
  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
  window.SITE = {
    lang: function (l) {
      if (l === current && manifestoWords.length) return;
      render(l);
      renderStrengths(l);
      $$('.panel__cta span').forEach(function (s) { s.textContent = COPY[l].endCta; });
      onScroll();
    }
  };
  render(document.documentElement.lang && COPY[document.documentElement.lang] ? document.documentElement.lang : 'fr');
  $$('.panel__cta span').forEach(function (s) { s.textContent = COPY[current].endCta; });
  if (window.gsap && !reduce) gsap.set($$('.ch > span', $('#endTitle')), { yPercent: 110 });
  tunnel();
  onScroll();
})();
