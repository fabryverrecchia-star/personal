/* ==========================================================================
   Lindsey & Andrea — page logic
   preloader · translations · reveals · countdown · guestbook · uploads
   ========================================================================== */
(function () {
  "use strict";

  var WEDDING = new Date(2026, 9, 3);   // 3 October 2026 (months are 0-based)
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ───────────── Translations ───────────── */

  var I18N = {
    en: {
      "hero.eyebrow": "We are getting married",
      "hero.scroll": "Scroll",
      "invite.title": "Our Favorite People",
      "invite.lead": "You are the people who made our story what it is. We would be honoured to have you beside us as we say yes.",
      "invite.body": "This little page is our guestbook and our photo album. Leave us a few words, and share every photo and video you take — the laughter, the dancing, the moments we will miss while we are busy being married.",
      "count.days": "<b>{n}</b> days to go",
      "count.tomorrow": "Tomorrow is the day",
      "count.today": "Today is the day",
      "count.after": "Married on 03 . 10 . 2026",
      "message.eyebrow": "Guestbook",
      "message.title": "Leave us a note",
      "message.intro": "A wish, a memory, a piece of advice — we will read every word.",
      "form.name": "Your name",
      "form.namePh": "e.g. Sophie & Luca",
      "form.message": "Your message",
      "form.messagePh": "Dear Lindsey and Andrea…",
      "form.send": "Send with love",
      "form.sending": "Sending…",
      "form.sent": "Thank you — your note is on its way to us.",
      "form.missing": "Please add your name and a few words.",
      "form.error": "Something went wrong. Please try again in a moment.",
      "form.rate": "Easy there! Please wait a little before sending another note.",
      "share.eyebrow": "Photos & videos",
      "share.title": "Share the day",
      "share.intro": "Upload straight from your phone, in original quality. Everything goes privately to Lindsey & Andrea.",
      "share.namePh": "So we know who captured it",
      "share.choose": "Choose photos & videos",
      "share.hint": "Tap to open your gallery · several at once",
      "share.keepOpen": "Please keep this page open until every file shows a check mark.",
      "share.summary": "{done} of {count} sent",
      "share.allDone": "Thank you! {count} memories received.",
      "share.waiting": "Waiting…",
      "share.done": "Sent",
      "share.failed": "Failed — tap ↻ to retry",
      "share.tooBig": "This file is too large",
      "share.badType": "Only photos and videos, please",
      "share.leave": "Uploads are still in progress. Leave anyway?",
      "footer.thanks": "Thank you"
    },
    it: {
      "hero.eyebrow": "Ci sposiamo",
      "hero.scroll": "Scorri",
      "invite.title": "Our Favorite People",
      "invite.lead": "Siete le persone che hanno reso unica la nostra storia. Sarebbe un onore avervi accanto a noi nel giorno del nostro sì.",
      "invite.body": "Questa pagina è il nostro libro degli ospiti e il nostro album. Lasciateci qualche parola e condividete ogni foto e video — le risate, i balli, i momenti che ci perderemo mentre saremo impegnati a sposarci.",
      "count.days": "Mancano <b>{n}</b> giorni",
      "count.tomorrow": "Domani è il grande giorno",
      "count.today": "Oggi è il grande giorno",
      "count.after": "Sposi dal 03 . 10 . 2026",
      "message.eyebrow": "Libro degli ospiti",
      "message.title": "Lasciateci un pensiero",
      "message.intro": "Un augurio, un ricordo, un consiglio — leggeremo ogni parola.",
      "form.name": "Il tuo nome",
      "form.namePh": "es. Sofia & Luca",
      "form.message": "Il tuo messaggio",
      "form.messagePh": "Cari Lindsey e Andrea…",
      "form.send": "Invia con amore",
      "form.sending": "Invio…",
      "form.sent": "Grazie — il tuo messaggio è arrivato.",
      "form.missing": "Aggiungi il tuo nome e qualche parola.",
      "form.error": "Qualcosa è andato storto. Riprova tra un momento.",
      "form.rate": "Piano piano! Aspetta un attimo prima di inviare un altro messaggio.",
      "share.eyebrow": "Foto & video",
      "share.title": "Condividi la giornata",
      "share.intro": "Carica direttamente dal telefono, in qualità originale. Tutto arriva in privato a Lindsey & Andrea.",
      "share.namePh": "Così sappiamo chi l’ha scattata",
      "share.choose": "Scegli foto & video",
      "share.hint": "Tocca per aprire la galleria · anche più file insieme",
      "share.keepOpen": "Tieni aperta questa pagina finché ogni file mostra la spunta.",
      "share.summary": "{done} di {count} inviati",
      "share.allDone": "Grazie! {count} ricordi ricevuti.",
      "share.waiting": "In attesa…",
      "share.done": "Inviato",
      "share.failed": "Errore — tocca ↻ per riprovare",
      "share.tooBig": "File troppo grande",
      "share.badType": "Solo foto e video, per favore",
      "share.leave": "Ci sono ancora caricamenti in corso. Uscire comunque?",
      "footer.thanks": "Grazie"
    },
    fr: {
      "hero.eyebrow": "Nous nous marions",
      "hero.scroll": "Défiler",
      "invite.title": "Our Favorite People",
      "invite.lead": "Vous êtes celles et ceux qui ont fait notre histoire. Ce serait un honneur de vous avoir à nos côtés au moment de dire oui.",
      "invite.body": "Cette page est notre livre d’or et notre album. Laissez-nous quelques mots et partagez chaque photo et vidéo — les rires, les danses, tous ces instants que nous manquerons pendant que nous serons occupés à nous marier.",
      "count.days": "Plus que <b>{n}</b> jours",
      "count.tomorrow": "C’est demain",
      "count.today": "C’est aujourd’hui",
      "count.after": "Mariés le 03 . 10 . 2026",
      "message.eyebrow": "Livre d’or",
      "message.title": "Un mot pour nous",
      "message.intro": "Un vœu, un souvenir, un conseil — nous lirons chaque mot.",
      "form.name": "Votre nom",
      "form.namePh": "ex. Sophie & Luca",
      "form.message": "Votre message",
      "form.messagePh": "Chers Lindsey et Andrea…",
      "form.send": "Envoyer avec amour",
      "form.sending": "Envoi…",
      "form.sent": "Merci — votre message nous est bien parvenu.",
      "form.missing": "Ajoutez votre nom et quelques mots.",
      "form.error": "Une erreur est survenue. Réessayez dans un instant.",
      "form.rate": "Doucement ! Patientez un peu avant d’envoyer un autre message.",
      "share.eyebrow": "Photos & vidéos",
      "share.title": "Partagez la journée",
      "share.intro": "Envoyez directement depuis votre téléphone, en qualité originale. Tout arrive en privé à Lindsey & Andrea.",
      "share.namePh": "Pour savoir qui l’a capturée",
      "share.choose": "Choisir photos & vidéos",
      "share.hint": "Touchez pour ouvrir la galerie · plusieurs à la fois",
      "share.keepOpen": "Gardez cette page ouverte jusqu’à ce que chaque fichier soit coché.",
      "share.summary": "{done} sur {count} envoyés",
      "share.allDone": "Merci ! {count} souvenirs reçus.",
      "share.waiting": "En attente…",
      "share.done": "Envoyé",
      "share.failed": "Échec — touchez ↻ pour réessayer",
      "share.tooBig": "Fichier trop volumineux",
      "share.badType": "Uniquement photos et vidéos, merci",
      "share.leave": "Des envois sont en cours. Quitter quand même ?",
      "footer.thanks": "Merci"
    }
  };

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  var lang = (function () {
    var saved = store("la-lang");
    if (saved && I18N[saved]) return saved;
    var nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return I18N[nav] ? nav : "en";
  })();

  function t(key, vars) {
    var s = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ""; });
    return s;
  }

  function applyLang() {
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    $$("[data-i18n-ph]").forEach(function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
    $$(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === lang)); });
    renderCountdown();
    if (uploader) refreshAllItems();
  }

  $$(".lang button").forEach(function (b) {
    b.addEventListener("click", function () {
      lang = b.dataset.lang;
      store("la-lang", lang);
      applyLang();
    });
  });

  /* ───────────── Countdown ───────────── */

  function renderCountdown() {
    var el = $("#countdown");
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var days = Math.round((WEDDING - today) / 86400000);
    var html;
    if (days > 1) html = t("count.days", { n: days });
    else if (days === 1) html = t("count.tomorrow");
    else if (days === 0) html = t("count.today");
    else html = t("count.after");
    el.innerHTML = html;
  }

  /* ───────────── Preloader ───────────── */

  var loader = $("#loader");
  var bar = $("#loaderBar");
  var count = $("#loaderCount");
  var shown = 0, target = 0;
  var started = performance.now();
  var MIN_TIME = 2600;                // let the monogram finish drawing
  var MAX_TIME = 7000;                // never hold guests hostage on slow networks
  var steps = { fonts: false, scene: false, load: false };

  function markStep(name) { steps[name] = true; }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { markStep("fonts"); });
  } else markStep("fonts");
  window.addEventListener("load", function () { markStep("load"); });

  function loaderTick(now) {
    var elapsed = now - started;
    var doneSteps = (steps.fonts ? 1 : 0) + (steps.scene ? 1 : 0) + (steps.load ? 1 : 0);
    if (!steps.scene && window.WeddingScene && window.WeddingScene.ready) markStep("scene");
    var timePart = Math.min(1, elapsed / MIN_TIME);
    target = Math.min(timePart, 0.25 + doneSteps / 3 * 0.75);
    if (elapsed > MAX_TIME) target = 1;
    shown += (target - shown) * 0.08;
    if (target >= 1 && shown > 0.995) shown = 1;
    bar.style.transform = "scaleX(" + shown.toFixed(4) + ")";
    var pct = Math.round(shown * 100);
    count.textContent = pct < 10 ? "0" + pct : String(pct);
    if (shown >= 1) return finishLoading();
    requestAnimationFrame(loaderTick);
  }

  function finishLoading() {
    setTimeout(function () {
      loader.classList.add("is-leaving");
      document.body.classList.remove("is-loading");
      if (window.WeddingScene) window.WeddingScene.start();
      setTimeout(function () { document.body.classList.add("is-ready"); }, 380);
      setTimeout(function () { loader.classList.add("is-gone"); }, 1400);
    }, 250);
  }

  // if the URL targets a section (e.g. shared link …#share), don't jump before the reveal
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* ───────────── Scroll reveals & top bar ───────────── */

  function setupReveals() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  var topbar = $(".topbar");
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      topbar.classList.toggle("is-solid", window.scrollY > window.innerHeight * 0.6);
      ticking = false;
    });
  }, { passive: true });

  /* ───────────── Toast ───────────── */

  var toastEl = $("#toast"), toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 3800);
  }

  /* ───────────── Guest name (shared by both forms) ───────────── */

  var nameInputs = [$("#guestName"), $("#uploaderName")];
  var savedName = store("la-name") || "";
  nameInputs.forEach(function (inp) {
    inp.value = savedName;
    inp.addEventListener("input", function () {
      nameInputs.forEach(function (o) { if (o !== inp) o.value = inp.value; });
      store("la-name", inp.value.trim());
    });
  });
  function guestName() { return (nameInputs[0].value || nameInputs[1].value || "").trim(); }

  /* ───────────── Guestbook message ───────────── */

  var form = $("#messageForm");
  var status = $("#messageStatus");
  var textarea = form.querySelector("textarea");
  var msgCount = $("#msgCount");
  textarea.addEventListener("input", function () { msgCount.textContent = textarea.value.length; });

  function setStatus(msg, kind) {
    status.textContent = msg;
    status.className = "form__status" + (kind ? " is-" + kind : "");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = guestName();
    var message = textarea.value.trim();
    $$(".field", form).forEach(function (f) { f.classList.remove("is-invalid"); });
    if (!name || !message) {
      if (!name) nameInputs[0].closest(".field").classList.add("is-invalid");
      if (!message) textarea.closest(".field").classList.add("is-invalid");
      setStatus(t("form.missing"), "err");
      return;
    }
    var btn = form.querySelector(".btn");
    btn.disabled = true;
    btn.classList.add("is-busy");
    setStatus(t("form.sending"));

    fetch("api/message.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, message: message, lang: lang, website: form.website.value })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; });
    }).then(function (res) {
      if (res.status === 429) throw new Error("rate");
      if (!res.body.ok) throw new Error("fail");
      textarea.value = "";
      msgCount.textContent = "0";
      setStatus(t("form.sent"), "ok");
      toast(t("form.sent"));
      if (navigator.vibrate) navigator.vibrate(18);
    }).catch(function (err) {
      setStatus(t(err.message === "rate" ? "form.rate" : "form.error"), "err");
    }).then(function () {
      btn.disabled = false;
      btn.classList.remove("is-busy");
    });
  });

  /* ───────────── Photo & video upload ───────────── */

  var MAX_BYTES = 2048 * 1024 * 1024;           // keep in sync with api/config.php
  var EXT_OK = /\.(jpe?g|png|gif|webp|heic|heif|avif|tiff?|dng|mp4|mov|m4v|webm|3gp|3g2|avi|mkv|hevc)$/i;
  var queueEl = $("#queue");
  var queueHead = $("#queueHead");
  var totalBar = $("#totalBar");
  var note = $("#uploadNote");
  var rows = new Map();
  var uploader = null;
  var wakeLock = null;

  var ICONS = {
    cancel: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    done: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
    retry: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5"/></svg>'
  };

  function fmtBytes(b) {
    if (b < 1024 * 1024) return Math.max(1, Math.round(b / 1024)) + " KB";
    if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(b < 10 * 1024 * 1024 ? 1 : 0) + " MB";
    return (b / 1024 / 1024 / 1024).toFixed(2) + " GB";
  }

  function isMedia(file) {
    return /^(image|video)\//.test(file.type) || EXT_OK.test(file.name);
  }

  function makeThumb(file, box) {
    var url = URL.createObjectURL(file);
    if (/^video\//.test(file.type) || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name)) {
      var v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.preload = "metadata";
      v.src = url + "#t=0.1";
      box.appendChild(v);
      var play = document.createElement("span");
      play.className = "q__play";
      play.textContent = "▶";
      box.appendChild(play);
    } else {
      var img = new Image();
      img.decoding = "async";
      img.alt = "";
      img.onerror = function () { img.remove(); };  // e.g. HEIC on non-Apple browsers
      img.src = url;
      box.appendChild(img);
    }
  }

  function createRow(item) {
    var li = document.createElement("li");
    li.className = "q";
    li.innerHTML =
      '<div class="q__thumb"></div>' +
      '<div class="q__meta"><span class="q__name"></span><span class="q__sub"></span>' +
      '<div class="q__bar"><span></span></div></div>' +
      '<button type="button" class="q__state"></button>';
    li.querySelector(".q__name").textContent = item.file.name || "file";
    makeThumb(item.file, li.querySelector(".q__thumb"));
    li.querySelector(".q__state").addEventListener("click", function () {
      if (item.status === "error") uploader.retry(item);
      else if (item.status === "queued" || item.status === "uploading") uploader.cancel(item);
    });
    queueEl.insertBefore(li, queueEl.firstChild);
    rows.set(item, li);
    return li;
  }

  function updateRow(item) {
    var li = rows.get(item) || createRow(item);
    if (item.status === "cancelled") {
      li.style.transition = "opacity .4s, transform .4s";
      li.style.opacity = "0";
      li.style.transform = "translateX(20px)";
      setTimeout(function () { li.remove(); }, 400);
      rows.delete(item);
      return;
    }
    var pct = item.file.size ? item.sent / item.file.size : 1;
    li.className = "q is-" + item.status;
    li.querySelector(".q__bar span").style.transform = "scaleX(" + Math.min(1, pct).toFixed(3) + ")";
    var sub = li.querySelector(".q__sub");
    var btn = li.querySelector(".q__state");
    if (item.status === "done") {
      sub.textContent = t("share.done") + " · " + fmtBytes(item.file.size);
      if (btn.dataset.icon !== "done") { btn.innerHTML = ICONS.done; btn.dataset.icon = "done"; }
      btn.setAttribute("aria-label", t("share.done"));
    } else if (item.status === "error") {
      var code = item.error && item.error.code;
      sub.textContent = code === "too_big" ? t("share.tooBig") : code === "bad_type" ? t("share.badType") : t("share.failed");
      btn.innerHTML = ICONS.retry; btn.dataset.icon = "retry";
      btn.setAttribute("aria-label", "Retry");
    } else {
      sub.textContent = item.status === "queued"
        ? t("share.waiting") + " · " + fmtBytes(item.file.size)
        : Math.round(pct * 100) + "% · " + fmtBytes(item.file.size);
      if (btn.dataset.icon !== "cancel") { btn.innerHTML = ICONS.cancel; btn.dataset.icon = "cancel"; }
      btn.setAttribute("aria-label", "Cancel");
    }
  }

  function refreshAllItems() {
    rows.forEach(function (_, item) { updateRow(item); });
    updateTotals();
  }

  function updateTotals() {
    var s = uploader.stats();
    var any = s.count > 0;
    queueHead.hidden = totalBar.hidden = !any;
    note.hidden = !uploader.busy();
    if (!any) return;
    $("#queueSummary").textContent = t("share.summary", { done: s.done, count: s.count });
    $("#queuePercent").textContent = Math.round(s.pct * 100) + "%";
    totalBar.firstElementChild.style.transform = "scaleX(" + s.pct.toFixed(3) + ")";
  }

  function lockScreen(on) {
    if (!("wakeLock" in navigator)) return;
    if (on && !wakeLock) {
      navigator.wakeLock.request("screen").then(function (l) {
        wakeLock = l;
        l.addEventListener("release", function () { wakeLock = null; });
      }).catch(function () {});
    } else if (!on && wakeLock) {
      wakeLock.release().catch(function () {});
      wakeLock = null;
    }
  }
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && uploader && uploader.busy()) lockScreen(true);
  });

  uploader = new window.WeddingUploader({
    onAdd: function (item) { updateRow(item); },
    onUpdate: function (item) { updateRow(item); },
    onProgress: function () { updateTotals(); },
    onIdle: function () {
      lockScreen(false);
      var s = uploader.stats();
      if (s.done && s.done === s.count) {
        toast(t("share.allDone", { count: s.done }));
        if (navigator.vibrate) navigator.vibrate([16, 60, 16]);
      }
    }
  });

  function addFiles(list) {
    var good = [], rejected = 0, tooBig = 0;
    Array.prototype.forEach.call(list, function (f) {
      if (!isMedia(f)) rejected++;
      else if (f.size > MAX_BYTES) tooBig++;
      else good.push(f);
    });
    if (rejected) toast(t("share.badType"));
    else if (tooBig) toast(t("share.tooBig"));
    if (!good.length) return;
    uploader.add(good, guestName());
    lockScreen(true);
  }

  var input = $("#fileInput");
  input.addEventListener("change", function () {
    addFiles(input.files);
    input.value = "";      // allow picking the same files again
  });

  var drop = $("#drop");
  ["dragenter", "dragover"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("is-over"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("is-over"); });
  });
  drop.addEventListener("drop", function (e) { if (e.dataTransfer) addFiles(e.dataTransfer.files); });

  window.addEventListener("beforeunload", function (e) {
    if (uploader.busy()) {
      e.preventDefault();
      e.returnValue = t("share.leave");
      return e.returnValue;
    }
  });

  /* ───────────── Menu tabs ───────────── */

  var tabs = $$(".tabs [role=tab]");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (o) {
        var on = o === tab;
        o.setAttribute("aria-selected", String(on));
        document.getElementById(o.getAttribute("aria-controls")).hidden = !on;
      });
    });
  });

  /* ───────────── Boot ───────────── */

  applyLang();
  setupReveals();
  requestAnimationFrame(loaderTick);
})();
