/* ==========================================================================
   WebGL scene — ivory silk drapery + drifting rose petals.
   Plain WebGL 1 (no library), everything animated on the GPU:
   the CPU only updates a handful of uniforms per frame.
   Mobile: capped pixel ratio, adaptive resolution, paused when hidden.
   ========================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("scene");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 760;

  var api = { ready: false, start: function () {} };
  window.WeddingScene = api;

  var gl = null;
  try {
    gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
      preserveDrawingBuffer: false
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

  // Silk: domain-warped value noise → soft folds with a satin sheen.
  var SILK_FS = [
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
    "  for (int i = 0; i < 3; i++){ v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }",
    "  return v;",
    "}",

    "void main(){",
    "  vec2 uv = vUv;",
    "  float aspect = uRes.x / uRes.y;",
    "  vec2 p = vec2(uv.x * aspect, uv.y);",
    "  float t = uTime * 0.045;",
    "  p.y -= uScroll * 0.35;",
    "  p += (uPointer - 0.5) * 0.06;",

    // warp field
    "  vec2 q = vec2(fbm(p * 1.1 + vec2(0.0, t)), fbm(p * 1.1 + vec2(5.2, -t)));",
    // long diagonal folds, like draped satin
    "  float f = p.x * 2.2 + p.y * 1.4 + q.x * 2.6 + sin(p.y * 2.0 + t * 3.0) * 0.4;",
    "  float folds = sin(f * 3.14159 + t * 2.0);",
    "  float sheen = pow(0.5 + 0.5 * folds, 6.0);",
    "  float shade = 0.5 + 0.5 * sin(f * 3.14159 - 1.2 + t * 2.0);",

    "  vec3 ivory = vec3(0.969, 0.953, 0.925);",
    "  vec3 cream = vec3(0.945, 0.922, 0.882);",
    "  vec3 blush = vec3(0.925, 0.835, 0.812);",
    "  vec3 navy  = vec3(0.078, 0.161, 0.353);",

    "  vec3 col = mix(cream, ivory, shade);",
    "  col = mix(col, vec3(1.0, 0.995, 0.985), sheen * 0.55);",
    // blush bloom top-left, faint ink bottom-right
    "  float bloom = smoothstep(0.9, 0.0, distance(uv, vec2(0.12, 0.92 - uScroll * 0.08)));",
    "  col = mix(col, blush, bloom * 0.28);",
    "  float ink = smoothstep(0.35, 1.25, distance(uv, vec2(0.1, 0.9)));",
    "  col = mix(col, navy, ink * 0.06 * (1.0 - shade * 0.5));",

    // vignette + grain
    "  float vig = smoothstep(1.2, 0.35, length((uv - 0.5) * vec2(1.0, 1.15)));",
    "  col *= mix(0.94, 1.0, vig);",
    "  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.012;",

    "  col = mix(ivory, col, uReveal);",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  // Petals: one point sprite each, fully procedural in the vertex shader.
  var PETAL_VS = [
    "attribute vec4 aSeed;",
    "uniform float uTime;",
    "uniform float uScroll;",
    "uniform float uAspect;",
    "uniform float uSize;",
    "uniform float uReveal;",
    "uniform vec2 uWind;",
    "varying float vRot;",
    "varying float vFlip;",
    "varying float vTint;",
    "varying float vAlpha;",
    "void main(){",
    "  float depth = aSeed.w;",
    "  float speed = mix(0.035, 0.09, aSeed.y) * mix(0.7, 1.2, depth);",
    "  float span = 2.5;",
    "  float travel = aSeed.z * span + uTime * speed + uScroll * (0.25 + depth * 0.6);",
    "  float y = 1.25 - mod(travel, span);",
    "  float sway = sin(uTime * (0.35 + aSeed.y * 0.5) + aSeed.z * 6.2831) * 0.12;",
    "  float drift = sin(uTime * 0.13 + aSeed.x * 12.0) * 0.05;",
    "  float x = (aSeed.x * 2.0 - 1.0) * 1.15 + sway + drift + uWind.x * (0.4 + depth) * 0.35;",
    "  y += uWind.y * (0.4 + depth) * 0.15;",
    "  gl_Position = vec4(x, y, 0.0, 1.0);",
    "  gl_PointSize = mix(9.0, 30.0, depth * depth) * uSize;",
    "  vRot = aSeed.z * 12.0 + uTime * (aSeed.y - 0.5) * 1.6 + uWind.x * 2.0;",
    "  vFlip = sin(uTime * (0.6 + aSeed.y * 1.4) + aSeed.x * 20.0);",
    "  vTint = fract(aSeed.x * 7.31 + aSeed.y * 3.17);",
    "  vAlpha = mix(0.35, 0.95, depth) * uReveal;",
    "}"
  ].join("\n");

  var PETAL_FS = [
    "precision mediump float;",
    "varying float vRot;",
    "varying float vFlip;",
    "varying float vTint;",
    "varying float vAlpha;",
    "void main(){",
    "  vec2 p = gl_PointCoord * 2.0 - 1.0;",
    "  float c = cos(vRot), s = sin(vRot);",
    "  p = mat2(c, -s, s, c) * p;",
    // tumbling in 3D: squash one axis
    "  float flip = max(abs(vFlip), 0.18);",
    "  p.x /= flip;",
    // teardrop petal with a small notch at the top
    "  float w = 0.62 * (1.0 - 0.38 * p.y);",
    "  float d = length(vec2(p.x / w, p.y * 1.05));",
    "  float notch = 1.0 - smoothstep(0.12, 0.2, length(p - vec2(0.0, 1.02)));",
    "  float a = (1.0 - smoothstep(0.86, 1.0, d)) * (1.0 - notch);",
    "  if (a < 0.01) discard;",
    "  vec3 blush = vec3(0.945, 0.82, 0.8);",
    "  vec3 white = vec3(1.0, 0.985, 0.96);",
    "  vec3 col = mix(white, blush, smoothstep(0.35, 0.75, vTint));",
    "  col *= mix(0.86, 1.03, smoothstep(-1.0, 0.7, p.y));",        // darker at the base
    "  col *= 0.94 + 0.06 * sign(vFlip);",                          // front / back of petal
    "  col -= 0.025 * (1.0 - smoothstep(0.0, 0.05, abs(p.x))) * (1.0 - smoothstep(-0.8, 0.6, p.y));", // vein
    "  float alpha = a * vAlpha;",
    "  gl_FragColor = vec4(col * alpha, alpha);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }
  function program(vs, fs) {
    var v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var pr = gl.createProgram();
    gl.attachShader(pr, v);
    gl.attachShader(pr, f);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    return pr;
  }
  function uniforms(pr, names) {
    var u = {};
    names.forEach(function (n) { u[n] = gl.getUniformLocation(pr, n); });
    return u;
  }

  var silk = program(QUAD_VS, SILK_FS);
  var petals = program(PETAL_VS, PETAL_FS);
  if (!silk || !petals) {
    document.documentElement.classList.add("no-webgl");
    api.ready = true;
    return;
  }
  var uSilk = uniforms(silk, ["uRes", "uTime", "uScroll", "uReveal", "uPointer"]);
  var uPetal = uniforms(petals, ["uTime", "uScroll", "uAspect", "uSize", "uReveal", "uWind"]);

  var quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(silk, "aPos");

  var PETALS = isMobile ? 46 : 90;
  var seeds = new Float32Array(PETALS * 4);
  for (var i = 0; i < PETALS * 4; i++) seeds[i] = Math.random();
  var seedBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
  gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
  var aSeed = gl.getAttribLocation(petals, "aSeed");

  gl.disable(gl.DEPTH_TEST);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  /* ───────────── Sizing & adaptive quality ───────────── */

  var maxDpr = isMobile ? 1.5 : 1.75;
  var quality = 1;               // scaled down automatically on slow devices
  var W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, maxDpr) * quality;
    // use the large viewport so the canvas doesn't jump when mobile toolbars hide
    var w = window.innerWidth;
    var h = Math.max(window.innerHeight, document.documentElement.clientHeight);
    W = Math.max(1, Math.round(w * dpr));
    H = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    gl.viewport(0, 0, W, H);
    if (reduceMotion) render(performance.now());
  }

  var resizeTimer = 0;
  var lastWidth = window.innerWidth;
  window.addEventListener("resize", function () {
    // ignore height-only changes from the mobile URL bar
    if (isMobile && Math.abs(window.innerWidth - lastWidth) < 2) return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }, { passive: true });
  window.addEventListener("orientationchange", function () { setTimeout(resize, 250); });

  /* ───────────── Interaction ───────────── */

  var pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  var wind = { x: 0, y: 0, vx: 0, vy: 0 };
  var scroll = { y: 0, smooth: 0, last: 0 };
  var lastTouch = null;

  window.addEventListener("pointermove", function (e) {
    pointer.tx = e.clientX / window.innerWidth;
    pointer.ty = 1 - e.clientY / window.innerHeight;
  }, { passive: true });

  window.addEventListener("touchstart", function (e) {
    var t = e.touches[0];
    lastTouch = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  window.addEventListener("touchmove", function (e) {
    if (!lastTouch) return;
    var t = e.touches[0];
    wind.vx += (t.clientX - lastTouch.x) / window.innerWidth * 1.6;
    lastTouch = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  // Gentle tilt parallax where the browser allows it without a permission prompt.
  window.addEventListener("deviceorientation", function (e) {
    if (e.gamma == null) return;
    pointer.tx = 0.5 + Math.max(-30, Math.min(30, e.gamma)) / 60 * 0.6;
    pointer.ty = 0.5 + Math.max(-30, Math.min(30, (e.beta || 45) - 45)) / 60 * 0.6;
  }, { passive: true });

  window.addEventListener("scroll", function () {
    scroll.y = window.scrollY / Math.max(1, window.innerHeight);
  }, { passive: true });

  /* ───────────── Loop ───────────── */

  var running = false;
  var reveal = 0, revealTarget = 0;
  var t0 = performance.now();
  var lastFrame = t0;
  var slowFrames = 0, fastFrames = 0;

  function render(now) {
    var time = (now - t0) / 1000;
    var dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    // smoothing
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    var prev = scroll.smooth;
    scroll.smooth += (scroll.y - scroll.smooth) * 0.08;
    var scrollVel = scroll.smooth - prev;
    wind.vy -= scrollVel * 2.2;
    wind.x += wind.vx; wind.y += wind.vy;
    wind.vx *= 0.9; wind.vy *= 0.9;
    wind.x *= 0.96; wind.y *= 0.95;
    reveal += (revealTarget - reveal) * (reduceMotion ? 1 : 0.025);

    gl.disable(gl.BLEND);
    gl.useProgram(silk);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(uSilk.uRes, W, H);
    gl.uniform1f(uSilk.uTime, time);
    gl.uniform1f(uSilk.uScroll, scroll.smooth);
    gl.uniform1f(uSilk.uReveal, reveal);
    gl.uniform2f(uSilk.uPointer, pointer.x, pointer.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(aPos);

    gl.enable(gl.BLEND);
    gl.useProgram(petals);
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
    gl.enableVertexAttribArray(aSeed);
    gl.vertexAttribPointer(aSeed, 4, gl.FLOAT, false, 0, 0);
    gl.uniform1f(uPetal.uTime, time);
    gl.uniform1f(uPetal.uScroll, scroll.smooth);
    gl.uniform1f(uPetal.uAspect, W / H);
    gl.uniform1f(uPetal.uSize, dpr * (isMobile ? 1.05 : 1.2));
    gl.uniform1f(uPetal.uReveal, reveal);
    gl.uniform2f(uPetal.uWind, wind.x + (pointer.x - 0.5) * 0.3, wind.y);
    gl.drawArrays(gl.POINTS, 0, PETALS);
    gl.disableVertexAttribArray(aSeed);

    // adaptive resolution: drop quality if we keep missing ~45fps, recover when smooth
    if (dt > 0.024) { slowFrames++; fastFrames = 0; } else { fastFrames++; slowFrames = Math.max(0, slowFrames - 1); }
    if (slowFrames > 40 && quality > 0.55) { quality -= 0.15; slowFrames = 0; resize(); }
    else if (fastFrames > 600 && quality < 1) { quality = Math.min(1, quality + 0.1); fastFrames = 0; resize(); }
  }

  function loop(now) {
    if (!running) return;
    render(now);
    requestAnimationFrame(loop);
  }

  function play() {
    if (running || reduceMotion) return;
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
  render(performance.now());   // warm up shaders during the preloader

  api.ready = true;
  api.start = function () {
    api.started = true;
    revealTarget = 1;
    canvas.classList.add("is-on");
    if (reduceMotion) { reveal = 1; render(performance.now()); }
    else play();
  };
})();
