/* 18H22 : la suite du site, sous la montre.
   Défilement fluide (Lenis), manifeste qui s'allume au défilement, showreel,
   tunnel du temps (three.js), services en volets horizontaux, bandeau clients,
   contact magnétique, petite montre de progression. */
(function () {
  'use strict';

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
  var CLIENTS = ['La Petite Maison', 'Enza Famiglia', 'Jacqueline', 'Agata Paris', 'Sounds Like Paris', 'Helicave', 'Melar Bescond', 'Bivouak'];

  var COPY = {
    fr: {
      cue: 'Entrer',
      manifesto: '18h22 est l’heure où la lumière change. Studio de création, nous donnons aux marques une image juste, et le temps de la faire vivre.',
      reelLabel: 'Showreel', reelLine: 'Paris, 18h22.',
      workLabel: 'Projets', workTitle: 'Sélection', workHint: 'Défiler', workAll: 'Index',
      servicesLabel: 'Services',
      endTitle: 'Un projet ?', endCta: 'Écrivez-nous', copied: 'Adresse copiée',
      need: 'Objet', needOther: 'Autre',
      cur: { play: 'Lecture', view: 'Index', go: 'Écrire', copy: 'Copier' }
    },
    en: {
      cue: 'Enter',
      manifesto: '18:22 is the hour the light changes. As a creative studio, we give brands the right image, and the time to make it live.',
      reelLabel: 'Showreel', reelLine: 'Paris, 18:22.',
      workLabel: 'Work', workTitle: 'Selection', workHint: 'Scroll', workAll: 'Index',
      servicesLabel: 'Services',
      endTitle: 'A project?', endCta: 'Write to us', copied: 'Address copied',
      need: 'Subject', needOther: 'Other',
      cur: { play: 'Play', view: 'Index', go: 'Write', copy: 'Copy' }
    },
    es: {
      cue: 'Entrar',
      manifesto: 'Las 18:22 son la hora en que cambia la luz. Como estudio creativo, damos a las marcas la imagen justa, y el tiempo para hacerla vivir.',
      reelLabel: 'Showreel', reelLine: 'París, 18:22.',
      workLabel: 'Proyectos', workTitle: 'Selección', workHint: 'Desplazar', workAll: 'Índice',
      servicesLabel: 'Servicios',
      endTitle: '¿Un proyecto?', endCta: 'Escríbenos', copied: 'Dirección copiada',
      need: 'Asunto', needOther: 'Otro',
      cur: { play: 'Ver', view: 'Índice', go: 'Escribir', copy: 'Copiar' }
    },
    it: {
      cue: 'Entra',
      manifesto: 'Le 18:22 sono l’ora in cui la luce cambia. Come studio creativo, diamo ai marchi l’immagine giusta, e il tempo per farla vivere.',
      reelLabel: 'Showreel', reelLine: 'Parigi, 18:22.',
      workLabel: 'Progetti', workTitle: 'Selezione', workHint: 'Scorri', workAll: 'Indice',
      servicesLabel: 'Servizi',
      endTitle: 'Un progetto?', endCta: 'Scriveteci', copied: 'Indirizzo copiato',
      need: 'Oggetto', needOther: 'Altro',
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
     Curseur : un mot dans le cercle selon ce qu'on survole ; boutons magnétiques
     ------------------------------------------------------------------------ */
  var cursor = $('#cursor'), cursorLabel = $('#cursorLabel');
  if (fine) {
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest && e.target.closest('[data-cursor]');
      if (t) {
        cursorLabel.textContent = COPY[current].cur[t.dataset.cursor] || '';
        cursor.classList.add('is-label');
      } else cursor.classList.remove('is-label');
    });
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

  // la lueur suit doucement le curseur
  var mist = $('#mist');
  if (fine && !reduce) {
    var mt = { x: 0, y: 0 }, ms = { x: 0, y: 0 };
    window.addEventListener('pointermove', function (e) {
      mt.x = e.clientX / window.innerWidth - 0.5; mt.y = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
    (function mistLoop() {
      ms.x += (mt.x - ms.x) * 0.03; ms.y += (mt.y - ms.y) * 0.03;
      mist.style.setProperty('--mx', ms.x.toFixed(4));
      mist.style.setProperty('--my', ms.y.toFixed(4));
      requestAnimationFrame(mistLoop);
    })();
  }

  var endShown = false;
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
    var want = ['p18', 'p08', 'p05'][k];
    var img = PROJECTS.filter(function (pj) { return (pj.file || pj.src).indexOf('/' + want + '.') > -1; })[0] ||
      (PROJECTS.length ? PROJECTS[(k * 6 + 3) % PROJECTS.length] : null);
    return '<article class="panel">' +
      '<h3 class="panel__t">' + esc(s.t) + '</h3>' +
      '<ul class="panel__list">' + s.i.map(function (x) { return '<li><span>' + esc(x) + '</span></li>'; }).join('') + '</ul>' +
      (img ? '<figure class="panel__img"><img src="' + img.src + '" alt="" loading="lazy" decoding="async"></figure>' : '') +
      '<button class="link panel__cta" type="button" data-contact="' + ['strategy', 'creative', 'social'][k] + '" data-magnetic data-cursor="go"><span data-s="endCta"></span></button>' +
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
  var row = CLIENTS.map(function (n) { return '<span>' + esc(n) + '</span><i></i>'; }).join('');
  marquee.innerHTML = '<div>' + row + '</div><div aria-hidden="true">' + row + '</div>';
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
  function tunnel() {
    var section = $('#selection');
    var canvas = $('#tunnelGl');
    var now = $('#tunnelNow');
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
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = uv;',
      '  vec3 p = position;',
      '  float bend = sin(uv.x * 3.14159) * sin(uv.y * 3.14159);',
      '  p.z += bend * uVel * 1.1;',
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
      'varying vec2 vUv;',
      'void main() {',
      '  vec2 uv = vUv;',
      '  float s = clamp(abs(uVel), 0.0, 1.0) * 0.012;',
      '  vec4 c = texture2D(uTex, uv);',
      '  float r = texture2D(uTex, uv + vec2(s, 0.0)).r;',
      '  float b = texture2D(uTex, uv - vec2(s, 0.0)).b;',
      '  vec3 col = vec3(r, c.g, b);',
      // les images sortent de la brume : voilées au loin, nettes de près
      '  vec3 mist = vec3(0.886, 0.882, 0.894);',
      '  col = mix(mist, col, uFog);',
      '  gl_FragColor = vec4(col, uAlpha * uReady);',
      '}'
    ].join('\n');

    var loader = new T.TextureLoader();
    var geo = new T.PlaneGeometry(1, 1, 24, 24);
    var planes = PROJECTS.map(function (p, i) {
      var mat = new T.ShaderMaterial({
        vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false,
        uniforms: { uTex: { value: null }, uVel: { value: 0 }, uTime: { value: 0 }, uAlpha: { value: 0 }, uReady: { value: 0 }, uFog: { value: 1 } }
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
        if (m.userData.loaded) u.uReady.value = Math.min(1, u.uReady.value + 0.04);
        m.visible = u.uAlpha.value > 0.002;
        // les images regardent légèrement la caméra
        m.rotation.y = -m.position.x * 0.12 + mouse.sx * 0.05;
        m.rotation.x = m.position.y * 0.08;
        if (d > 1.6 && d < best) { best = d; nearest = m.userData.i; }
      });
      rings.forEach(function (g) {
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
        var txt = show >= 0 ? (PROJECTS[show].title || '') : '';
        if (window.gsap) {
          gsap.to(now, { opacity: 0, y: -8, duration: 0.2, onComplete: function () {
            now.textContent = txt;
            gsap.fromTo(now, { opacity: 0, y: 10 }, { opacity: txt ? 1 : 0, y: 0, duration: 0.6, ease: 'expo.out' });
          } });
        } else now.textContent = txt;
      }
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);

    canvas.addEventListener('click', function () { if (window.APP) window.APP.openGallery(); });
  }



  /* ------------------------------------------------------------------------
     Showreel : un cadre qui s'ouvre jusqu'au plein écran ; un clic lance le film avec le son
     ------------------------------------------------------------------------ */
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
      if (!visible) return;
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
