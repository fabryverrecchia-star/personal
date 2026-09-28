/* ==========================================================================
   Guest gallery — masonry grid of every photo, video and voice note,
   a swipeable full-screen viewer, and a quiet live refresh so the wall
   fills up during the reception.
   ========================================================================== */
(function () {
  "use strict";

  var PAGE = 30;
  var REFRESH_MS = 45000;

  function apiSource() {
    return {
      load: function (offset, limit) {
        return fetch("api/gallery.php?offset=" + offset + "&limit=" + limit, { cache: "no-store" })
          .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
      },
      canDownload: true
    };
  }

  function fmtDur(s) {
    if (!s) return "";
    s = Math.round(s);
    return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
  }

  // Deterministic decorative waveform for a voice note tile.
  function bars(id, n) {
    var h = 0, out = [];
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    for (var k = 0; k < n; k++) {
      h = (h * 1103515245 + 12345) >>> 0;
      var env = Math.sin(Math.PI * (k + 0.5) / n);
      out.push(0.18 + 0.82 * env * ((h >>> 16) % 100) / 100);
    }
    return out;
  }
  function barsHTML(id, n) {
    return bars(id, n).map(function (v) { return '<i style="height:' + Math.round(v * 100) + '%"></i>'; }).join("");
  }

  function Gallery(opts) {
    this.o = opts;
    this.root = opts.root;
    this.grid = opts.root.querySelector(".mason");
    this.more = opts.root.querySelector(".gallery__more");
    this.empty = opts.root.querySelector(".gallery__empty");
    this.countEl = opts.root.querySelector(".gallery__count");
    this.source = window.WEDDING_GALLERY_SOURCE || apiSource();
    this.items = [];
    this.byId = {};
    this.tiles = {};
    this.total = 0;
    this.next = 0;
    this.cols = 0;
    this.loading = false;

    var self = this;
    this.more.addEventListener("click", function () { self.loadMore(); });
    window.addEventListener("resize", function () {
      clearTimeout(self._rz);
      self._rz = setTimeout(function () { self.layout(); }, 150);
    }, { passive: true });

    // lazy video previews: only fetch metadata when a tile gets near the screen
    this.io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var v = e.target.querySelector("video[data-src]");
        if (v) { v.src = v.getAttribute("data-src"); v.removeAttribute("data-src"); }
        self.io.unobserve(e.target);
      });
    }, { rootMargin: "400px 0px" }) : null;

    this.lb = new Lightbox(this);
    this.loadMore();

    // live wall: pick up new memories while the gallery is on screen
    setInterval(function () {
      if (document.hidden || !self.isNearViewport()) return;
      self.refresh();
    }, REFRESH_MS);
  }

  Gallery.prototype.isNearViewport = function () {
    var r = this.root.getBoundingClientRect();
    return r.top < window.innerHeight * 1.5 && r.bottom > -window.innerHeight * 0.5;
  };

  Gallery.prototype.loadMore = function () {
    var self = this;
    if (this.loading || this.next == null) return;
    this.loading = true;
    this.root.classList.add("is-loading");
    this.source.load(this.next, PAGE).then(function (res) {
      if (res.disabled) { self.root.hidden = true; return; }
      (res.items || []).forEach(function (it) { self.addItem(it, false); });
      self.total = res.total || self.items.length;
      self.next = res.next;
      self.layout();
    }).catch(function () {
      self.next = self.next || 0;
    }).then(function () {
      self.loading = false;
      self.root.classList.remove("is-loading");
      self.updateMeta();
    });
  };

  Gallery.prototype.refresh = function () {
    var self = this;
    this.source.load(0, PAGE).then(function (res) {
      var fresh = (res.items || []).filter(function (it) { return !self.byId[it.id]; });
      if (!fresh.length) return;
      fresh.reverse().forEach(function (it) { self.addItem(it, true); });
      self.total = Math.max(res.total || 0, self.items.length);
      if (self.next != null) self.next += fresh.length;
      self.layout();
      self.updateMeta();
    }).catch(function () {});
  };

  /** Add one item (from the server, or just uploaded on this phone). */
  Gallery.prototype.add = function (it) {
    if (!it || this.byId[it.id]) return;
    this.addItem(it, true);
    this.total++;
    if (this.next != null) this.next++;
    this.layout();
    this.updateMeta();
  };

  Gallery.prototype.addItem = function (it, atTop) {
    this.byId[it.id] = it;
    if (atTop) this.items.unshift(it); else this.items.push(it);
    this.tiles[it.id] = this.makeTile(it, atTop);
  };

  Gallery.prototype.ratio = function (it) {
    if (it.kind === "audio") return 1.12;
    if (it.w && it.h) return Math.max(0.5, Math.min(1.9, it.h / it.w));
    return it.kind === "video" ? 16 / 9 : 1.25;
  };

  Gallery.prototype.makeTile = function (it, fresh) {
    var self = this;
    var t = this.o.t;
    var el = document.createElement("button");
    el.type = "button";
    el.className = "tile tile--" + it.kind;
    el.style.setProperty("--r", String(this.ratio(it)));
    var who = it.guest ? it.guest : t("gallery.aGuest");
    el.setAttribute("aria-label", t("gallery.kind." + it.kind) + " · " + who);

    var inner = "";
    if (it.kind === "photo") {
      inner = '<img alt="" loading="lazy" decoding="async">';
    } else if (it.kind === "video") {
      inner = '<video muted playsinline preload="metadata"></video>' +
        '<span class="tile__badge"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>' +
        (it.duration ? fmtDur(it.duration) : "") + "</span>";
    } else {
      inner = '<span class="tile__voice">' +
        '<span class="tile__play"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg></span>' +
        '<span class="tile__bars">' + barsHTML(it.id, 22) + "</span>" +
        '<span class="script tile__vtitle"></span>' +
        '<span class="tile__vdur">' + fmtDur(it.duration) + "</span></span>";
    }
    el.innerHTML = inner + '<span class="tile__who"></span>';
    el.querySelector(".tile__who").textContent = who;
    if (it.kind === "audio") el.querySelector(".tile__vtitle").textContent = t("gallery.voiceNote");

    if (it.kind === "photo") {
      var img = el.querySelector("img");
      img.onerror = function () {               // e.g. HEIC outside Safari
        if (img.dataset.fallback || !it.thumb) { el.classList.add("is-broken"); img.remove(); return; }
        img.dataset.fallback = "1";
        img.src = it.src;
      };
      img.onload = function () { el.classList.add("is-loaded"); };
      img.src = it.thumb || it.src;
    } else if (it.kind === "video") {
      var v = el.querySelector("video");
      var src = it.src + (it.src.indexOf("blob:") === 0 ? "" : "#t=0.1");
      v.addEventListener("loadeddata", function () { el.classList.add("is-loaded"); });
      if (this.io) { v.setAttribute("data-src", src); this.io.observe(el); } else v.src = src;
    }

    el.addEventListener("click", function () { self.lb.open(self.items.indexOf(it)); });
    return el;
  };

  Gallery.prototype.layout = function () {
    var w = this.grid.clientWidth || this.root.clientWidth;
    var cols = w < 520 ? 2 : w < 900 ? 3 : 4;
    if (cols !== this.cols) {
      this.cols = cols;
      this.grid.innerHTML = "";
      this.colEls = [];
      for (var c = 0; c < cols; c++) {
        var col = document.createElement("div");
        col.className = "mason__col";
        this.grid.appendChild(col);
        this.colEls.push(col);
      }
    }
    // shortest-column-first, in order (newest first)
    var heights = this.colEls.map(function () { return 0; });
    var self = this;
    var placed = this.colEls.map(function () { return []; });
    this.items.forEach(function (it) {
      var best = 0;
      for (var i = 1; i < heights.length; i++) if (heights[i] < heights[best] - 0.01) best = i;
      placed[best].push(self.tiles[it.id]);
      heights[best] += self.ratio(it) + 0.08;
    });
    placed.forEach(function (tiles, i) {
      var col = self.colEls[i];
      tiles.forEach(function (tile, k) {
        if (col.children[k] !== tile) col.insertBefore(tile, col.children[k] || null);
      });
      while (col.children.length > tiles.length) col.removeChild(col.lastChild);
    });
    if (window.WeddingMotion) window.WeddingMotion.gallery(this.grid);
  };

  Gallery.prototype.updateMeta = function () {
    var t = this.o.t, n = this.total;
    this.empty.hidden = n > 0 || this.loading;
    this.more.hidden = this.next == null || !this.items.length;
    this.countEl.textContent = n === 1 ? t("gallery.countOne") : t("gallery.count", { n: n });
    this.countEl.hidden = !n;
  };

  Gallery.prototype.retranslate = function () {
    var self = this;
    this.items.forEach(function (it) {
      var el = self.tiles[it.id];
      var who = it.guest || self.o.t("gallery.aGuest");
      el.querySelector(".tile__who").textContent = who;
      var vt = el.querySelector(".tile__vtitle");
      if (vt) vt.textContent = self.o.t("gallery.voiceNote");
    });
    this.updateMeta();
  };

  /* ───────────── Full-screen viewer ───────────── */

  function Lightbox(gallery) {
    this.g = gallery;
    var el = this.el = document.getElementById("lightbox");
    this.stage = el.querySelector(".lb__stage");
    this.who = el.querySelector(".lb__who");
    this.when = el.querySelector(".lb__when");
    this.dl = el.querySelector(".lb__dl");
    this.idx = -1;
    var self = this;
    el.querySelector(".lb__close").addEventListener("click", function () { self.close(); });
    el.querySelector(".lb__prev").addEventListener("click", function () { self.go(-1); });
    el.querySelector(".lb__next").addEventListener("click", function () { self.go(1); });
    el.addEventListener("click", function (e) { if (e.target === el || e.target === self.stage) self.close(); });
    document.addEventListener("keydown", function (e) {
      if (el.hidden) return;
      if (e.key === "Escape") self.close();
      else if (e.key === "ArrowLeft") self.go(-1);
      else if (e.key === "ArrowRight") self.go(1);
    });
    var sx = 0, sy = 0;
    el.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) self.go(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) self.close();
    }, { passive: true });
    if (!gallery.source.canDownload) this.dl.hidden = true;
  }

  Lightbox.prototype.open = function (i) {
    this.lastFocus = document.activeElement;
    this.el.hidden = false;
    document.documentElement.classList.add("lb-open");
    requestAnimationFrame(function () { this.el.classList.add("is-open"); }.bind(this));
    this.show(i);
    this.el.querySelector(".lb__close").focus({ preventScroll: true });
  };

  Lightbox.prototype.close = function () {
    var self = this;
    this.stop();
    this.el.classList.remove("is-open");
    document.documentElement.classList.remove("lb-open");
    setTimeout(function () { self.el.hidden = true; self.stage.innerHTML = ""; }, 350);
    if (this.lastFocus) this.lastFocus.focus({ preventScroll: true });
  };

  Lightbox.prototype.stop = function () {
    var m = this.stage.querySelector("video, audio");
    if (m) m.pause();
  };

  Lightbox.prototype.go = function (d) {
    var n = this.g.items.length;
    if (!n) return;
    this.show((this.idx + d + n) % n, d);
  };

  Lightbox.prototype.show = function (i, dir) {
    var it = this.g.items[i];
    if (!it) return;
    this.stop();
    this.idx = i;
    var t = this.g.o.t;
    var box = document.createElement("div");
    box.className = "lb__item" + (dir ? (dir > 0 ? " from-right" : " from-left") : "");

    if (it.kind === "photo") {
      var img = document.createElement("img");
      img.alt = "";
      if (it.thumb) {                   // sharp thumbnail first, full photo swaps in
        img.src = it.thumb;
        var full = new Image();
        full.onload = function () { img.src = it.src; };
        full.src = it.src;
      } else img.src = it.src;
      box.appendChild(img);
    } else if (it.kind === "video") {
      var v = document.createElement("video");
      v.controls = true;
      v.playsInline = true;
      v.autoplay = true;
      v.src = it.src;
      box.appendChild(v);
    } else {
      box.classList.add("lb__item--voice");
      box.innerHTML = '<span class="script lb__vt"></span><span class="lb__bars">' + barsHTML(it.id, 40) + "</span>";
      box.querySelector(".lb__vt").textContent = t("gallery.voiceNote");
      var a = document.createElement("audio");
      a.controls = true;
      a.autoplay = true;
      a.src = it.src;
      box.appendChild(a);
    }
    this.stage.innerHTML = "";
    this.stage.appendChild(box);

    this.who.textContent = it.guest || t("gallery.aGuest");
    var d = new Date(it.time);
    this.when.textContent = isNaN(d) ? "" : d.toLocaleString(document.documentElement.lang || undefined, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    this.dl.href = it.src + (it.src.indexOf("blob:") === 0 ? "" : "&dl=1");
    var many = this.g.items.length > 1;
    this.el.querySelector(".lb__prev").hidden = this.el.querySelector(".lb__next").hidden = !many;
  };

  window.WeddingGallery = Gallery;
})();
