/* ==========================================================================
   18H22 — landing animée
   1. construction du picto  2. écriture « 18h22 »  3. accroche (langue du
   visiteur)  4. projets en fondu autour du logo, qui suivent le curseur (WebGL)
   ========================================================================== */
(function () {
  'use strict';

  var PROJECTS = window.PROJECTS || [];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var params = new URLSearchParams(location.search);
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* Rythme des projets : un nouveau toutes les SPAWN_EVERY secondes ; au-delà
     de MAX projets visibles, le plus ancien s'efface et laisse sa place. */
  var SPAWN_EVERY = 3;
  var MAX_DESKTOP = 5;
  var MAX_MOBILE = 3;

  /* ------------------------------------------------------------------------
     Accroche : choisie d'après la langue du téléphone / navigateur
     ------------------------------------------------------------------------ */
  var TAGLINES = {
    fr: 'L’heure où les lieux se racontent.',
    en: 'The hour when places tell their story.',
    es: 'La hora en que los lugares se cuentan.',
    it: 'L’ora in cui i luoghi si raccontano.'
  };

  function detectLang() {
    var forced = (params.get('lang') || '').toLowerCase();
    if (TAGLINES[forced]) return forced;
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'fr'];
    for (var i = 0; i < list.length; i++) {
      var k = String(list[i]).slice(0, 2).toLowerCase();
      if (TAGLINES[k]) return k;
    }
    return 'fr';
  }

  var tagline = $('#tagline');
  var lang = detectLang();

  function renderTagline(l) {
    lang = l;
    document.documentElement.lang = l;
    tagline.innerHTML = TAGLINES[l].split(' ').map(function (w) {
      return '<span class="w"><span>' + w + '</span></span>';
    }).join(' ');
    $$('.lang button').forEach(function (b) {
      b.setAttribute('aria-current', b.dataset.lang === l ? 'true' : 'false');
    });
  }

  function showTagline(delay) {
    return gsap.to(tagline.querySelectorAll('.w > span'), {
      y: '0%', duration: 1.2, ease: 'expo.out', stagger: 0.07, delay: delay || 0
    });
  }

  renderTagline(lang);

  $$('.lang button').forEach(function (b) {
    b.addEventListener('click', function () {
      var l = b.dataset.lang;
      if (l === lang) return;
      gsap.to(tagline.querySelectorAll('.w > span'), {
        y: '-110%', duration: 0.5, ease: 'power2.in', stagger: 0.03,
        onComplete: function () { renderTagline(l); showTagline(); }
      });
    });
  });

  /* ------------------------------------------------------------------------
     Intro : construction du picto puis écriture de « 18h22 »
     ------------------------------------------------------------------------ */
  function prepDraw(el) {
    var len = el.getTotalLength();
    el.style.strokeDasharray = len + ' ' + len;
    el.style.strokeDashoffset = len;
  }

  function intro(done) {
    var guides = $$('.guides > *');
    var strokes = $$('.strokes path');
    guides.forEach(prepDraw);
    strokes.forEach(prepDraw);

    var letters = $$('.word__ink > *');
    gsap.set('.word__ink', { '--m': 100 });
    gsap.set(letters, { yPercent: 18, opacity: 0, filter: 'blur(6px)' });
    gsap.set('.nodes circle', { scale: 0 });

    var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: done });

    // 1. Tracés de construction : lignes, cercles, points d'appui
    tl.to(guides, { strokeDashoffset: 0, duration: 1.4, stagger: 0.06, ease: 'power3.inOut' }, 0.2)
      .to('.nodes circle', { scale: 1, opacity: 0.55, duration: 0.6, stagger: 0.05, ease: 'back.out(2)' }, 0.9)
      // 2. Le monogramme se dessine sur la grille
      .to('.stroke-a', { strokeDashoffset: 0, duration: 1.6 }, 1.3)
      .to('.stroke-b', { strokeDashoffset: 0, duration: 2.0 }, 1.8)
      // 3. Il prend sa forme pleine, la grille s'efface
      .to(['.guides', '.nodes'], { opacity: 0, duration: 1.2, ease: 'power1.out' }, 3.4)
      .to('.fill path', { opacity: 1, duration: 1.0, ease: 'power1.out' }, 3.5)
      .to('.strokes', { opacity: 0, duration: 1.0, ease: 'power1.out' }, 3.6)
      // 4. « 18h22 » sort à la plume, de gauche à droite
      .to('.word__ink', { '--m': 0, duration: 1.9, ease: 'power2.inOut' }, 3.8)
      .to(letters, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1.3, stagger: 0.14, ease: 'expo.out' }, 3.85)
      .to('.word__rule', { scaleX: 1, duration: 1.4, ease: 'expo.inOut' }, 4.6)
      // 5. L'accroche
      .add(showTagline(), 5.0);

    if (params.has('skip') || reduce) tl.progress(1);
    return tl;
  }

  /* ------------------------------------------------------------------------
     Pointeur : souris, doigt, gyroscope, ou dérive lente au repos
     ------------------------------------------------------------------------ */
  var W = window.innerWidth;
  var H = window.innerHeight;
  var ptr = { x: W / 2, y: H / 2, tx: W / 2, ty: H / 2, mx: -100, my: -100, last: -1e9, tilt: null };
  var cursor = $('#cursor');

  window.addEventListener('pointermove', function (e) {
    ptr.tx = e.clientX; ptr.ty = e.clientY;
    ptr.mx = e.clientX; ptr.my = e.clientY;
    ptr.last = performance.now();
    if (e.pointerType === 'mouse') cursor.classList.add('is-on');
  }, { passive: true });
  document.addEventListener('mouseleave', function () { cursor.classList.remove('is-on'); });
  window.addEventListener('touchmove', function (e) {
    var t = e.touches[0];
    ptr.tx = t.clientX; ptr.ty = t.clientY;
    ptr.last = performance.now();
  }, { passive: true });
  // Android : l'inclinaison du téléphone guide doucement les projets (iOS demande une autorisation, on s'en passe)
  window.addEventListener('deviceorientation', function (e) {
    if (e.gamma == null || e.beta == null) return;
    ptr.tilt = { x: Math.max(-1, Math.min(1, e.gamma / 25)), y: Math.max(-1, Math.min(1, (e.beta - 45) / 25)) };
  });

  function updatePointer(t) {
    var idle = t - ptr.last > 2600;
    var k = idle ? 0.018 : 0.14;
    if (idle) {
      if (ptr.tilt) {
        ptr.tx = W / 2 + ptr.tilt.x * W * 0.3;
        ptr.ty = H / 2 + ptr.tilt.y * H * 0.2;
        k = 0.05;
      } else {
        ptr.tx = W / 2 + Math.sin(t * 0.00021) * W * 0.2;
        ptr.ty = H / 2 + Math.cos(t * 0.00016) * H * 0.14;
      }
    }
    ptr.x += (ptr.tx - ptr.x) * k;
    ptr.y += (ptr.ty - ptr.y) * k;
  }

  /* ------------------------------------------------------------------------
     Rendu WebGL
     ------------------------------------------------------------------------ */
  var VERT = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'attribute vec2 aPos;',
    'uniform vec2 uRes;',
    'uniform vec4 uRect;',
    'uniform vec2 uVel;',
    'uniform float uScale;',
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = aPos;',
    '  vec2 c = uRect.xy + uRect.zw * 0.5;',
    '  vec2 p = c + (uRect.xy + aPos * uRect.zw - c) * uScale;',
    // le centre de l'image traîne derrière ses bords : effet de tissu tiré
    '  float bulge = sin(aPos.x * 3.14159) * sin(aPos.y * 3.14159);',
    '  p -= uVel * bulge * 2.4;',
    '  vec2 clip = p / uRes * 2.0 - 1.0;',
    '  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform sampler2D uTex;',
    'uniform vec2 uImg;',
    'uniform vec4 uRect;',
    'uniform vec2 uVel;',
    'uniform float uAlpha;',
    'uniform float uReveal;',
    'uniform float uOut;',
    'uniform float uTime;',
    'varying vec2 vUv;',
    'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);',
    '}',
    'void main() {',
    // cadrage « cover »
    '  float ra = uRect.z / uRect.w;',
    '  float ia = uImg.x / uImg.y;',
    '  vec2 s = ra > ia ? vec2(1.0, ia / ra) : vec2(ra / ia, 1.0);',
    '  vec2 uv = (vUv - 0.5) * s + 0.5;',
    // léger zoom arrière à l'apparition, zoom avant en sortie
    '  float zoom = 1.0 + 0.16 * (1.0 - uReveal) + 0.06 * uOut;',
    '  uv = (uv - 0.5) / zoom + 0.5;',
    // séparation des couleurs proportionnelle à la vitesse
    '  vec2 shift = uVel / uRect.zw * 0.35;',
    '  vec4 base = texture2D(uTex, uv);',
    '  float r = texture2D(uTex, uv + shift).r;',
    '  float b = texture2D(uTex, uv - shift).b;',
    '  vec3 col = vec3(r, base.g, b);',
    // révélation de bas en haut, bord doux et légèrement organique
    '  float n = noise(vUv * vec2(5.0, 2.5) + uTime * 0.15) * 0.16;',
    '  float d = (1.0 - vUv.y) + n;',
    '  float m = smoothstep(0.0, 0.24, uReveal * 1.45 - d);',
    '  float a = m * uAlpha;',
    '  gl_FragColor = vec4(col * a, a);',
    '}'
  ].join('\n');

  function createRenderer(canvas) {
    var opts = { alpha: true, premultipliedAlpha: true, antialias: true };
    var gl = null;
    try { gl = canvas.getContext('webgl2', opts) || canvas.getContext('webgl', opts); } catch (e) { gl = null; }
    if (!gl || params.has('nogl')) return null;
    var isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;

    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    var prog = gl.createProgram();
    try {
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) {
      console.warn('18H22 · WebGL indisponible', e);
      return null;
    }
    gl.useProgram(prog);

    // Grille subdivisée pour pouvoir plier l'image
    var N = 24, verts = [], idx = [];
    for (var y = 0; y <= N; y++) for (var x = 0; x <= N; x++) verts.push(x / N, y / N);
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      var i = y * (N + 1) + x;
      idx.push(i, i + 1, i + N + 1, i + 1, i + N + 2, i + N + 1);
    }
    var vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    var ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['uRes', 'uRect', 'uVel', 'uScale', 'uTex', 'uImg', 'uAlpha', 'uReveal', 'uOut', 'uTime'].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });
    gl.uniform1i(U.uTex, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    var dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();

    function texture(img) {
      var src = img;
      if (!isGL2) {
        // WebGL 1 : dimensions puissance de 2 pour avoir des mipmaps nettes
        var c = document.createElement('canvas');
        c.width = c.height = 1024;
        c.getContext('2d').drawImage(img, 0, 0, 1024, 1024);
        src = c;
      }
      var t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }

    function draw(items, time) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uRes, W, H);
      gl.uniform1f(U.uTime, time * 0.001);
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it.tex || it.alpha <= 0.001) continue;
        gl.bindTexture(gl.TEXTURE_2D, it.tex);
        gl.uniform4f(U.uRect, it.rx, it.ry, it.w, it.h);
        gl.uniform2f(U.uVel, it.vx, it.vy);
        gl.uniform1f(U.uScale, it.scale);
        gl.uniform2f(U.uImg, it.proj.w, it.proj.h);
        gl.uniform1f(U.uAlpha, it.alpha);
        gl.uniform1f(U.uReveal, it.reveal);
        gl.uniform1f(U.uOut, it.out);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      }
    }

    function release(t) { if (t) gl.deleteTexture(t); }

    return { draw: draw, texture: texture, resize: resize, release: release };
  }

  /* ------------------------------------------------------------------------
     Projets : chargement, placement, cycle de vie
     ------------------------------------------------------------------------ */
  var gl = createRenderer($('#stage'));
  if (!gl) document.documentElement.classList.add('no-webgl');
  var stageDom = $('#stageDom');
  var captions = $('#captions');

  var images = PROJECTS.map(function (p) {
    var img = new Image();
    img.decoding = 'async';
    img.src = p.src;
    var entry = { img: img, ok: false };
    (img.decode ? img.decode() : new Promise(function (r) { img.onload = r; }))
      .then(function () { entry.ok = true; })
      .catch(function () { entry.ok = false; });
    return entry;
  });

  var items = [];
  var order = shuffle(PROJECTS.map(function (_, i) { return i; }));
  var cursorIdx = 0;
  var shown = 0;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function isMobile() { return W < 700; }

  function lockupRect(pad) {
    var r = null;
    ['#mark', '#word', '#tagline'].forEach(function (s) {
      var b = $(s).getBoundingClientRect();
      if (!r) r = { x: b.left, y: b.top, r: b.right, b: b.bottom };
      else { r.x = Math.min(r.x, b.left); r.y = Math.min(r.y, b.top); r.r = Math.max(r.r, b.right); r.b = Math.max(r.b, b.bottom); }
    });
    return { x: r.x - pad, y: r.y - pad, w: r.r - r.x + pad * 2, h: r.b - r.y + pad * 2 };
  }

  function overlap(a, b) {
    var x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    var y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    return x * y;
  }
  function gap(a, b) {
    var gx = Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w));
    var gy = Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h));
    return Math.max(gx, gy);
  }

  function amplitude() { return Math.min(W, H) * (isMobile() ? 0.05 : 0.08); }

  // Cherche la place la plus aérée : loin des autres projets, jamais sur le logo
  function place(p) {
    var mobile = isMobile();
    var ar = p.w / p.h;
    var w = mobile ? rand(0.28, 0.36) * W : Math.max(150, Math.min(340, rand(0.12, 0.18) * W));
    var h = w / ar;
    var maxH = H * (mobile ? 0.2 : 0.34);
    if (h > maxH) { h = maxH; w = h * ar; }
    var edge = mobile ? 16 : 40;
    var top = mobile ? 56 : 70;
    var bottom = mobile ? 64 : 84;
    var amp = amplitude();
    var L = lockupRect(amp + (mobile ? 10 : 28));
    var pad = 30 + amp * 0.6; // légende + écart de mouvement entre deux projets
    var live = items;
    var best = null, bestScore = -Infinity;
    for (var attempt = 0; attempt < 4; attempt++) {
      for (var n = 0; n < 90; n++) {
        var r = { x: rand(edge, Math.max(edge, W - w - edge)), y: rand(top, Math.max(top, H - h - bottom - 24)), w: w, h: h };
        var score = 500;
        live.forEach(function (it) { score = Math.min(score, gap(r, it) - pad); });
        var o = overlap(r, L);
        if (o > 0) score -= 10000 + o;
        if (score > bestScore) { bestScore = score; best = r; }
      }
      if (bestScore > -10000) break;
      // pas de place libre : on réduit un peu l'image et on recommence
      w *= 0.82; h *= 0.82;
    }
    return best;
  }

  function spawn() {
    if (!PROJECTS.length) return;
    // prochain projet chargé, pas déjà à l'écran
    var visible = items.map(function (it) { return it.index; });
    var index = -1;
    for (var n = 0; n < order.length; n++) {
      var cand = order[(cursorIdx + n) % order.length];
      if (images[cand].ok && visible.indexOf(cand) === -1) { index = cand; cursorIdx = (cursorIdx + n + 1) % order.length; break; }
    }
    if (index < 0) return;

    // le plus ancien s'en va d'abord et laisse sa place
    var max = isMobile() ? MAX_MOBILE : MAX_DESKTOP;
    var live = items.filter(function (it) { return !it.leaving; });
    if (live.length >= max) retire(live[0]);

    var p = PROJECTS[index];
    var r = place(p);
    var it = {
      index: index, proj: p,
      x: r.x, y: r.y, w: r.w, h: r.h, rx: r.x, ry: r.y,
      depth: rand(0.35, 1), phase: rand(0, Math.PI * 2),
      ox: 0, oy: 0, vx: 0, vy: 0, sx: 0, sy: 0, px: 0, py: 0, hover: 0, scale: 1,
      alpha: 0, reveal: 0, out: 0, leaving: false
    };
    if (gl) it.tex = gl.texture(images[index].img);
    else {
      it.el = images[index].img.cloneNode();
      stageDom.appendChild(it.el);
    }
    it.cap = document.createElement('div');
    it.cap.className = 'cap';
    it.cap.innerHTML = '<b>N° ' + String(index + 1).padStart(2, '0') + '</b>' + (p.title ? '<span>' + p.title + '</span>' : '');
    captions.appendChild(it.cap);
    items.push(it);

    gsap.to(it, { alpha: 1, duration: 1.6, ease: 'power1.out' });
    gsap.to(it, { reveal: 1, duration: 2.4, ease: 'expo.out' });

    shown++;
    $('.counter__now').textContent = String(index + 1).padStart(2, '0');
  }

  function retire(it) {
    it.leaving = true;
    gsap.killTweensOf(it);
    gsap.to(it, { out: 1, duration: 2, ease: 'power2.in' });
    gsap.to(it, {
      alpha: 0, duration: 1.8, ease: 'power2.inOut',
      onComplete: function () {
        items.splice(items.indexOf(it), 1);
        if (gl) gl.release(it.tex);
        if (it.el) it.el.remove();
        it.cap.remove();
      }
    });
  }

  /* ------------------------------------------------------------------------
     Boucle
     ------------------------------------------------------------------------ */
  var running = false;
  var clock = 0;
  var prev = 0;

  function frame(t) {
    var dt = Math.min(100, t - (prev || t));
    prev = t;
    updatePointer(t);

    cursor.style.transform = 'translate3d(' + ptr.mx + 'px,' + ptr.my + 'px,0)';

    if (running) {
      clock += dt;
      if (clock >= SPAWN_EVERY * 1000) { clock = 0; spawn(); }
    }

    var amp = amplitude();
    var nx = (ptr.x - W / 2) / (W / 2);
    var ny = (ptr.y - H / 2) / (H / 2);
    var sigma = Math.min(W, H) * 0.4;
    var over = false;

    // Les projets s'écartent doucement quand ils se rapprochent trop
    for (var a = 0; a < items.length; a++) {
      var A = items[a];
      A.px = 0; A.py = 0;
    }
    for (a = 0; a < items.length; a++) {
      for (var b = a + 1; b < items.length; b++) {
        var P = items[a], Q = items[b];
        if (P.leaving && Q.leaving) continue;
        var m = 24;
        var ix = Math.min(P.rx + P.w, Q.rx + Q.w) - Math.max(P.rx, Q.rx) + m;
        var iy = Math.min(P.ry + P.h + 24, Q.ry + Q.h + 24) - Math.max(P.ry, Q.ry) + m;
        if (ix <= 0 || iy <= 0) continue;
        if (ix < iy) {
          var sx = (P.rx + P.w / 2 < Q.rx + Q.w / 2 ? -1 : 1) * ix * 0.5;
          if (!P.leaving) P.px += Q.leaving ? sx * 2 : sx;
          if (!Q.leaving) Q.px -= P.leaving ? sx * 2 : sx;
        } else {
          var sy = (P.ry + P.h / 2 < Q.ry + Q.h / 2 ? -1 : 1) * iy * 0.5;
          if (!P.leaving) P.py += Q.leaving ? sy * 2 : sy;
          if (!Q.leaving) Q.py -= P.leaving ? sy * 2 : sy;
        }
      }
    }

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var cx = it.x + it.w / 2, cy = it.y + it.h / 2;
      var tx = 0, ty = 0;
      if (!reduce) {
        // tous glissent dans la direction du curseur (les plus « proches » davantage)
        tx = nx * amp * it.depth;
        ty = ny * amp * it.depth;
        // et ceux qui sont près de lui s'en approchent un peu
        var dx = ptr.x - cx, dy = ptr.y - cy;
        var f = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        tx += dx * 0.1 * f * it.depth;
        ty += dy * 0.1 * f * it.depth;
        // respiration lente
        tx += Math.sin(t * 0.00035 + it.phase) * 5;
        ty += Math.cos(t * 0.00029 + it.phase) * 5;
      }
      var k = 0.03 + 0.045 * it.depth;
      var pox = it.ox, poy = it.oy;
      it.ox += (tx - it.ox) * k;
      it.oy += (ty - it.oy) * k;
      var vmax = 22;
      it.vx += (Math.max(-vmax, Math.min(vmax, it.ox - pox)) - it.vx) * 0.2;
      it.vy += (Math.max(-vmax, Math.min(vmax, it.oy - poy)) - it.vy) * 0.2;
      if (reduce) { it.vx = it.vy = 0; }
      it.sx = (it.sx + it.px * 0.06) * 0.994;
      it.sy = (it.sy + it.py * 0.06) * 0.994;
      it.rx = it.x + it.ox + it.sx;
      it.ry = it.y + it.oy + it.sy;

      var inside = finePointer && !it.leaving && ptr.mx > it.rx && ptr.mx < it.rx + it.w && ptr.my > it.ry && ptr.my < it.ry + it.h;
      if (inside) over = true;
      it.hover += ((inside ? 1 : 0) - it.hover) * 0.08;
      it.scale = 1 + it.hover * 0.035 - it.out * 0.04;

      var capA = it.alpha * Math.max(0, (it.reveal - 0.55) / 0.45) * (0.7 + 0.3 * it.hover);
      var sx = it.rx + (it.w - it.w * it.scale) / 2;
      var sy = it.ry + it.h - (it.h - it.h * it.scale) / 2;
      it.cap.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,' + (sy + 10).toFixed(1) + 'px,0)';
      it.cap.style.opacity = capA.toFixed(3);

      if (it.el) {
        it.el.style.width = it.w + 'px';
        it.el.style.height = it.h + 'px';
        it.el.style.opacity = it.alpha.toFixed(3);
        it.el.style.clipPath = 'inset(' + ((1 - Math.min(1, it.reveal * 1.1)) * 100).toFixed(2) + '% 0 0 0)';
        it.el.style.transform = 'translate3d(' + it.rx.toFixed(1) + 'px,' + it.ry.toFixed(1) + 'px,0) scale(' + it.scale.toFixed(4) + ')';
      }
    }
    cursor.classList.toggle('is-over', over);

    if (gl) gl.draw(items, t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ------------------------------------------------------------------------
     Redimensionnement
     ------------------------------------------------------------------------ */
  window.addEventListener('resize', function () {
    var W0 = W, H0 = H;
    W = window.innerWidth;
    H = window.innerHeight;
    var s = W / W0;
    items.forEach(function (it) {
      it.x *= s; it.w *= s; it.h *= s;
      it.y = it.y * (H / H0);
    });
    ptr.tx = ptr.x = W / 2;
    ptr.ty = ptr.y = H / 2;
    if (gl) gl.resize();
  });

  /* ------------------------------------------------------------------------
     Départ
     ------------------------------------------------------------------------ */
  $('.counter__all').textContent = String(PROJECTS.length).padStart(2, '0');
  $('#year').textContent = new Date().getFullYear();

  function start() {
    document.body.classList.remove('is-intro');
    document.body.classList.add('is-ready');
    running = true;
    spawn();
  }

  var go = function () { intro(start); };
  if (document.fonts && document.fonts.ready) {
    // on attend les polices (sans bloquer plus d'une seconde)
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1000); })]).then(go);
  } else go();
})();
