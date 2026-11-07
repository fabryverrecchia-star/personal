/* ==========================================================================
   Visionneuse plein écran — utilisée par l'album (index.html) et l'espace
   privé (admin.php).
   · la photo est toujours ajustée à l'écran, quelle que soit sa taille
   · ordinateur : clic = zoom à l'endroit cliqué / re-clic = dézoom,
     molette = zoom progressif, glisser = se déplacer, flèches, +/−, Échap
   · mobile : pincer pour zoomer, double tap, glisser à gauche/droite pour
     changer de photo, glisser vers le bas pour fermer
   LouViewer.open(items, index) — items : [{ kind, src, thumb, guest, dl }]
   ========================================================================== */
(function () {
  "use strict";

  var MAX_ZOOM = 5;
  // jusqu'au vrai pixel de la photo (pleine résolution), au moins ×5
  function maxZoom() { return natW && fitW ? Math.max(MAX_ZOOM, natW / fitW) : MAX_ZOOM; }
  var root, frame, img, video, cap, count, btnZoom, btnDl, msg, hd;
  var items = [], index = 0;
  var fitW = 0, fitH = 0, natW = 0, natH = 0;
  var s = 1, x = 0, y = 0;                       // zoom & position (px, depuis le centre)
  var pointers = {}, gesture = null, lastTap = 0, animTimer = 0;
  var lastFocus = null;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function build() {
    root = el("div", "lv");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Photo en grand");
    root.hidden = true;
    root.innerHTML =
      '<div class="lv__frame"></div>' +
      '<p class="lv__msg" hidden></p>' +
      '<div class="lv__top">' +
        '<span class="lv__count"></span>' +
        '<span class="lv__tools">' +
          '<button type="button" class="lv__btn lv__zoom" aria-label="Zoomer">' +
            '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5M10.5 8v5M8 10.5h5"/></svg></button>' +
          '<a class="lv__btn lv__dl" aria-label="Télécharger" download hidden>' +
            '<svg viewBox="0 0 24 24"><path d="M12 4v11m-5-5 5 5 5-5M5 19.5h14"/></svg></a>' +
          '<button type="button" class="lv__btn lv__close" aria-label="Fermer">' +
            '<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button>' +
        "</span>" +
      "</div>" +
      '<button type="button" class="lv__nav lv__prev" aria-label="Photo précédente"><svg viewBox="0 0 24 24"><path d="m14.5 5-7 7 7 7"/></svg></button>' +
      '<button type="button" class="lv__nav lv__next" aria-label="Photo suivante"><svg viewBox="0 0 24 24"><path d="m9.5 5 7 7-7 7"/></svg></button>' +
      '<p class="lv__cap"></p>' +
      '<p class="lv__hd" hidden></p>' +
      '<p class="lv__hint">Cliquez pour zoomer · molette · glissez pour vous déplacer</p>';
    document.body.appendChild(root);

    frame = root.querySelector(".lv__frame");
    cap = root.querySelector(".lv__cap");
    count = root.querySelector(".lv__count");
    btnZoom = root.querySelector(".lv__zoom");
    btnDl = root.querySelector(".lv__dl");
    msg = root.querySelector(".lv__msg");
    hd = root.querySelector(".lv__hd");

    root.querySelector(".lv__close").addEventListener("click", close);
    root.querySelector(".lv__prev").addEventListener("click", function () { go(-1); });
    root.querySelector(".lv__next").addEventListener("click", function () { go(1); });
    btnZoom.addEventListener("click", function () {
      if (s > 1.01) reset(true); else zoomAt(zoomTarget(), window.innerWidth / 2, window.innerHeight / 2, true);
    });

    frame.addEventListener("pointerdown", onDown);
    frame.addEventListener("pointermove", onMove);
    frame.addEventListener("pointerup", onUp);
    frame.addEventListener("pointercancel", onUp);
    frame.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", function () { if (!root.hidden) { layout(); clamp(); apply(); } });
    document.addEventListener("keydown", onKey);
  }

  /* ───────────── Ouverture / fermeture ───────────── */

  function open(list, i) {
    if (!root) build();
    items = list || [];
    if (!items.length) return;
    lastFocus = document.activeElement;
    root.hidden = false;
    document.documentElement.classList.add("lv-open");
    show(i || 0);
    root.querySelector(".lv__close").focus({ preventScroll: true });
  }

  function close() {
    if (!root || root.hidden) return;
    root.hidden = true;
    frame.innerHTML = "";
    img = video = null;
    document.documentElement.classList.remove("lv-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function go(d) {
    if (items.length < 2) return;
    show(index + d);
  }

  function show(i) {
    index = (i + items.length) % items.length;
    var it = items[index];
    frame.innerHTML = "";
    msg.hidden = true;
    img = video = null;
    s = 1; x = 0; y = 0;
    root.classList.toggle("is-single", items.length < 2);
    root.classList.remove("is-zoomed");
    count.textContent = items.length > 1 ? (index + 1) + " / " + items.length : "";
    hd.hidden = true;
    cap.textContent = it.guest ? "par " + it.guest : "";
    btnDl.hidden = !it.dl;
    if (it.dl) btnDl.href = it.dl;

    if (it.kind === "video") {
      root.classList.add("is-video");
      video = el("video", "lv__media");
      video.controls = true;
      video.playsInline = true;
      video.autoplay = true;
      video.src = it.src;
      frame.appendChild(video);
      return;
    }
    root.classList.remove("is-video");

    img = el("img", "lv__media");
    img.alt = it.guest ? "Photo partagée par " + it.guest : "Photo";
    img.draggable = false;
    img.decoding = "async";
    var shown = img;
    // la miniature (déjà en cache) s'affiche tout de suite, l'original la remplace dès qu'il est prêt
    if (it.thumb && it.thumb !== it.src) {
      img.src = it.thumb;
      var full = new Image();
      full.onload = function () { if (img === shown) { img.src = it.src; measure(full.naturalWidth, full.naturalHeight); } };
      full.src = it.src;
    } else {
      img.src = it.src;
    }
    img.onload = function () { if (img === shown && !natW) measure(img.naturalWidth, img.naturalHeight); };
    img.onerror = function () {
      if (img !== shown) return;
      img.remove();
      msg.hidden = false;
      msg.innerHTML = "Cette photo ne peut pas s'afficher dans ce navigateur (format iPhone HEIC)." +
        (it.dl ? '<br><a href="' + it.dl + '">La télécharger</a>' : "");
    };
    natW = natH = 0;
    frame.appendChild(img);
    if (img.complete && img.naturalWidth) measure(img.naturalWidth, img.naturalHeight);
    preload(index + 1);
    preload(index - 1);
  }

  function preload(i) {
    var it = items[(i + items.length) % items.length];
    if (it && it.kind !== "video") { var p = new Image(); p.src = it.thumb || it.src; }
  }

  /* ───────────── Ajustement à l'écran ───────────── */

  function measure(w, h) {
    natW = w; natH = h;
    layout();
    apply();
  }

  function box() {
    var small = window.innerWidth < 700;
    return {
      w: window.innerWidth - (small ? 16 : 140),
      h: window.innerHeight - (small ? 130 : 150)
    };
  }

  // taille de la photo « ajustée » (entière à l'écran, jamais agrandie au-delà de sa taille réelle ×1,5)
  function layout() {
    if (!img || !natW) return;
    var b = box();
    var k = Math.min(b.w / natW, b.h / natH, 1.5);
    fitW = Math.round(natW * k);
    fitH = Math.round(natH * k);
    img.style.width = fitW + "px";
    img.style.height = fitH + "px";
    img.style.marginLeft = -fitW / 2 + "px";
    img.style.marginTop = -fitH / 2 + "px";
    btnZoom.hidden = zoomTarget() <= 1.05 && !(items[index] && items[index].full);
  }

  // zoom au clic : jusqu'à la taille réelle de la photo (au moins ×2,5, au plus ×5)
  function zoomTarget() {
    if (!natW || !fitW) return 2.5;
    // avec l'original disponible, on peut zoomer jusqu'à sa taille réelle
    var real = items[index] && items[index].full ? 0 : natW / fitW;
    return Math.min(maxZoom(), Math.max(2.5, real));
  }

  function clamp() {
    var mx = Math.max(0, (fitW * s - window.innerWidth) / 2 + 20);
    var my = Math.max(0, (fitH * s - window.innerHeight) / 2 + 20);
    if (fitW * s <= window.innerWidth) mx = 0;
    if (fitH * s <= window.innerHeight) my = 0;
    x = Math.max(-mx, Math.min(mx, x));
    y = Math.max(-my, Math.min(my, y));
  }

  // Zoom : on charge l'original (pleine résolution) à la place de la version écran.
  function loadFull() {
    var it = items[index];
    if (!img || !it || !it.full || img.dataset.full) return;
    img.dataset.full = "1";
    var shown = img, big = new Image();
    hd.hidden = false;
    hd.textContent = "Chargement en pleine résolution…";
    big.onload = function () {
      if (img !== shown) return;
      img.src = it.full;
      natW = big.naturalWidth; natH = big.naturalHeight;     // le zoom peut aller jusqu'au vrai pixel
      btnZoom.hidden = false;
      hd.textContent = "Pleine résolution · " + natW + " × " + natH;
      setTimeout(function () { if (img === shown) hd.hidden = true; }, 2600);
    };
    big.onerror = function () { if (img === shown) hd.hidden = true; };
    big.src = it.full;
  }

  function apply(animate) {
    if (!img) return;
    if (s > 1.01) loadFull();
    img.style.transition = animate ? "transform .38s cubic-bezier(.22,.8,.2,1)" : "none";
    img.style.transform = "translate3d(" + x + "px," + y + "px,0) scale(" + s + ")";
    root.classList.toggle("is-zoomed", s > 1.01);
    btnZoom.setAttribute("aria-label", s > 1.01 ? "Dézoomer" : "Zoomer");
    clearTimeout(animTimer);
    if (animate) animTimer = setTimeout(function () { if (img) img.style.transition = "none"; }, 400);
  }

  // zoome en gardant le point (cx, cy) de l'écran sous le curseur / les doigts
  function zoomAt(ns, cx, cy, animate) {
    ns = Math.max(1, Math.min(maxZoom(), ns));
    var ox = cx - window.innerWidth / 2, oy = cy - window.innerHeight / 2;
    x = ox - (ox - x) * ns / s;
    y = oy - (oy - y) * ns / s;
    s = ns;
    if (s === 1) { x = 0; y = 0; }
    clamp();
    apply(animate);
  }

  function reset(animate) { s = 1; x = 0; y = 0; apply(animate); }

  /* ───────────── Souris, doigts, clavier ───────────── */

  function onWheel(e) {
    if (!img || !natW) return;
    e.preventDefault();
    var d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(s * Math.exp(-d * (e.ctrlKey ? 0.01 : 0.0022)), e.clientX, e.clientY, false);
  }

  function onDown(e) {
    if (e.target.closest && e.target.closest("video")) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    try { frame.setPointerCapture(e.pointerId); } catch (err) { /* */ }
    var ids = Object.keys(pointers);
    if (ids.length === 1) {
      gesture = { type: "pan", sx: e.clientX, sy: e.clientY, x0: x, y0: y, moved: false, t: Date.now(), onImg: e.target === img };
    } else if (ids.length === 2 && img) {
      var a = pointers[ids[0]], b = pointers[ids[1]];
      gesture = { type: "pinch", d0: dist(a, b), s0: s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, x0: x, y0: y, moved: true };
    }
  }

  function onMove(e) {
    if (!pointers[e.pointerId] || !gesture) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pointers);
    if (gesture.type === "pinch" && ids.length >= 2) {
      var a = pointers[ids[0]], b = pointers[ids[1]];
      var ns = Math.max(1, Math.min(maxZoom(), gesture.s0 * dist(a, b) / gesture.d0));
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      var ox = gesture.cx - window.innerWidth / 2, oy = gesture.cy - window.innerHeight / 2;
      s = ns;
      x = ox - (ox - gesture.x0) * ns / gesture.s0 + (mx - gesture.cx);
      y = oy - (oy - gesture.y0) * ns / gesture.s0 + (my - gesture.cy);
      clamp();
      apply(false);
      return;
    }
    if (gesture.type !== "pan") return;
    var dx = e.clientX - gesture.sx, dy = e.clientY - gesture.sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) gesture.moved = true;
    if (!gesture.moved) return;
    if (s > 1.01) {
      x = gesture.x0 + dx; y = gesture.y0 + dy;
      clamp();
      apply(false);
      root.classList.add("is-dragging");
    } else if (img) {
      // pas zoomé : la photo suit le doigt (changer de photo / fermer)
      img.style.transition = "none";
      img.style.transform = "translate3d(" + dx + "px," + Math.max(0, dy) * (Math.abs(dy) > Math.abs(dx) ? 1 : 0) + "px,0)";
      root.style.setProperty("--lv-bg", String(1 - Math.min(0.6, Math.max(0, dy) / 600)));
    }
  }

  function onUp(e) {
    if (!pointers[e.pointerId]) return;
    delete pointers[e.pointerId];
    root.classList.remove("is-dragging");
    var g = gesture;
    if (Object.keys(pointers).length) {             // il reste un doigt après un pincement
      var id = Object.keys(pointers)[0];
      gesture = { type: "pan", sx: pointers[id].x, sy: pointers[id].y, x0: x, y0: y, moved: true };
      return;
    }
    gesture = null;
    root.style.removeProperty("--lv-bg");
    if (!g) return;
    if (g.type === "pinch") { if (s < 1.05) reset(true); return; }

    var dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    if (g.moved) {
      if (s <= 1.01) {
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { go(dx < 0 ? 1 : -1); return; }
        if (dy > 110 && Math.abs(dy) > Math.abs(dx)) { close(); return; }
        apply(true);                                 // revient en place
      }
      return;
    }
    // simple clic / tap
    if (!img || !natW) { if (!g.onImg) close(); return; }
    var touch = e.pointerType === "touch";
    if (touch) {
      var now = Date.now();
      if (now - lastTap < 300) { lastTap = 0; toggleAt(e.clientX, e.clientY); return; }
      lastTap = now;
      return;                                        // un seul tap sur mobile : ne fait rien (évite les fermetures accidentelles)
    }
    if (!g.onImg && s <= 1.01) { close(); return; }  // clic sur le fond noir = fermer
    toggleAt(e.clientX, e.clientY);
  }

  function toggleAt(cx, cy) {
    if (s > 1.01) reset(true); else zoomAt(zoomTarget(), cx, cy, true);
  }

  function onKey(e) {
    if (!root || root.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "+" || e.key === "=") zoomAt(s * 1.5, window.innerWidth / 2, window.innerHeight / 2, true);
    else if (e.key === "-") zoomAt(s / 1.5, window.innerWidth / 2, window.innerHeight / 2, true);
    else if (e.key === "0") reset(true);
  }

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) || 1; }

  window.LouViewer = { open: open, close: close };
})();
