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
      "voice.or": "or",
      "voice.title": "Leave a voice message",
      "voice.record": "Tap to record",
      "voice.stop": "Tap to stop",
      "voice.again": "Record another",
      "voice.play": "Play",
      "voice.redo": "Record again",
      "voice.send": "Send",
      "voice.allow": "Allow the microphone to start recording…",
      "voice.denied": "The microphone is blocked. Allow it in your browser settings, then tap record again.",
      "voice.noMic": "No microphone found on this device.",
      "voice.unsupported": "This browser can't record audio. Try Safari or Chrome.",
      "voice.tooShort": "That was a little short — hold on for at least a second.",
      "voice.sending": "Sending your voice message…",
      "voice.sent": "Thank you — your voice message is on its way.",
      "voice.failed": "It didn't go through. Tap Send to try again.",
      "gallery.eyebrow": "Gallery",
      "gallery.title": "Through your eyes",
      "gallery.count": "{n} memories shared",
      "gallery.countOne": "1 memory shared",
      "gallery.empty": "No memories yet. Be the first to share one.",
      "gallery.more": "Show more",
      "gallery.save": "Save",
      "gallery.aGuest": "A guest",
      "gallery.voiceNote": "Voice note",
      "gallery.kind.photo": "Photo",
      "gallery.kind.video": "Video",
      "gallery.kind.audio": "Voice note",
      "fab.open": "Share with Lindsey & Andrea",
      "fab.upload": "Photos & videos",
      "fab.voice": "Voice message",
      "fab.note": "Write a note",
      "fab.gallery": "Gallery",
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
      "voice.or": "oppure",
      "voice.title": "Lascia un messaggio vocale",
      "voice.record": "Tocca per registrare",
      "voice.stop": "Tocca per fermare",
      "voice.again": "Registrane un altro",
      "voice.play": "Ascolta",
      "voice.redo": "Registra di nuovo",
      "voice.send": "Invia",
      "voice.allow": "Consenti l’uso del microfono per iniziare…",
      "voice.denied": "Il microfono è bloccato. Consentilo nelle impostazioni del browser e tocca di nuovo.",
      "voice.noMic": "Nessun microfono trovato su questo dispositivo.",
      "voice.unsupported": "Questo browser non può registrare audio. Prova con Safari o Chrome.",
      "voice.tooShort": "Un po’ troppo breve — registra almeno un secondo.",
      "voice.sending": "Invio del messaggio vocale…",
      "voice.sent": "Grazie — il tuo messaggio vocale è in arrivo.",
      "voice.failed": "Invio non riuscito. Tocca Invia per riprovare.",
      "gallery.eyebrow": "Galleria",
      "gallery.title": "Con i vostri occhi",
      "gallery.count": "{n} ricordi condivisi",
      "gallery.countOne": "1 ricordo condiviso",
      "gallery.empty": "Ancora nessun ricordo. Condividi tu il primo.",
      "gallery.more": "Mostra altri",
      "gallery.save": "Salva",
      "gallery.aGuest": "Un ospite",
      "gallery.voiceNote": "Messaggio vocale",
      "gallery.kind.photo": "Foto",
      "gallery.kind.video": "Video",
      "gallery.kind.audio": "Messaggio vocale",
      "fab.open": "Condividi con Lindsey & Andrea",
      "fab.upload": "Foto & video",
      "fab.voice": "Messaggio vocale",
      "fab.note": "Scrivi un pensiero",
      "fab.gallery": "Galleria",
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
      "voice.or": "ou",
      "voice.title": "Laissez un message vocal",
      "voice.record": "Touchez pour enregistrer",
      "voice.stop": "Touchez pour arrêter",
      "voice.again": "En enregistrer un autre",
      "voice.play": "Écouter",
      "voice.redo": "Recommencer",
      "voice.send": "Envoyer",
      "voice.allow": "Autorisez le micro pour commencer…",
      "voice.denied": "Le micro est bloqué. Autorisez-le dans les réglages du navigateur, puis touchez à nouveau.",
      "voice.noMic": "Aucun micro trouvé sur cet appareil.",
      "voice.unsupported": "Ce navigateur ne peut pas enregistrer. Essayez Safari ou Chrome.",
      "voice.tooShort": "Un peu court — enregistrez au moins une seconde.",
      "voice.sending": "Envoi de votre message vocal…",
      "voice.sent": "Merci — votre message vocal est en route.",
      "voice.failed": "L’envoi a échoué. Touchez Envoyer pour réessayer.",
      "gallery.eyebrow": "Galerie",
      "gallery.title": "À travers vos yeux",
      "gallery.count": "{n} souvenirs partagés",
      "gallery.countOne": "1 souvenir partagé",
      "gallery.empty": "Pas encore de souvenirs. Partagez le premier.",
      "gallery.more": "Voir plus",
      "gallery.save": "Enregistrer",
      "gallery.aGuest": "Un invité",
      "gallery.voiceNote": "Message vocal",
      "gallery.kind.photo": "Photo",
      "gallery.kind.video": "Vidéo",
      "gallery.kind.audio": "Message vocal",
      "fab.open": "Partager avec Lindsey & Andrea",
      "fab.upload": "Photos & vidéos",
      "fab.voice": "Message vocal",
      "fab.note": "Écrire un mot",
      "fab.gallery": "Galerie",
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
    $$("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria"))); });
    $$(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === lang)); });
    renderCountdown();
    if (uploader) refreshAllItems();
    if (gallery) gallery.retranslate();
    if (recorder) recorder.setState(recorder.state);
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

  /* ───────────── Preloader ─────────────
     The monogram animates (motion.js) as soon as the fonts are ready; the
     hairline follows the real loading. When both are done the monogram
     flies into the top bar and the home appears. */

  var bar = $("#loaderBar");
  var count = $("#loaderCount");
  var shown = 0;
  var started = performance.now();
  var MAX_TIME = 8000;                // never hold guests hostage on slow networks
  var steps = { fonts: false, scene: false, load: false, intro: false };
  var Motion = window.WeddingMotion || {
    loading: function () { return Promise.resolve(); }, enter: function () {}, refresh: function () {}, rows: null
  };
  if (!window.WeddingMotion) document.documentElement.classList.add("no-motion");

  function markStep(name) { steps[name] = true; }
  window.addEventListener("load", function () { markStep("load"); });

  // wait for the faces (max 2.5 s) so nothing animates in a fallback font
  var fontsReady = document.fonts && document.fonts.load
    ? Promise.race([
        Promise.all([
          document.fonts.load('500 100px "Cormorant"'), document.fonts.load('500 100px "Cormorant Garamond"'),
          document.fonts.load('400 100px "Pinyon"'), document.fonts.load('400 100px "Pinyon Script"'),
          document.fonts.ready
        ]),
        new Promise(function (r) { setTimeout(r, 2500); })
      ])
    : Promise.resolve();
  fontsReady.then(function () {
    markStep("fonts");
    return Motion.loading();
  }).then(function () { markStep("intro"); });

  function loaderTick(now) {
    var elapsed = now - started;
    if (!steps.scene && window.WeddingScene && window.WeddingScene.ready) markStep("scene");
    var done = (steps.fonts ? 1 : 0) + (steps.scene ? 1 : 0) + (steps.load ? 1 : 0) + (steps.intro ? 1 : 0);
    var target = elapsed > MAX_TIME ? 1 : done / 4;
    shown += (target - shown) * 0.06;
    if (target >= 1 && shown > 0.996) shown = 1;
    bar.style.transform = "scaleX(" + shown.toFixed(4) + ")";
    var pct = Math.round(shown * 100);
    count.textContent = pct < 10 ? "0" + pct : String(pct);
    if (shown >= 1) return setTimeout(finishLoading, 250);
    requestAnimationFrame(loaderTick);
  }

  function finishLoading() {
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
    window.scrollTo(0, 0);
    if (window.WeddingScene) window.WeddingScene.start();
    Motion.enter();
  }

  // if the URL targets a section (e.g. shared link …#share), don't jump before the reveal
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* ───────────── Top bar ───────────── */

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

    // a plain form post: the format shared-hosting firewalls accept most readily
    var body = new URLSearchParams();
    body.append("name", name);
    body.append("message", message);
    body.append("lang", lang);
    body.append("website", form.website.value);
    fetch("api/message.php", { method: "POST", body: body }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; });
    }).then(function (res) {
      if (res.status === 429) throw new Error("rate");
      if (!res.body.ok) {
        var e = new Error((res.body && res.body.error) || "");
        e.detail = "HTTP " + res.status + (res.body && res.body.error ? " · " + res.body.error : "");
        throw e;
      }
      textarea.value = "";
      msgCount.textContent = "0";
      setStatus(t("form.sent"), "ok");
      toast(t("form.sent"));
      if (navigator.vibrate) navigator.vibrate(18);
    }).catch(function (err) {
      setStatus(err.message === "rate" ? t("form.rate")
        : t("form.error") + " (" + (err.detail || (err.name === "TypeError" ? "no connection" : err.message)) + ")", "err");
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
  var gallery = null;
  var recorder = null;
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

  var isVideoFile = function (f) { return /^video\//.test(f.type) || /\.(mp4|mov|m4v|webm|3gp)$/i.test(f.name); };

  // Thumbnails are decoded small (createImageBitmap with resize) so a 12 MP photo
  // never gets decoded at full size just to fill a 54 px square — that decode is
  // what makes phones stutter when ten photos are picked at once.
  function makeThumb(file, box) {
    function ready() { box.classList.add("is-ready"); }
    if (isVideoFile(file)) {
      var v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.preload = "metadata";
      v.addEventListener("loadeddata", ready);
      v.src = URL.createObjectURL(file) + "#t=0.1";
      box.insertBefore(v, box.firstChild);
      var play = document.createElement("span");
      play.className = "q__play";
      play.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
      box.appendChild(play);
      setTimeout(ready, 1500);
      return;
    }
    function fallback() {
      var img = new Image();
      img.decoding = "async";
      img.alt = "";
      img.onload = ready;
      img.onerror = function () { img.remove(); ready(); };  // e.g. HEIC outside Safari
      img.src = URL.createObjectURL(file);
      box.insertBefore(img, box.firstChild);
    }
    if (!window.createImageBitmap) return fallback();
    var size = 108;                                         // 54 px × 2 for retina
    createImageBitmap(file, { resizeWidth: size * 2, resizeQuality: "medium" }).then(function (bmp) {
      var c = document.createElement("canvas");
      c.width = c.height = size;
      var g = c.getContext("2d");
      var s = Math.max(size / bmp.width, size / bmp.height);
      var w = bmp.width * s, h = bmp.height * s;
      g.drawImage(bmp, (size - w) / 2, (size - h) / 2, w, h);
      if (bmp.close) bmp.close();
      box.insertBefore(c, box.firstChild);
      requestAnimationFrame(ready);
    }).catch(fallback);
  }

  var enterIndex = 0, enterTimer = 0;
  function createRow(item) {
    var li = document.createElement("li");
    li.className = "q";
    li.innerHTML =
      '<div class="q__in">' +
        '<div class="q__thumb"><span class="q__veil"></span></div>' +
        '<div class="q__meta"><span class="q__name"></span>' +
          '<span class="q__sub"><span class="q__pct"></span><span class="q__size"></span></span>' +
          '<div class="q__bar"><span></span></div></div>' +
        '<button type="button" class="q__state"></button>' +
      "</div>";
    li.querySelector(".q__name").textContent = item.file.name || "file";
    li.querySelector(".q__size").textContent = fmtBytes(item.file.size);
    li._p = { shown: 0, target: 0, pct: -1 };
    makeThumb(item.file, li.querySelector(".q__thumb"));
    li.querySelector(".q__state").addEventListener("click", function () {
      if (item.status === "error") uploader.retry(item);
      else if (item.status === "queued" || item.status === "uploading") uploader.cancel(item);
    });
    queueEl.insertBefore(li, queueEl.firstChild);
    rows.set(item, li);
    // files picked together cascade in, one after another
    if (Motion.rows) Motion.rows.enter(li, enterIndex++);
    clearTimeout(enterTimer);
    enterTimer = setTimeout(function () { enterIndex = 0; }, 200);
    return li;
  }

  function updateRow(item) {
    var li = rows.get(item) || createRow(item);
    if (item.status === "cancelled") {
      rows.delete(item);
      if (Motion.rows) Motion.rows.leave(li, function () { li.remove(); });
      else li.remove();
      return;
    }
    var pct = item.file.size ? Math.min(1, item.sent / item.file.size) : 1;
    if (item.status === "queued") li._p.shown = li._p.target = 0;   // fresh start after a retry
    li._p.target = item.status === "done" ? 1 : Math.max(li._p.target, pct);
    var was = li.dataset.status;
    li.dataset.status = item.status;
    li.classList.toggle("is-done", item.status === "done");
    li.classList.toggle("is-error", item.status === "error");
    li.classList.toggle("is-queued", item.status === "queued");
    var btn = li.querySelector(".q__state");
    if (item.status === "done") {
      if (btn.dataset.icon !== "done") { btn.innerHTML = ICONS.done; btn.dataset.icon = "done"; }
      btn.setAttribute("aria-label", t("share.done"));
      if (was !== "done") {
        li._p.pct = -1;
        if (Motion.rows) Motion.rows.done(li);
      }
    } else if (item.status === "error") {
      if (btn.dataset.icon !== "retry") { btn.innerHTML = ICONS.retry; btn.dataset.icon = "retry"; }
      btn.setAttribute("aria-label", "Retry");
      li._p.pct = -1;
    } else {
      if (btn.dataset.icon !== "cancel") { btn.innerHTML = ICONS.cancel; btn.dataset.icon = "cancel"; }
      btn.setAttribute("aria-label", "Cancel");
      if (was !== item.status) li._p.pct = -1;
    }
    li._item = item;
    animate();
  }

  // Progress events arrive in bursts (every chunk, uneven on 4G). Bars glide
  // toward the real value in one requestAnimationFrame loop instead of jumping,
  // and the loop stops as soon as everything has settled.
  var totalShown = 0, animating = false, lastT = 0;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function paintRow(li) {
    var item = li._item, p = li._p;
    li.querySelector(".q__bar span").style.transform = "scaleX(" + p.shown.toFixed(4) + ")";
    li.querySelector(".q__veil").style.transform = "scaleY(" + (1 - p.shown).toFixed(4) + ")";
    var pctInt = Math.round(p.shown * 100);
    if (pctInt === p.pct) return;
    p.pct = pctInt;
    var label = li.querySelector(".q__pct");
    if (item.status === "done") label.textContent = t("share.done");
    else if (item.status === "error") {
      var code = item.error && item.error.code;
      var why = window.WeddingUploader.describe ? window.WeddingUploader.describe(item.error) : "";
      label.textContent = (code === "too_big" ? t("share.tooBig") : code === "bad_type" ? t("share.badType") : t("share.failed")) + (why && code !== "too_big" && code !== "bad_type" ? " · " + why : "");
    } else if (item.status === "queued") label.textContent = t("share.waiting");
    else label.textContent = pctInt + "%";
  }

  function frame(now) {
    var dt = Math.min(0.1, (now - (lastT || now)) / 1000);
    lastT = now;
    var k = reduce ? 1 : 1 - Math.exp(-dt * 5.5);           // frame-rate independent easing
    var moving = false;
    rows.forEach(function (li) {
      var p = li._p, it = li._item;
      // between progress reports, creep slowly toward the end of the chunk in flight
      // (never past 96% of it), so a bar on a slow connection never looks frozen
      if (it && it.status === "uploading" && it.file.size) {
        var CH = window.WeddingUploader.chunkSize ? window.WeddingUploader.chunkSize() : 4 * 1024 * 1024;
        var cap = Math.min(1, (Math.floor(it.sent / CH) + 1) * CH / it.file.size) * 0.96;
        if (p.target < cap) p.target = Math.min(cap, p.target + dt * 0.035);
      }
      var d = p.target - p.shown;
      if (Math.abs(d) > 0.0005) { p.shown += d * k; moving = true; } else p.shown = p.target;
      paintRow(li);
    });
    var s = uploader.stats();
    var d2 = s.pct - totalShown;
    if (Math.abs(d2) > 0.0005) { totalShown += d2 * k; moving = true; } else totalShown = s.pct;
    totalBar.firstElementChild.style.transform = "scaleX(" + totalShown.toFixed(4) + ")";
    $("#queuePercent").textContent = Math.round(totalShown * 100) + "%";
    if (moving || uploader.busy()) requestAnimationFrame(frame);
    else { animating = false; lastT = 0; }
  }
  function animate() {
    if (animating) return;
    animating = true;
    requestAnimationFrame(frame);
  }

  function refreshAllItems() {
    rows.forEach(function (li) { li._p.pct = -1; paintRow(li); });
    updateTotals();
  }

  function updateTotals() {
    var s = uploader.stats();
    var any = s.count > 0;
    queueHead.hidden = totalBar.hidden = !any;
    note.hidden = !uploader.busy();
    if (!any) return;
    $("#queueSummary").textContent = t("share.summary", { done: s.done, count: s.count });
    animate();
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
    onProgress: function () { updateTotals(); updateFabRing(); },
    onDone: function (item) { if (gallery && item.result) gallery.add(item.result); },
    onIdle: function () {
      lockScreen(false);
      updateFabRing();
      var s = uploader.stats();
      if (s.done && s.done === s.count) {
        toast(t("share.allDone", { count: s.done }));
        if (navigator.vibrate) navigator.vibrate([16, 60, 16]);
      }
    }
  });

  // The server sizes JPEG/PNG itself; videos and HEIC are measured here, on the phone.
  function measure(file) {
    return new Promise(function (resolve) {
      var isVideo = /^video\//.test(file.type) || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name);
      var needs = isVideo || /\.(heic|heif|avif|tiff?)$/i.test(file.name);
      if (!needs) return resolve(null);
      var url = URL.createObjectURL(file), done = false;
      function finish(meta) {
        if (done) return;
        done = true;
        URL.revokeObjectURL(url);
        resolve(meta);
      }
      setTimeout(function () { finish(null); }, 2500);
      if (isVideo) {
        var v = document.createElement("video");
        v.preload = "metadata";
        v.muted = true;
        v.onloadedmetadata = function () {
          finish(v.videoWidth ? { w: v.videoWidth, h: v.videoHeight, duration: isFinite(v.duration) ? Math.round(v.duration * 10) / 10 : null } : null);
        };
        v.onerror = function () { finish(null); };
        v.src = url;
      } else {
        var img = new Image();
        img.onload = function () { finish({ w: img.naturalWidth, h: img.naturalHeight }); };
        img.onerror = function () { finish(null); };
        img.src = url;
      }
    });
  }

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
    var name = guestName();
    lockScreen(true);
    var card = $(".uploader").getBoundingClientRect();
    if (card.bottom < 80 || card.top > window.innerHeight - 120) {
      $(".uploader").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    // measure one by one (phones don't love decoding ten 4K videos at once), then queue each
    good.reduce(function (p, f) {
      return p.then(function () { return measure(f); }).then(function (meta) { uploader.add([f], name, meta); });
    }, Promise.resolve());
  }

  var input = $("#fileInput");
  input.addEventListener("change", function () {
    addFiles(input.files);
    input.value = "";      // allow picking the same files again
  });

  var drop = $("#drop");
  drop.addEventListener("pointerdown", function (e) {
    var r = drop.getBoundingClientRect();
    var dot = document.createElement("span");
    dot.className = "drop__ripple";
    dot.style.left = (e.clientX - r.left) + "px";
    dot.style.top = (e.clientY - r.top) + "px";
    drop.appendChild(dot);
    setTimeout(function () { dot.remove(); }, 900);
  });
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


  /* ───────────── Voice message ───────────── */

  var voiceUploader = new window.WeddingUploader({
    onProgress: function () { updateFabRing(); },
    onIdle: function () { updateFabRing(); }
  });
  recorder = new window.WeddingRecorder({
    root: $("#voice"),
    t: t,
    guest: guestName,
    uploader: voiceUploader,
    onSent: function (result) { if (gallery && result) gallery.add(result); }
  });

  /* ───────────── Gallery ───────────── */

  gallery = new window.WeddingGallery({ root: $("#gallery"), t: t });

  /* ───────────── Floating action button ───────────── */

  var fab = $("#fab");
  var fabBtn = $("#fabBtn");
  var fabMenu = $("#fabMenu");
  var scrim = $("#fabScrim");
  var ring = fab.querySelector(".fab__ring circle");
  var RING = 2 * Math.PI * 30;

  function setFab(open) {
    fab.dataset.open = String(open);
    fabBtn.setAttribute("aria-expanded", String(open));
    fabMenu.setAttribute("aria-hidden", String(!open));
    $$("button", fabMenu).forEach(function (b) { b.tabIndex = open ? 0 : -1; });
    if (open) {
      scrim.hidden = false;
      requestAnimationFrame(function () { scrim.classList.add("is-on"); });
    } else {
      scrim.classList.remove("is-on");
      setTimeout(function () { if (fab.dataset.open !== "true") scrim.hidden = true; }, 350);
    }
  }
  fabBtn.addEventListener("click", function () {
    setFab(fab.dataset.open !== "true");
    if (navigator.vibrate) navigator.vibrate(8);
  });
  scrim.addEventListener("click", function () { setFab(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && fab.dataset.open === "true") { setFab(false); fabBtn.focus(); } });

  function goTo(sel, then) {
    var el = $(sel);
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    if (then) setTimeout(then, reduceMotion ? 0 : 700);
  }
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  $$("[data-fab]", fabMenu).forEach(function (b) {
    b.addEventListener("click", function () {
      var what = b.dataset.fab;
      setFab(false);
      if (what === "upload") {
        input.click();                     // opens the gallery picker right away (same tap);
                                           // the page glides to the upload list once files are picked
      } else if (what === "voice") {
        goTo("#voice", function () { $("#voice .voice__rec").focus({ preventScroll: true }); });
      } else if (what === "note") {
        goTo("#message", function () { textarea.focus({ preventScroll: true }); });
      } else {
        goTo("#gallery");
      }
    });
  });

  // show after the hero, hide over the footer
  var hero = $(".hero"), footer = $(".footer");
  // measured on the sections (they don't move), not on the cards GSAP is sliding
  var forms = [$("#messageForm").parentNode, $("#share")];
  function fabVisibility() {
    var past = window.scrollY > hero.offsetHeight * 0.6;
    var band = window.innerHeight - 110;          // where the button sits
    var nearEnd = footer.getBoundingClientRect().top < band + 70;
    // step aside over the forms: they have their own buttons right there
    var overForm = forms.some(function (el) {
      var r = el.getBoundingClientRect();
      return r.top < band + 80 && r.bottom > band;
    });
    var show = past && !nearEnd && !overForm;
    fab.classList.toggle("is-shown", show);
    if (!show && fab.dataset.open === "true") setFab(false);
  }
  window.addEventListener("scroll", function () { requestAnimationFrame(fabVisibility); }, { passive: true });

  function busyAny() { return (uploader && uploader.busy()) || voiceUploader.busy(); }

  // the button doubles as a progress ring while anything is uploading
  function updateFabRing() {
    if (!ring) return;
    var a = uploader ? uploader.stats() : { total: 0, sent: 0 };
    var b = voiceUploader.stats();
    var total = a.total + b.total, sent = a.sent + b.sent;
    var busy = busyAny();
    fab.classList.toggle("is-uploading", busy);
    ring.style.strokeDasharray = RING.toFixed(1);
    ring.style.strokeDashoffset = (RING * (1 - (busy && total ? sent / total : 0))).toFixed(1);
    fabVisibility();
  }

  /* ───────────── Menu tabs ───────────── */

  var tabs = $$(".tabs [role=tab]");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (o) {
        var on = o === tab;
        o.setAttribute("aria-selected", String(on));
        document.getElementById(o.getAttribute("aria-controls")).hidden = !on;
      });
      Motion.refresh();
    });
  });

  /* ───────────── Boot ───────────── */

  applyLang();
  requestAnimationFrame(loaderTick);
})();
