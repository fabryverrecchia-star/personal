/* ==========================================================================
   Scène WebGL — papier aquarelle et petites fleurs qui tombent doucement,
   aux couleurs de la couronne du faire-part (terracotta, ocre, rose,
   lilas, feuilles sauge). WebGL 1 sans librairie : tout est calculé sur
   le GPU. Mobile : résolution plafonnée et adaptative, pause hors écran.
   ========================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("scene");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 760;

  var api = { ready: false, started: false, start: function () {}, burst: function () {} };
  window.LouScene = api;

  var gl = null;
  try {
    gl = canvas.getContext("webgl", {
      antialias: false, alpha: true, depth: false, stencil: false,
      premultipliedAlpha: true, powerPreference: "low-power", preserveDrawingBuffer: false
    });
  } catch (e) { gl = null; }

  if (!gl) {
    document.documentElement.classList.add("no-webgl");
    api.ready = true;
    return;
  }

  /* ───────────── Shaders ───────────── */

  var QUAD_VS = [
    "attribute vec2 aPos;",
    "varying vec2 vUv;",
    "void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }"
  ].join("\n");

  // Lavis d'aquarelle : des taches pastel aux bords irréguliers qui dérivent
  // lentement dans les coins, le centre reste clair pour le texte.
  var WASH_FS = [
    "precision mediump float;",
    "varying vec2 vUv;",
    "uniform vec2 uRes;",
    "uniform float uTime;",
    "uniform float uScroll;",
    "uniform float uReveal;",
    "uniform vec2 uPointer;",

    "float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }",
    "float noise(vec2 p){",
    "  vec2 i = floor(p), f = fract(p);",
    "  vec2 u = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),",
    "             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);",
    "}",
    "float fbm(vec2 p){",
    "  float v = 0.0, a = 0.5;",
    "  for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.07 + 13.1; a *= 0.5; }",
    "  return v;",
    "}",

    // une tache : disque déformé par le bruit, bord légèrement plus foncé (comme le pigment qui sèche)
    "vec2 blot(vec2 p, vec2 c, float r, float seed, float t){",
    "  vec2 d = p - c;",
    "  float n = fbm(d * 2.2 + seed + vec2(t * 0.6, -t * 0.4));",
    "  float dist = length(d) / r + (n - 0.5) * 0.9;",
    "  float body = 1.0 - smoothstep(0.55, 1.0, dist);",
    "  float edge = smoothstep(0.6, 0.93, dist) * (1.0 - smoothstep(0.93, 1.02, dist));",
    "  return vec2(body, edge);",
    "}",

    "void main(){",
    "  vec2 uv = vUv;",
    "  float aspect = uRes.x / uRes.y;",
    "  vec2 p = vec2(uv.x * aspect, uv.y);",
    "  float t = uTime * 0.05;",
    "  float s = uScroll;",
    "  p += (uPointer - 0.5) * 0.04;",

    "  vec3 paper = vec3(0.988, 0.980, 0.973);",
    "  vec3 lilac = vec3(0.835, 0.82, 0.945);",
    "  vec3 blush = vec3(0.965, 0.86, 0.87);",
    "  vec3 sage  = vec3(0.84, 0.885, 0.835);",
    "  vec3 ochre = vec3(0.965, 0.905, 0.80);",

    "  vec3 col = paper;",
    // les taches glissent vers le haut quand on défile, en boucle douce
    "  vec2 b1 = blot(p, vec2(aspect * 1.02 + sin(t) * 0.04, 0.98 - s * 0.10), 0.52, 1.0, t);",
    "  vec2 b2 = blot(p, vec2(-0.06 + cos(t * 0.8) * 0.03, 0.12 + s * 0.06), 0.55, 7.0, t);",
    "  vec2 b3 = blot(p, vec2(aspect * 0.98, 0.04 + sin(t * 0.7 + s) * 0.06), 0.36, 13.0, t);",
    "  vec2 b4 = blot(p, vec2(0.02, 0.86 - sin(s * 0.7) * 0.08), 0.30, 21.0, t);",
    "  col = mix(col, lilac, b1.x * 0.55); col -= b1.y * 0.035;",
    "  col = mix(col, blush, b2.x * 0.55); col -= b2.y * 0.035;",
    "  col = mix(col, sage,  b3.x * 0.55); col -= b3.y * 0.03;",
    "  col = mix(col, ochre, b4.x * 0.45); col -= b4.y * 0.03;",

    // grain du papier : fibres douces + granulation
    "  float fib = fbm(vec2(p.x * 26.0, p.y * 9.0));",
    "  col *= 0.985 + fib * 0.025;",

    "  col = mix(paper, col, uReveal);",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  // Agrandissement de la texture basse résolution + grain fin fixe.
  var BLIT_FS = [
    "precision mediump float;",
    "varying vec2 vUv;",
    "uniform sampler2D uTex;",
    "float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }",
    "void main(){",
    "  vec3 col = texture2D(uTex, vUv).rgb;",
    "  col += (hash(gl_FragCoord.xy) - 0.5) * 0.012;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  // Fleurs et feuilles : un « point sprite » chacune, mouvement dans le vertex shader.
  var BLOOM_VS = [
    "attribute vec4 aSeed;",
    "uniform float uTime;",
    "uniform float uScroll;",
    "uniform float uSize;",
    "uniform float uReveal;",
    "uniform vec2 uWind;",
    "uniform float uBurst;",
    "varying float vRot;",
    "varying float vFlip;",
    "varying float vKind;",
    "varying float vAlpha;",
    "void main(){",
    "  float depth = aSeed.w;",
    "  float speed = mix(0.025, 0.065, aSeed.y) * mix(0.7, 1.15, depth);",
    "  float span = 2.6;",
    "  float travel = aSeed.z * span + uTime * speed + uScroll * (0.2 + depth * 0.5);",
    "  float y = 1.3 - mod(travel, span);",
    "  float sway = sin(uTime * (0.3 + aSeed.y * 0.45) + aSeed.z * 6.2831) * 0.11;",
    "  float x = (aSeed.x * 2.0 - 1.0) * 1.12 + sway + uWind.x * (0.4 + depth) * 0.35;",
    "  y += uWind.y * (0.4 + depth) * 0.15;",
    // petite gerbe quand un message est envoyé : tout s'écarte du centre
    "  vec2 c = vec2(x, y);",
    "  c += normalize(c + 0.0001) * uBurst * (0.15 + depth * 0.25);",
    "  gl_Position = vec4(c, 0.0, 1.0);",
    "  gl_PointSize = mix(10.0, 30.0, depth * depth) * uSize;",
    "  vRot = aSeed.z * 12.0 + uTime * (aSeed.y - 0.5) * 1.2 + uWind.x * 2.0;",
    "  vFlip = sin(uTime * (0.5 + aSeed.y * 1.2) + aSeed.x * 20.0);",
    "  vKind = fract(aSeed.x * 7.31 + aSeed.y * 3.17);",
    "  vAlpha = mix(0.4, 0.92, depth) * uReveal;",
    "}"
  ].join("\n");

  var BLOOM_FS = [
    "precision mediump float;",
    "varying float vRot;",
    "varying float vFlip;",
    "varying float vKind;",
    "varying float vAlpha;",
    "void main(){",
    "  vec2 p = gl_PointCoord * 2.0 - 1.0;",
    "  float c = cos(vRot), s = sin(vRot);",
    "  p = mat2(c, -s, s, c) * p;",
    "  p.y /= max(abs(vFlip), 0.25);",                        // bascule en 3D
    "  float r = length(p);",
    "  float ang = atan(p.y, p.x);",
    "  float a; vec3 col; float center = 0.0;",
    "  if (vKind < 0.28) {",
    // feuille sauge : amande allongée avec nervure
    "    float w = 0.36 * (1.0 - p.y * p.y);",
    "    a = 1.0 - smoothstep(w - 0.06, w, abs(p.x));",
    "    a *= 1.0 - smoothstep(0.9, 1.0, abs(p.y));",
    "    col = mix(vec3(0.43, 0.55, 0.45), vec3(0.62, 0.71, 0.6), smoothstep(-1.0, 1.0, p.x));",
    "    col -= 0.06 * (1.0 - smoothstep(0.0, 0.05, abs(p.x)));",
    "  } else {",
    // petite fleur : 5 ou 8 pétales arrondis et un cœur
    "    float n = vKind < 0.6 ? 5.0 : 8.0;",
    "    float petal = 0.62 + 0.3 * abs(cos(ang * n * 0.5));",
    "    a = 1.0 - smoothstep(petal - 0.1, petal, r);",
    "    center = 1.0 - smoothstep(0.16, 0.24, r);",
    "    vec3 tint;",
    "    if (vKind < 0.45) tint = vec3(0.86, 0.5, 0.42);",        // terracotta
    "    else if (vKind < 0.6) tint = vec3(0.9, 0.74, 0.47);",    // ocre
    "    else if (vKind < 0.8) tint = vec3(0.96, 0.78, 0.81);",   // rose poudré
    "    else tint = vec3(0.72, 0.7, 0.9);",                      // lilas
    "    col = mix(tint, tint * 1.12 + 0.04, smoothstep(0.2, 0.8, r));",   // pigment plus clair au bord
    "    col = mix(col, vec3(0.95, 0.85, 0.55), center * 0.85);",
    "  }",
    "  if (a < 0.01) discard;",
    "  col *= 0.95 + 0.05 * sign(vFlip);",
    "  float alpha = a * vAlpha;",
    "  gl_FragColor = vec4(min(col, vec3(1.0)) * alpha, alpha);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); return null; }
    return sh;
  }
  function program(vs, fs) {
    var v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var pr = gl.createProgram();
    gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    return gl.getProgramParameter(pr, gl.LINK_STATUS) ? pr : null;
  }
  function uniforms(pr, names) {
    var u = {};
    names.forEach(function (n) { u[n] = gl.getUniformLocation(pr, n); });
    return u;
  }

  var wash = program(QUAD_VS, WASH_FS);
  var blooms = program(BLOOM_VS, BLOOM_FS);
  var blit = program(QUAD_VS, BLIT_FS);
  if (!wash || !blooms || !blit) {
    document.documentElement.classList.add("no-webgl");
    api.ready = true;
    return;
  }
  var uWash = uniforms(wash, ["uRes", "uTime", "uScroll", "uReveal", "uPointer"]);
  var uBloom = uniforms(blooms, ["uTime", "uScroll", "uSize", "uReveal", "uWind", "uBurst"]);

  var quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(wash, "aPos");
  var aPosBlit = gl.getAttribLocation(blit, "aPos");
  var uBlitTex = gl.getUniformLocation(blit, "uTex");

  // Le lavis est très doux : calculé en basse résolution puis agrandi.
  var DIV = isMobile ? 3 : 2;
  var washTex = gl.createTexture();
  var washFbo = gl.createFramebuffer();
  var SW = 1, SH = 1, washDirty = true;
  function sizeWash() {
    SW = Math.max(2, Math.ceil(W / DIV));
    SH = Math.max(2, Math.ceil(H / DIV));
    gl.bindTexture(gl.TEXTURE_2D, washTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SW, SH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, washFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, washTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    washDirty = true;
  }

  var COUNT = isMobile ? 34 : 64;
  var seeds = new Float32Array(COUNT * 4);
  for (var i = 0; i < COUNT * 4; i++) seeds[i] = Math.random();
  var seedBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
  gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
  var aSeed = gl.getAttribLocation(blooms, "aSeed");

  gl.disable(gl.DEPTH_TEST);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  /* ───────────── Taille & qualité adaptative ───────────── */

  var maxDpr = isMobile ? 1.5 : 1.75;
  var quality = 1;
  var W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, maxDpr) * quality;
    var w = window.innerWidth;
    var h = Math.max(window.innerHeight, document.documentElement.clientHeight);
    W = Math.max(1, Math.round(w * dpr));
    H = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    sizeWash();
  }

  var resizeTimer = 0, lastWidth = window.innerWidth;
  window.addEventListener("resize", function () {
    if (isMobile && Math.abs(window.innerWidth - lastWidth) < 2) return;   // barre d'adresse mobile
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(requestResize, 120);
  }, { passive: true });
  window.addEventListener("orientationchange", function () { setTimeout(requestResize, 250); });

  // Changer la taille du canvas l'efface : on le fait toujours juste avant de redessiner,
  // jamais après (sinon une image vide s'affiche = flash).
  var needResize = false;
  function requestResize() {
    needResize = true;
    if (!running) { resize(); render(performance.now()); needResize = false; }
  }

  /* ───────────── Interaction ───────────── */

  var pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  var wind = { x: 0, y: 0, vx: 0, vy: 0 };
  var scroll = { y: 0, smooth: 0 };
  var burst = 0, burstV = 0;
  var lastTouch = null;

  window.addEventListener("pointermove", function (e) {
    pointer.tx = e.clientX / window.innerWidth;
    pointer.ty = 1 - e.clientY / window.innerHeight;
  }, { passive: true });
  window.addEventListener("touchstart", function (e) {
    var t = e.touches[0]; lastTouch = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  window.addEventListener("touchmove", function (e) {
    if (!lastTouch) return;
    var t = e.touches[0];
    wind.vx += (t.clientX - lastTouch.x) / window.innerWidth * 1.4;
    lastTouch = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  window.addEventListener("scroll", function () {
    scroll.y = window.scrollY / Math.max(1, window.innerHeight);
  }, { passive: true });

  /* ───────────── Boucle ───────────── */

  var running = false;
  var reveal = 0, revealTarget = 0;
  var speed = reduceMotion ? 0.35 : 1;
  var time = 0, lastFrame = performance.now(), frameNo = 0;
  var baseDt = 1, slowFrames = 0, fastFrames = 0;
  var startedAt = Infinity, lastQualityChange = 0;

  function ease(rate, dt) { return 1 - Math.exp(-rate * dt); }

  function render(now) {
    if (needResize) { needResize = false; resize(); }
    var dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
    lastFrame = now;
    time += dt * speed;
    frameNo++;

    pointer.x += (pointer.tx - pointer.x) * ease(2.4, dt);
    pointer.y += (pointer.ty - pointer.y) * ease(2.4, dt);
    var prev = scroll.smooth;
    scroll.smooth += (scroll.y - scroll.smooth) * ease(5, dt);
    if (!reduceMotion) {
      wind.vy -= (scroll.smooth - prev) * 2.0;
      wind.x += wind.vx; wind.y += wind.vy;
    }
    var damp = Math.exp(-6.3 * dt);
    wind.vx *= damp; wind.vy *= damp;
    wind.x *= Math.exp(-2.4 * dt); wind.y *= Math.exp(-3 * dt);
    reveal += (revealTarget - reveal) * ease(1.2, dt);
    // ressort amorti pour la gerbe
    burstV += (-burst * 18 - burstV * 5) * dt;
    burst += burstV * dt;

    // 1 — lavis dans la petite texture (une image sur deux : il bouge lentement)
    if (washDirty || frameNo % 2 === 0 || reveal < 0.99) {
      washDirty = false;
      gl.bindFramebuffer(gl.FRAMEBUFFER, washFbo);
      gl.viewport(0, 0, SW, SH);
      gl.disable(gl.BLEND);
      gl.useProgram(wash);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uWash.uRes, SW, SH);
      gl.uniform1f(uWash.uTime, time);
      gl.uniform1f(uWash.uScroll, scroll.smooth);
      gl.uniform1f(uWash.uReveal, reveal);
      gl.uniform2f(uWash.uPointer, pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disableVertexAttribArray(aPos);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // 2 — agrandi à l'écran
    gl.viewport(0, 0, W, H);
    gl.disable(gl.BLEND);
    gl.useProgram(blit);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, washTex);
    gl.uniform1i(uBlitTex, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(aPosBlit);
    gl.vertexAttribPointer(aPosBlit, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(aPosBlit);

    // 3 — fleurs et feuilles, nettes, pleine résolution
    gl.enable(gl.BLEND);
    gl.useProgram(blooms);
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
    gl.enableVertexAttribArray(aSeed);
    gl.vertexAttribPointer(aSeed, 4, gl.FLOAT, false, 0, 0);
    gl.uniform1f(uBloom.uTime, time);
    gl.uniform1f(uBloom.uScroll, scroll.smooth);
    gl.uniform1f(uBloom.uSize, dpr * (isMobile ? 1.0 : 1.15));
    gl.uniform1f(uBloom.uReveal, reveal);
    gl.uniform2f(uBloom.uWind, wind.x + (pointer.x - 0.5) * 0.25, wind.y);
    gl.uniform1f(uBloom.uBurst, burst);
    gl.drawArrays(gl.POINTS, 0, COUNT);
    gl.disableVertexAttribArray(aSeed);

    // résolution adaptative, relative à la fréquence propre de l'écran
    // (ignorée pendant les 5 premières secondes : le chargement de la page ralentit
    // tout le monde, ce n'est pas le signe d'un téléphone lent ; un seul palier, pas de va-et-vient)
    if (now - startedAt < 5000) return;
    baseDt = Math.min(baseDt * 1.002, dt);
    if (dt > baseDt * 1.7) { slowFrames++; fastFrames = 0; } else { fastFrames = Math.min(fastFrames + 1, 1e6); slowFrames = Math.max(0, slowFrames - 1); }
    if (slowFrames > 90 && quality > 0.7 && now - lastQualityChange > 8000) {
      quality = 0.7; slowFrames = 0; lastQualityChange = now; needResize = true;
    }
  }

  function loop(now) {
    if (!running) return;
    render(now);
    requestAnimationFrame(loop);
  }
  function play() {
    if (running) return;
    running = true;
    lastFrame = performance.now();
    requestAnimationFrame(loop);
  }
  function pause() { running = false; }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause(); else if (api.started) play();
  });
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); pause(); }, false);
  canvas.addEventListener("webglcontextrestored", function () { location.reload(); }, false);

  resize();
  render(performance.now());   // shaders compilés pendant l'ouverture

  api.ready = true;
  api.start = function () {
    api.started = true;
    startedAt = performance.now();
    revealTarget = 1;
    canvas.classList.add("is-on");
    play();
  };
  api.burst = function () { if (!reduceMotion) burstV += 4.5; };
})();
