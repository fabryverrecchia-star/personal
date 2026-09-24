/* ==========================================================================
   Romolo & Remo — moteur WebGL léger (sans dépendance)
   - Particules : le pictogramme se compose à partir de ses tracés SVG
   - Louve : marche procédurale (pattes articulées) pilotée par le scroll
   - Images : plans synchronisés au DOM, révélation + courbure selon la vitesse
   Tout est dessiné sur un seul canvas fixe, calé sur les rectangles DOM.
   ========================================================================== */
(function () {
  "use strict";

  var PI = Math.PI;

  /* ------------------------------------------------------------------ utils */
  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error("Shader: " + log);
    }
    return s;
  }
  function program(gl, vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("Link: " + gl.getProgramInfoLog(p));
    var n, i, info, u = {}, a = {};
    n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (i = 0; i < n; i++) { info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
    n = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (i = 0; i < n; i++) { info = gl.getActiveAttrib(p, i); a[info.name] = gl.getAttribLocation(p, info.name); }
    return { p: p, u: u, a: a };
  }
  function hexToRgb(hex) {
    var n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Dessine les tracés vectoriels du brandbook dans un canvas 2D (aucun
     chargement réseau : fonctionne aussi en file://). */
  function rasterize(def, height, pad) {
    var scale = height / def.h;
    var padPx = Math.round(pad * height);
    var c = document.createElement("canvas");
    c.width = Math.ceil(def.w * scale) + padPx * 2;
    c.height = Math.ceil(def.h * scale) + padPx * 2;
    var ctx = c.getContext("2d");
    ctx.setTransform(scale, 0, 0, scale, padPx, padPx);
    ctx.fillStyle = "#fff";
    def.paths.forEach(function (p) { ctx.fill(new Path2D(p.d), p.rule === "evenodd" ? "evenodd" : "nonzero"); });
    return { canvas: c, ctx: ctx, padX: padPx / c.width, padY: padPx / c.height };
  }

  /* --------------------------------------------------------------- shaders */
  var IMG_VS = [
    "attribute vec2 aPos;",
    "uniform vec4 uRect; uniform vec2 uView; uniform vec2 uVel;",
    "varying vec2 vUv;",
    "void main(){",
    "  vec2 px = uRect.xy + aPos * uRect.zw;",
    "  px.y += sin(aPos.x * 3.14159265) * uVel.y;",
    "  px.x += sin(aPos.y * 3.14159265) * uVel.x;",
    "  vUv = aPos;",
    "  gl_Position = vec4(px.x / uView.x * 2.0 - 1.0, 1.0 - px.y / uView.y * 2.0, 0.0, 1.0);",
    "}"
  ].join("\n");

  var IMG_FS = [
    "precision highp float;",
    "uniform sampler2D uTex; uniform vec2 uSize; uniform vec2 uImg;",
    "uniform float uReveal; uniform float uGray; uniform float uTime; uniform vec2 uVel;",
    "varying vec2 vUv;",
    "vec2 cover(vec2 uv){",
    "  float rs = uSize.x / uSize.y; float ri = uImg.x / uImg.y;",
    "  vec2 s = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);",
    "  return (uv - 0.5) * s + 0.5;",
    "}",
    "void main(){",
    "  float r = uReveal;",
    "  float er = 1.0 - pow(1.0 - r, 3.0);",
    "  float wave = sin(vUv.x * 5.0 + uTime * 1.4) * 0.05 * sin(r * 3.14159265);",
    "  float t = 1.0 - r * 1.12;",
    "  float m = smoothstep(t, t + 0.05, vUv.y + wave);",
    "  vec2 uv = cover(vUv);",
    "  uv = (uv - 0.5) * (1.0 - 0.2 * (1.0 - er)) + 0.5;",
    "  vec2 sh = uVel * 0.0012 / max(uSize, vec2(1.0));",
    "  float cr = texture2D(uTex, uv + sh * 18.0).r;",
    "  vec3 col = texture2D(uTex, uv).rgb;",
    "  float cb = texture2D(uTex, uv - sh * 18.0).b;",
    "  col = vec3(cr, col.g, cb);",
    "  float g = dot(col, vec3(0.299, 0.587, 0.114));",
    "  col = mix(col, vec3(g), uGray);",
    "  gl_FragColor = vec4(col * m, m);",
    "}"
  ].join("\n");

  var PT_VS = [
    "attribute vec2 aT; attribute vec3 aR;",
    "uniform vec4 uRect; uniform vec2 uView; uniform vec2 uMouse;",
    "uniform float uAssemble; uniform float uDisperse; uniform float uTime; uniform float uSize;",
    "varying float vA;",
    "void main(){",
    "  vec2 c = uRect.xy + 0.5 * uRect.zw;",
    "  vec2 target = uRect.xy + aT * uRect.zw;",
    "  float s = aR.z;",
    "  float ang = aR.x * 6.2831853;",
    "  float rad = (0.25 + aR.y * 0.85) * max(uView.x, uView.y);",
    "  vec2 start = c + vec2(cos(ang), sin(ang)) * rad;",
    "  float t = clamp(uAssemble * 1.6 - s * 0.6, 0.0, 1.0);",
    "  float e = 1.0 - pow(1.0 - t, 3.0);",
    "  float sw = (1.0 - e) * 2.4;",
    "  vec2 d0 = start - c;",
    "  vec2 sp = c + vec2(cos(sw) * d0.x - sin(sw) * d0.y, sin(sw) * d0.x + cos(sw) * d0.y);",
    "  vec2 p = mix(sp, target, e);",
    "  float h = uRect.w;",
    "  p += vec2(sin(uTime * 1.3 + s * 40.0), cos(uTime * 1.1 + s * 31.0)) * h * 0.0016;",
    "  vec2 dm = p - uMouse; float dl = length(dm);",
    "  float f = smoothstep(h * 0.16, 0.0, dl);",
    "  p += (dm / max(dl, 0.001)) * f * h * 0.05;",
    "  float d = uDisperse; float dd = d * d;",
    "  vec2 dir = normalize(target - c + vec2(0.0001));",
    "  p += dir * (0.25 + s) * h * 1.4 * dd;",
    "  p += vec2(sin(s * 57.0 + uTime * 0.6) * h * 0.25, -h * (0.35 + s * 1.3)) * dd;",
    "  vA = (0.25 + 0.75 * e) * (1.0 - smoothstep(0.55, 1.0, d));",
    "  gl_PointSize = uSize * (1.0 + (1.0 - e) * 1.6 + d * 1.5);",
    "  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);",
    "}"
  ].join("\n");

  var PT_FS = [
    "precision highp float;",
    "uniform vec3 uColor; uniform float uAlpha;",
    "varying float vA;",
    "void main(){",
    "  vec2 q = gl_PointCoord - 0.5;",
    "  float a = smoothstep(0.5, 0.32, length(q)) * vA * uAlpha;",
    "  gl_FragColor = vec4(uColor * a, a);",
    "}"
  ].join("\n");

  /* Louve : chaque patte est un calque tourné autour de sa hanche/épaule,
     masqué dans l'espace source pour éviter tout déchirement. */
  var WOLF_FS = [
    "precision highp float;",
    "uniform sampler2D uTex; uniform vec2 uPad; uniform float uAsp;",
    "uniform float uPhase; uniform float uAmp; uniform float uTime; uniform vec3 uColor;",
    "varying vec2 vUv;",
    "vec2 toTex(vec2 w){ return uPad + w * (1.0 - 2.0 * uPad); }",
    "float tex(vec2 w){",
    "  vec2 t = toTex(w);",
    "  if (t.x < 0.0 || t.y < 0.0 || t.x > 1.0 || t.y > 1.0) return 0.0;",
    "  return texture2D(uTex, t).a;",
    "}",
    "vec2 rotW(vec2 w, vec2 piv, float a){",
    "  vec2 q = vec2((w.x - piv.x) * uAsp, w.y - piv.y);",
    "  float c = cos(a), s = sin(a);",
    "  q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);",
    "  return vec2(piv.x + q.x / uAsp, piv.y + q.y);",
    "}",
    "float legZone(vec2 w){ return smoothstep(0.695, 0.765, w.y); }",
    "float bx(vec2 w){ return 0.665 + (w.y - 0.75) * 0.25; }",
    "float m1(vec2 w){ return legZone(w) * (1.0 - smoothstep(0.335, 0.355, w.x)); }",
    "float m2(vec2 w){ return legZone(w) * smoothstep(0.335, 0.355, w.x) * (1.0 - smoothstep(0.53, 0.55, w.x)); }",
    "float m3(vec2 w){ float b = bx(w); return legZone(w) * smoothstep(0.53, 0.55, w.x) * (1.0 - smoothstep(b - 0.008, b + 0.008, w.x)); }",
    "float m4(vec2 w){ float b = bx(w); return legZone(w) * smoothstep(b - 0.008, b + 0.008, w.x); }",
    "float tailZ(vec2 w){ return (1.0 - legZone(w)) * (1.0 - smoothstep(0.24, 0.30, w.x)) * smoothstep(0.52, 0.58, w.y); }",
    "void main(){",
    "  vec2 w = (vUv - uPad) / (1.0 - 2.0 * uPad);",
    "  float ph = uPhase;",
    "  float bob = (abs(sin(ph)) - 0.5) * 0.014 * uAmp;",
    "  w.y += bob;",
    /* corps + étendard qui flotte + queue */
    "  vec2 wb = w;",
    "  float flag = smoothstep(0.345, 0.40, w.x) * (1.0 - smoothstep(0.26, 0.31, w.y));",
    "  wb.y += sin((w.x - 0.34) * 13.0 - uTime * 4.2 - ph * 0.5) * 0.011 * (w.x - 0.34) * 2.2 * flag;",
    "  float body = tex(wb) * (1.0 - legZone(wb)) * (1.0 - tailZ(wb));",
    "  float kt = 1.0 - smoothstep(0.05, 0.28, w.x);",
    "  vec2 wt = rotW(w, vec2(0.30, 0.62), sin(ph * 0.5 + uTime * 1.6) * 0.08 * kt * (0.35 + 0.65 * uAmp));",
    "  float tail = tex(wt) * tailZ(wt);",
    /* pattes : trot en diagonale */
    "  float sA = sin(ph), sB = sin(ph + 3.14159265);",
    /* l'angle croît progressivement sous la hanche : raccord invisible avec le corps */
    "  float k = smoothstep(0.70, 0.80, w.y) * uAmp;",
    "  vec2 w1 = rotW(w, vec2(0.30, 0.70), (0.10 + 0.24 * sA) * k);",
    "  vec2 w2 = rotW(w, vec2(0.42, 0.70), (0.26 * sB) * k);",
    "  vec2 w3 = rotW(w, vec2(0.635, 0.70), (0.26 * sA) * k);",
    "  vec2 w4 = rotW(w, vec2(0.72, 0.70), (-0.08 + 0.24 * sB) * k);",
    "  float l1 = tex(w1) * m1(w1);",
    "  float l2 = tex(w2) * m2(w2);",
    "  float l3 = tex(w3) * m3(w3);",
    "  float l4 = tex(w4) * m4(w4);",
    /* les masques forment une partition : on additionne (pas de voile au raccord) */
    "  float a = min(body + tail + l1 + l2 + l3 + l4, 1.0);",
    "  gl_FragColor = vec4(uColor * a, a);",
    "}"
  ].join("\n");

  var QUAD_VS = [
    "attribute vec2 aPos;",
    "uniform vec4 uRect; uniform vec2 uView;",
    "varying vec2 vUv;",
    "void main(){",
    "  vec2 px = uRect.xy + aPos * uRect.zw;",
    "  vUv = aPos;",
    "  gl_Position = vec4(px.x / uView.x * 2.0 - 1.0, 1.0 - px.y / uView.y * 2.0, 0.0, 1.0);",
    "}"
  ].join("\n");

  /* -------------------------------------------------------------- moteur */
  function Engine(canvas) {
    var gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: "high-performance" }) ||
             canvas.getContext("experimental-webgl", { alpha: true, premultipliedAlpha: true });
    if (!gl) throw new Error("WebGL indisponible");
    this.gl = gl;
    this.canvas = canvas;
    this.images = [];
    this.particles = null;
    this.wolf = null;
    this.lost = false;
    this.time = 0;

    this.pImg = program(gl, IMG_VS, IMG_FS);
    this.pPt = program(gl, PT_VS, PT_FS);
    this.pWolf = program(gl, QUAD_VS, WOLF_FS);

    /* grille subdivisée pour la courbure des images */
    var seg = 24, verts = [], idx = [], x, y;
    for (y = 0; y <= seg; y++) for (x = 0; x <= seg; x++) verts.push(x / seg, y / seg);
    for (y = 0; y < seg; y++) for (x = 0; x < seg; x++) {
      var i = y * (seg + 1) + x;
      idx.push(i, i + 1, i + seg + 1, i + 1, i + seg + 2, i + seg + 1);
    }
    this.gridVB = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVB);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    this.gridIB = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.gridIB);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    this.gridCount = idx.length;

    this.quadVB = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVB);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    var self = this;
    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      self.lost = true;
      if (self.onLost) self.onLost();
    });

    this.resize();
  }

  Engine.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 820 ? 1.75 : 2);
    this.dpr = dpr;
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    var w = Math.round(this.vw * dpr), h = Math.round(this.vh * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
  };

  Engine.prototype.texture = function (source, linear) {
    var gl = this.gl;
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    } catch (err) {
      gl.deleteTexture(t);
      return null; /* image « tainted » (file://) : on garde l'image DOM */
    }
    return t;
  };

  /* ---------------------------------------------------------- images */
  Engine.prototype.addImage = function (img, box, opts) {
    var self = this;
    var item = { img: img, box: box, tex: null, reveal: 0, vel: [0, 0], last: null, gray: opts && opts.gray ? 1 : 0, visible: false };
    function load() {
      if (self.lost) return;
      var t = self.texture(img);
      if (!t) return;
      item.tex = t;
      item.w = img.naturalWidth; item.h = img.naturalHeight;
      box.classList.add("is-gl");
      if (opts && opts.onReady) opts.onReady(item);
    }
    var ready = function () {
      if (img.decode) img.decode().then(load, load); else load();
    };
    if (img.complete && img.naturalWidth) ready();
    else img.addEventListener("load", ready, { once: true });
    this.images.push(item);
    return item;
  };

  /* ---------------------------------------------------------- particules */
  Engine.prototype.addParticles = function (el, def, opts) {
    var gl = this.gl;
    var r = rasterize(def, 420, 0);
    var W = r.canvas.width, H = r.canvas.height;
    var data = r.ctx.getImageData(0, 0, W, H).data;
    var filled = [];
    for (var i = 0; i < W * H; i++) if (data[i * 4 + 3] > 110) filled.push(i);
    var count = Math.min(opts.count, filled.length);
    var arr = new Float32Array(count * 5);
    for (var k = 0; k < count; k++) {
      var j = Math.floor(Math.random() * filled.length);
      var pix = filled[j];
      filled[j] = filled[filled.length - 1]; filled.pop();
      var px = pix % W, py = (pix / W) | 0;
      arr[k * 5] = (px + Math.random()) / W;
      arr[k * 5 + 1] = (py + Math.random()) / H;
      arr[k * 5 + 2] = Math.random();
      arr[k * 5 + 3] = Math.pow(Math.random(), 0.7);
      arr[k * 5 + 4] = Math.random();
    }
    var vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    this.particles = {
      el: el, vb: vb, count: count, color: hexToRgb(opts.color),
      size: opts.size, assemble: 0, disperse: 0, alpha: 1,
      mouse: [-1e5, -1e5], mouseT: [-1e5, -1e5]
    };
    return this.particles;
  };

  /* ---------------------------------------------------------- louve */
  Engine.prototype.addWolf = function (el, def, opts) {
    var pad = 0.14;
    var r = rasterize(def, opts.res || 1024, pad);
    var t = this.texture(r.canvas);
    if (!t) return null;
    this.wolf = {
      el: el, tex: t, padX: r.padX, padY: r.padY, pad: pad,
      asp: def.w / def.h, color: hexToRgb(opts.color),
      phase: 0, amp: 0, lastX: null
    };
    el.classList.add("is-gl");
    return this.wolf;
  };

  /* ---------------------------------------------------------- rendu */
  function visible(rc, vw, vh, m) {
    return rc.bottom > -m && rc.top < vh + m && rc.right > -m && rc.left < vw + m;
  }

  Engine.prototype.render = function (dt) {
    if (this.lost) return;
    var gl = this.gl, vw = this.vw, vh = this.vh;
    this.time += dt;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    /* images */
    var P = this.pImg;
    var imgBound = false;
    for (var i = 0; i < this.images.length; i++) {
      var it = this.images[i];
      var rc = it.box.getBoundingClientRect();
      /* vitesse propre à chaque plan (fonctionne en vertical comme en horizontal) */
      if (it.last) {
        var dx = rc.left - it.last[0], dy = rc.top - it.last[1];
        it.vel[0] = lerp(it.vel[0], clamp(-dx * 0.6, -70, 70), 0.12);
        it.vel[1] = lerp(it.vel[1], clamp(-dy * 0.6, -70, 70), 0.12);
      }
      it.last = [rc.left, rc.top];
      it.visible = visible(rc, vw, vh, 0);
      if (!it.tex || !visible(rc, vw, vh, 80) || it.reveal <= 0.001) continue;
      if (!imgBound) {
        gl.useProgram(P.p);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVB);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.gridIB);
        gl.enableVertexAttribArray(P.a.aPos);
        gl.vertexAttribPointer(P.a.aPos, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(P.u.uView, vw, vh);
        gl.uniform1f(P.u.uTime, this.time);
        gl.uniform1i(P.u.uTex, 0);
        imgBound = true;
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, it.tex);
      gl.uniform4f(P.u.uRect, rc.left, rc.top, rc.width, rc.height);
      gl.uniform2f(P.u.uSize, rc.width, rc.height);
      gl.uniform2f(P.u.uImg, it.w, it.h);
      gl.uniform2f(P.u.uVel, it.vel[0], it.vel[1]);
      gl.uniform1f(P.u.uReveal, it.reveal);
      gl.uniform1f(P.u.uGray, it.gray);
      gl.drawElements(gl.TRIANGLES, this.gridCount, gl.UNSIGNED_SHORT, 0);
    }
    if (imgBound) gl.disableVertexAttribArray(P.a.aPos);

    /* louve */
    var W = this.wolf;
    if (W) {
      var wr = W.el.getBoundingClientRect();
      var x = wr.left;
      if (W.lastX !== null) {
        var d = x - W.lastX;
        var stride = Math.max(wr.width * 0.62, 1);
        W.phase += (d / stride) * PI;
        W.amp = lerp(W.amp, clamp(Math.abs(d) / Math.max(wr.width * 0.012, 0.5), 0, 1), 0.08);
      }
      W.lastX = x;
      if (visible(wr, vw, vh, wr.width)) {
        var Q = this.pWolf;
        /* rectangle agrandi : le plan inclut la marge du raster */
        var ew = wr.width / (1 - 2 * W.padX), eh = wr.height / (1 - 2 * W.padY);
        gl.useProgram(Q.p);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVB);
        gl.enableVertexAttribArray(Q.a.aPos);
        gl.vertexAttribPointer(Q.a.aPos, 2, gl.FLOAT, false, 0, 0);
        gl.uniform4f(Q.u.uRect, wr.left - (ew - wr.width) / 2, wr.top - (eh - wr.height) / 2, ew, eh);
        gl.uniform2f(Q.u.uView, vw, vh);
        gl.uniform2f(Q.u.uPad, W.padX, W.padY);
        gl.uniform1f(Q.u.uAsp, W.asp);
        gl.uniform1f(Q.u.uPhase, W.phase);
        gl.uniform1f(Q.u.uAmp, W.amp);
        gl.uniform1f(Q.u.uTime, this.time);
        gl.uniform3fv(Q.u.uColor, W.color);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, W.tex);
        gl.uniform1i(Q.u.uTex, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.disableVertexAttribArray(Q.a.aPos);
      }
    }

    /* particules */
    var S = this.particles;
    if (S && S.alpha > 0.001) {
      var pr = S.el.getBoundingClientRect();
      if (visible(pr, vw, vh, vh)) {
        S.mouse[0] = lerp(S.mouse[0], S.mouseT[0], 0.12);
        S.mouse[1] = lerp(S.mouse[1], S.mouseT[1], 0.12);
        var T = this.pPt;
        gl.useProgram(T.p);
        gl.bindBuffer(gl.ARRAY_BUFFER, S.vb);
        gl.enableVertexAttribArray(T.a.aT);
        gl.enableVertexAttribArray(T.a.aR);
        gl.vertexAttribPointer(T.a.aT, 2, gl.FLOAT, false, 20, 0);
        gl.vertexAttribPointer(T.a.aR, 3, gl.FLOAT, false, 20, 8);
        gl.uniform4f(T.u.uRect, pr.left, pr.top, pr.width, pr.height);
        gl.uniform2f(T.u.uView, vw, vh);
        gl.uniform2f(T.u.uMouse, S.mouse[0], S.mouse[1]);
        gl.uniform1f(T.u.uAssemble, S.assemble);
        gl.uniform1f(T.u.uDisperse, S.disperse);
        gl.uniform1f(T.u.uTime, this.time);
        gl.uniform1f(T.u.uSize, S.size * this.dpr * Math.max(pr.height / 420, 0.7));
        gl.uniform1f(T.u.uAlpha, S.alpha);
        gl.uniform3fv(T.u.uColor, S.color);
        gl.drawArrays(gl.POINTS, 0, S.count);
        gl.disableVertexAttribArray(T.a.aT);
        gl.disableVertexAttribArray(T.a.aR);
      }
    }
  };

  window.RRGL = {
    create: function (canvas) {
      try { return new Engine(canvas); }
      catch (e) { if (window.console) console.warn("[RR] WebGL désactivé :", e.message); return null; }
    }
  };
})();
