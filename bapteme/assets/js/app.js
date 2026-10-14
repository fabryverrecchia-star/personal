/* ==========================================================================
   Baptême de Lou — infos, compte à rebours, ouverture animée, livre d'or,
   envoi des photos & vidéos, album partagé.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var INFO = window.LOU || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function get(path) {
    return path.split(".").reduce(function (o, k) { return o && o[k] != null ? o[k] : ""; }, INFO);
  }

  var toastEl = $("#toast"), toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 3600);
  }

  /* ───────────── Infos (assets/js/infos.js) ───────────── */

  var MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var dateParts = String(INFO.date || "2026-10-31").split("-").map(Number);
  var eventDay = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  INFO.dateLongue = "le " + eventDay.getDate() + (eventDay.getDate() === 1 ? "er " : " ") + MONTHS[eventDay.getMonth()] + " " + eventDay.getFullYear();

  $$("[data-fill]").forEach(function (el) {
    var v = String(get(el.getAttribute("data-fill"))).trim();
    if (v) el.textContent = v; else el.hidden = true;
  });
  // titre du programme : « samedi 31 octobre »
  var progTitle = $("#infos .title");
  if (progTitle) progTitle.innerHTML = '<span class="i">' + DAYS[eventDay.getDay()] + "</span> " + eventDay.getDate() + " " + MONTHS[eventDay.getMonth()];

  // cérémonie sans lieu ni horaire : une phrase plutôt qu'un vide
  ["ceremonie", "repas"].forEach(function (key) {
    var d = INFO[key] || {};
    if (!d.lieu && !d.adresse && !d.heure) {
      var step = $('[data-maps="' + key + '"]').closest(".step");
      var p = document.createElement("p");
      p.className = "step__todo";
      p.textContent = "Le lieu et l'horaire vous seront communiqués très bientôt.";
      step.querySelector("h3").after(p);
    }
  });

  function mapsLinks(key) {
    var d = INFO[key] || {};
    var q = [d.lieu, d.adresse].filter(Boolean).join(", ");
    if (!d.adresse) return "";
    var e = encodeURIComponent(q);
    var main = isIOS ? "https://maps.apple.com/?q=" + e : "https://www.google.com/maps/search/?api=1&query=" + e;
    var pin = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>';
    return '<a class="btn btn--sm" href="' + main + '" target="_blank" rel="noopener">' + pin + "Itinéraire</a>" +
      '<a class="btn btn--sm btn--ghost" href="https://waze.com/ul?q=' + e + '&navigate=yes" target="_blank" rel="noopener">Waze</a>';
  }
  $$("[data-maps]").forEach(function (el) { el.innerHTML = mapsLinks(el.getAttribute("data-maps")); });

  // « 10h30 » → [10, 30]
  function parseTime(s) {
    var m = String(s || "").match(/(\d{1,2})\s*[h:.]\s*(\d{2})?/i);
    return m ? [Number(m[1]), Number(m[2] || 0)] : null;
  }
  function eventAt(key) {
    var t = parseTime((INFO[key] || {}).heure);
    return t ? new Date(eventDay.getFullYear(), eventDay.getMonth(), eventDay.getDate(), t[0], t[1]) : null;
  }

  /* ───────────── Ajouter à l'agenda (.ics) ───────────── */

  function icsDate(d) {
    function p(n) { return ("0" + n).slice(-2); }
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "T" + p(d.getHours()) + p(d.getMinutes()) + "00";
  }
  function icsText(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/[,;]/g, "\\$&").replace(/\n/g, "\\n"); }
  function vevent(uid, title, key, hours) {
    var d = INFO[key] || {};
    var start = eventAt(key);
    var lines = ["BEGIN:VEVENT", "UID:" + uid + "@bapteme-lou", "DTSTAMP:" + icsDate(new Date()) ];
    if (start) {
      lines.push("DTSTART:" + icsDate(start), "DTEND:" + icsDate(new Date(start.getTime() + hours * 3600e3)));
    } else {
      var y = eventDay.getFullYear(), m = ("0" + (eventDay.getMonth() + 1)).slice(-2), dd = ("0" + eventDay.getDate()).slice(-2);
      var next = new Date(eventDay.getTime() + 864e5);
      lines.push("DTSTART;VALUE=DATE:" + y + m + dd, "DTEND;VALUE=DATE:" + icsDate(next).slice(0, 8));
    }
    lines.push("SUMMARY:" + icsText(title));
    var loc = [d.lieu, d.adresse].filter(Boolean).join(", ");
    if (loc) lines.push("LOCATION:" + icsText(loc));
    lines.push("DESCRIPTION:" + icsText("Le site : " + location.href.split("#")[0]), "END:VEVENT");
    return lines;
  }
  $("#addCal").addEventListener("click", function () {
    var name = INFO.prenom || "Lou";
    var ev = vevent("ceremonie", "Baptême de " + name, "ceremonie", 1.5);
    if ((INFO.repas || {}).heure) ev = ev.concat(vevent("repas", "Repas · baptême de " + name + " · " + (INFO.repas.lieu || ""), "repas", 3));
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bapteme de Lou//FR", "CALSCALE:GREGORIAN"].concat(ev, ["END:VCALENDAR"]).join("\r\n");
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bapteme-" + name.toLowerCase() + ".ics";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  });

  /* ───────────── Compte à rebours ───────────── */

  var countEl = $("#count"), todayEl = $("#today");
  var target = eventAt("ceremonie") || eventDay;
  function renderCount() {
    var now = new Date();
    var sameDay = now.getFullYear() === eventDay.getFullYear() && now.getMonth() === eventDay.getMonth() && now.getDate() === eventDay.getDate();
    var diff = target - now;
    if (sameDay || diff <= 0) {
      countEl.hidden = true;
      todayEl.hidden = false;
      todayEl.textContent = sameDay ? "C'est aujourd'hui !" : "Merci d'avoir partagé ce jour avec nous";
      document.documentElement.classList.toggle("is-today", sameDay);
      return;
    }
    var m = Math.floor(diff / 60000);
    $('[data-c="j"]').textContent = Math.floor(m / 1440);
    $('[data-c="h"]').textContent = Math.floor(m / 60) % 24;
    $('[data-c="m"]').textContent = m % 60;
  }
  renderCount();
  setInterval(renderCount, 15000);

  /* ───────────── Ouverture & apparitions ───────────── */

  var scene = window.LouScene || { start: function () {}, burst: function () {} };
  var loader = $("#loader");

  function startReveals() {
    if (!("IntersectionObserver" in window)) { $$("[data-reveal]").forEach(function (el) { el.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$("[data-reveal]").forEach(function (el) { io.observe(el); });
  }

  // L'ouverture est jouée en CSS (style.css) : ici on ne fait que suivre son minutage.
  function intro() {
    document.body.classList.add("is-loading");
    setTimeout(function () { scene.start(); }, 2900);
    setTimeout(function () {
      if (loader) loader.remove();
      document.body.classList.remove("is-loading");
    }, 4100);
    setTimeout(startReveals, 4300);
  }
  intro();

  // le cœur de l'église pivote très légèrement avec le défilement
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY, vh = window.innerHeight;
      if (y < vh * 1.2 && !reduceMotion) {
        var k = y / vh;
        $(".crest").style.transform = "translateY(" + (k * 60).toFixed(1) + "px) scale(" + (1 - k * 0.08).toFixed(3) + ")";
        $(".crest").style.opacity = String(Math.max(0, 1 - k * 0.9));
      }
      dock.classList.toggle("is-on", y > vh * 0.45);
      markDock();
    });
  }, { passive: true });

  /* ───────────── Barre du bas ───────────── */

  var dock = $("#dock");
  var dockLinks = $$("a", dock);
  function markDock() {
    var mid = window.innerHeight * 0.45, here = null;
    dockLinks.forEach(function (a) {
      var sec = $(a.getAttribute("href"));
      if (!sec) return;
      var r = sec.getBoundingClientRect();
      if (r.top < mid && r.bottom > mid) here = a;
    });
    dockLinks.forEach(function (a) { a.classList.toggle("is-here", a === here); });
  }

  /* ───────────── Mode aperçu (sans serveur PHP) ───────────── */

  var demo = location.protocol === "file:";
  var serverReady = demo ? Promise.resolve(null) : fetch("api/status.php", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { return j && j.ok ? j : null; })
    .catch(function () { return null; });
  serverReady.then(function (info) {
    if (!info) {
      demo = true;
      ["#book", ".drop"].forEach(function (s) {
        var p = document.createElement("p");
        p.className = "demo-note";
        p.textContent = "Aperçu : ici rien n'est envoyé. Une fois le site en ligne, tout arrive dans l'espace privé.";
        $(s).appendChild(p);
      });
    }
    initGallery(info);
  });

  /* ───────────── Prénom partagé entre les formulaires ───────────── */

  var nameInputs = $$(".js-name");
  var saved = store("lou_name");
  nameInputs.forEach(function (inp) {
    if (saved) inp.value = saved;
    inp.addEventListener("input", function () {
      nameInputs.forEach(function (o) { if (o !== inp) o.value = inp.value; });
      store("lou_name", inp.value.trim());
    });
  });
  function guestName() { return (nameInputs[0].value || "").trim(); }

  /* ───────────── Livre d'or ───────────── */

  var form = $("#book"), statusEl = $("#bookStatus"), sendBtn = $("#bookSend");
  var textarea = form.elements.message;
  textarea.addEventListener("input", function () { $("#msgCount").textContent = textarea.value.length; });

  function setStatus(msg, isError) {
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("is-error", !!isError);
  }
  function thanks() {
    form.hidden = true;
    $("#thanks").hidden = false;
    scene.burst();
    var g = window.gsap;
    if (g && !reduceMotion) {
      g.fromTo(".thanks__dove", { x: -80, y: 30, opacity: 0, rotation: -10 }, { x: 0, y: 0, opacity: 1, rotation: 0, duration: 1.2, ease: "power3.out" });
      g.fromTo(".thanks__big, #thanks p, #bookAgain", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .9, stagger: .1, delay: .3, ease: "power3.out" });
    }
  }
  $("#bookAgain").addEventListener("click", function () {
    textarea.value = "";
    $("#msgCount").textContent = "0";
    $("#thanks").hidden = true;
    form.hidden = false;
    setStatus("");
    textarea.focus();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim();
    var message = textarea.value.trim();
    $$(".field", form).forEach(function (f) { f.classList.remove("is-invalid"); });
    if (!name) form.elements.name.closest(".field").classList.add("is-invalid");
    if (!message) textarea.closest(".field").classList.add("is-invalid");
    if (!name || !message) { setStatus("Votre prénom et un petit mot, s'il vous plaît.", true); return; }

    sendBtn.disabled = true;
    setStatus("Envoi…");
    if (demo) { setTimeout(function () { sendBtn.disabled = false; setStatus(""); thanks(); }, 700); return; }

    fetch("api/message.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, message: message, lang: "fr", website: form.elements.website.value })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; });
    }).then(function (res) {
      if (res.body && res.body.ok) { setStatus(""); thanks(); return; }
      var code = res.body && res.body.code;
      setStatus(code === "rate_limited" ? "Beaucoup de messages d'un coup ! Réessayez dans un moment."
        : "Le message n'est pas parti. Réessayez dans un instant." + (code ? " (" + code + ")" : ""), true);
    }).catch(function () {
      setStatus("Pas de connexion. Votre message est toujours là : réessayez dans un instant.", true);
    }).then(function () { sendBtn.disabled = false; });
  });

  /* ───────────── Photos & vidéos ───────────── */

  var MAX_BYTES = 2048 * 1024 * 1024;           // même valeur que max_file_mb dans api/config.php
  var queue = $("#queue"), totalBox = $("#total"), totalBar = $("#totalBar"), totalText = $("#totalText");
  var dockRing = $("#dockRing");
  var rows = {};
  var uploader = null;
  var wakeLock = null;

  function fmtBytes(b) {
    if (b < 1048576) return Math.max(1, Math.round(b / 1024)) + " Ko";
    if (b < 1073741824) return (b / 1048576).toFixed(1).replace(".", ",") + " Mo";
    return (b / 1073741824).toFixed(2).replace(".", ",") + " Go";
  }
  function isMedia(f) { return /^(image|video)\//.test(f.type) || /\.(jpe?g|png|gif|webp|heic|heif|avif|mp4|mov|m4v|webm|3gp)$/i.test(f.name); }
  function isVideo(f) { return /^video\//.test(f.type) || /\.(mp4|mov|m4v|webm|3gp)$/i.test(f.name); }

  function rowFor(item) {
    var li = rows[item.key];
    if (li) return li;
    li = document.createElement("li");
    li.className = "q";
    li.innerHTML = '<div class="q__thumb"></div><div class="q__body"><p class="q__name"></p><p class="q__meta"></p><div class="q__bar"><i></i></div></div><button class="q__state" type="button" aria-label="Annuler">×</button>';
    li.querySelector(".q__name").textContent = item.file.name || "photo";
    var th = li.querySelector(".q__thumb");
    if (!/heic|heif/i.test(item.file.type + item.file.name)) {
      var url = URL.createObjectURL(item.file);
      item.localUrl = url;
      if (isVideo(item.file)) {
        var v = document.createElement("video");
        v.muted = true; v.playsInline = true; v.preload = "metadata"; v.src = url + "#t=0.1";
        th.appendChild(v);
      } else {
        var img = new Image();
        img.decoding = "async"; img.src = url; img.alt = "";
        th.appendChild(img);
      }
    }
    li.querySelector(".q__state").addEventListener("click", function () {
      if (item.status === "error" && uploader) uploader.retry(item);
      else if (item.status !== "done" && uploader) uploader.cancel(item);
    });
    queue.prepend(li);
    rows[item.key] = li;
    return li;
  }
  function paintRow(item) {
    var li = rowFor(item);
    var pct = item.file.size ? Math.min(1, item.sent / item.file.size) : 0;
    li.classList.toggle("is-done", item.status === "done");
    li.classList.toggle("is-error", item.status === "error");
    li.querySelector(".q__bar i").style.transform = "scaleX(" + (item.status === "done" ? 1 : pct) + ")";
    var meta = li.querySelector(".q__meta"), btn = li.querySelector(".q__state");
    if (item.status === "done") { meta.textContent = "Bien reçue · " + fmtBytes(item.file.size); btn.textContent = "✓"; btn.setAttribute("aria-label", "Envoyée"); }
    else if (item.status === "error") {
      var why = window.LouUploader && window.LouUploader.describe ? window.LouUploader.describe(item.error) : "";
      meta.textContent = (item.error && item.error.code === "bad_type" ? "Format non accepté" : "Échec de l'envoi") + (why ? " · " + why : "") + " · toucher ↻";
      btn.textContent = "↻"; btn.setAttribute("aria-label", "Réessayer");
    }
    else if (item.status === "cancelled") { li.remove(); delete rows[item.key]; }
    else if (item.status === "queued") meta.textContent = "En attente · " + fmtBytes(item.file.size);
    else meta.textContent = Math.round(pct * 100) + " % · " + fmtBytes(item.file.size);
  }
  function updateTotals(st) {
    totalBox.hidden = !st.count;
    totalBar.style.transform = "scaleX(" + st.pct + ")";
    totalText.textContent = st.done === st.count
      ? (st.count > 1 ? st.count + " fichiers envoyés. Merci !" : "Envoyé. Merci !")
      : "Envoi " + (st.done + 1) + " sur " + st.count + " · " + Math.round(st.pct * 100) + " %";
    var busy = st.done < st.count;
    dockRing.hidden = !busy;
    dockRing.style.setProperty("--p", st.pct.toFixed(3));
  }

  function lockScreen(on) {
    if (on && !wakeLock && navigator.wakeLock) {
      navigator.wakeLock.request("screen").then(function (l) {
        wakeLock = l;
        l.addEventListener("release", function () { wakeLock = null; });
      }).catch(function () {});
    } else if (!on && wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
  }

  // Aperçu sans serveur : même interface, envoi simulé.
  function DemoUploader(opts) { this.o = opts; this.items = []; }
  DemoUploader.prototype.add = function (files, guest) {
    var self = this;
    Array.prototype.forEach.call(files, function (file, i) {
      var item = { file: file, guest: guest, sent: 0, status: "queued" };
      self.items.push(item);
      self.o.onAdd(item);
      var speed = 900000 + Math.random() * 1500000;
      setTimeout(function tick() {
        if (item.status === "cancelled") return;
        item.status = "uploading";
        item.sent = Math.min(file.size, item.sent + speed / 8);
        if (item.sent >= file.size) {
          item.status = "done";
          self.o.onUpdate(item);
          self.o.onDone({ result: { id: "demo" + Math.random(), kind: isVideo(file) ? "video" : "photo", guest: guest, src: URL.createObjectURL(file), thumb: null } });
        } else { self.o.onUpdate(item); setTimeout(tick, 120); }
        self.o.onProgress();
        if (!self.busy()) self.o.onIdle();
      }, 300 + i * 200);
    });
  };
  DemoUploader.prototype.cancel = function (item) { item.status = "cancelled"; this.o.onUpdate(item); this.o.onProgress(); };
  DemoUploader.prototype.retry = function () {};
  DemoUploader.prototype.busy = function () { return this.items.some(function (i) { return i.status === "queued" || i.status === "uploading"; }); };
  DemoUploader.prototype.stats = window.LouUploader ? window.LouUploader.prototype.stats : function () { return { count: 0, done: 0, pct: 0 }; };

  var keySeq = 0;
  function makeUploader() {
    var opts = {
      onAdd: function (item) { item.key = item.key || "k" + (++keySeq); paintRow(item); },
      onUpdate: function (item) { item.key = item.key || "k" + (++keySeq); paintRow(item); },
      onProgress: function () { updateTotals(uploader.stats()); },
      onDone: function (item) { if (item.result) galleryAdd(item.result); },
      onIdle: function () {
        lockScreen(false);
        var st = uploader.stats();
        if (st.count && st.done === st.count) { toast("Merci ! Vos souvenirs sont bien arrivés."); scene.burst(); }
      }
    };
    return demo || !window.LouUploader ? new DemoUploader(opts) : new window.LouUploader(opts);
  }

  var pick = $("#pick");
  pick.addEventListener("change", function () {
    var files = Array.prototype.filter.call(pick.files || [], isMedia);
    var tooBig = files.filter(function (f) { return f.size > MAX_BYTES; });
    files = files.filter(function (f) { return f.size <= MAX_BYTES; });
    pick.value = "";
    if (tooBig.length) toast(tooBig.length + " fichier(s) trop lourd(s), ignoré(s).");
    if (!files.length) return;
    if (!guestName()) {
      var first = nameInputs[0];
      first.closest(".field").classList.add("is-invalid");
      first.focus();
      toast("Indiquez votre prénom, puis choisissez à nouveau vos photos.");
      return;
    }
    nameInputs[0].closest(".field").classList.remove("is-invalid");
    if (!uploader) uploader = makeUploader();
    uploader.add(files, guestName());
    lockScreen(true);
  });
  window.addEventListener("beforeunload", function (e) {
    if (uploader && uploader.busy()) { e.preventDefault(); e.returnValue = ""; }
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && uploader && uploader.busy()) lockScreen(true);
  });

  /* ───────────── Album partagé ───────────── */

  var galSec = $("#galerie"), galEl = $("#gallery"), galMore = $("#galMore"), galCount = $("#galCount");
  var gal = { items: [], ids: {}, next: 0, total: 0, live: false, loading: false };

  function tile(it, atTop) {
    if (gal.ids[it.id] || it.kind === "audio") return;
    gal.ids[it.id] = true;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tile";
    var ratio = it.w && it.h ? ' style="aspect-ratio:' + it.w + "/" + it.h + '"' : "";
    if (it.kind === "video") {
      b.innerHTML = '<video src="' + esc(it.src) + '#t=0.1" preload="metadata" muted playsinline' + ratio + '></video><span class="tile__play"></span>';
    } else {
      b.innerHTML = '<img src="' + esc(it.thumb || it.src) + '" alt="" loading="lazy" decoding="async"' + ratio + ">";
    }
    if (it.guest) b.insertAdjacentHTML("beforeend", '<span class="tile__who">' + esc(it.guest) + "</span>");
    b.addEventListener("click", function () { openViewer(gal.items.indexOf(it)); });
    if (atTop) { gal.items.unshift(it); galEl.prepend(b); } else { gal.items.push(it); galEl.appendChild(b); }
  }
  function paintCount() {
    var n = gal.items.length > gal.total ? gal.items.length : gal.total;
    galCount.textContent = n ? n + (n > 1 ? " souvenirs partagés par vos proches" : " souvenir partagé") : "";
    galSec.hidden = !n;
  }
  function galleryAdd(it) { tile(it, true); gal.total++; paintCount(); }

  function loadPage(reset) {
    if (gal.loading) return;
    gal.loading = true;
    var offset = reset ? 0 : gal.next;
    fetch("api/gallery.php?offset=" + offset + "&limit=24", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok || j.disabled) return;
        if (reset) j.items.slice().reverse().forEach(function (it) { tile(it, true); });
        else j.items.forEach(function (it) { tile(it, false); });
        gal.total = j.total;
        if (!reset) gal.next = j.next == null ? gal.items.length : j.next;
        galMore.hidden = j.next == null || gal.items.length >= gal.total;
        paintCount();
      })
      .catch(function () {})
      .then(function () { gal.loading = false; });
  }
  function initGallery(info) {
    if (demo || !info || !info.gallery) return;
    gal.live = true;
    loadPage(false);
    // l'album se remplit tout seul pendant la fête (toutes les 45 s quand il est visible)
    setInterval(function () {
      if (document.hidden) return;
      var r = galSec.getBoundingClientRect();
      if (r.top < window.innerHeight * 2 && r.bottom > -window.innerHeight) loadPage(true);
    }, 45000);
  }
  galMore.addEventListener("click", function () { loadPage(false); });

  /* ───────────── Visionneuse ───────────── */

  var viewer = $("#viewer"), stage = $(".viewer__stage", viewer), cap = $(".viewer__cap", viewer);
  var vIndex = 0;
  function showItem(i) {
    if (!gal.items.length) return;
    vIndex = (i + gal.items.length) % gal.items.length;
    var it = gal.items[vIndex];
    stage.innerHTML = it.kind === "video"
      ? '<video src="' + esc(it.src) + '" controls autoplay playsinline></video>'
      : '<img src="' + esc(it.src) + '" alt="">';
    cap.textContent = it.guest ? "par " + it.guest : "";
  }
  function openViewer(i) {
    viewer.hidden = false;
    document.body.style.overflow = "hidden";
    showItem(i);
  }
  function closeViewer() {
    viewer.hidden = true;
    stage.innerHTML = "";
    document.body.style.overflow = "";
  }
  $(".viewer__close").addEventListener("click", closeViewer);
  $(".viewer__prev").addEventListener("click", function () { showItem(vIndex - 1); });
  $(".viewer__next").addEventListener("click", function () { showItem(vIndex + 1); });
  viewer.addEventListener("click", function (e) { if (e.target === viewer || e.target === stage) closeViewer(); });
  document.addEventListener("keydown", function (e) {
    if (viewer.hidden) return;
    if (e.key === "Escape") closeViewer();
    if (e.key === "ArrowLeft") showItem(vIndex - 1);
    if (e.key === "ArrowRight") showItem(vIndex + 1);
  });
  var sx = null;
  viewer.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  viewer.addEventListener("touchend", function (e) {
    if (sx == null) return;
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) showItem(vIndex + (dx < 0 ? 1 : -1));
    sx = null;
  }, { passive: true });
})();
