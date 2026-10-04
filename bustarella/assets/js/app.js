/* ==========================================================================
   La bustarella digitale — the journey, step by step.
   ========================================================================== */
(function () {
  "use strict";

  var gsap = window.gsap;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var EXPO = "expo.out";
  var D = reduce ? 0.3 : 1;

  /* The quiz. There is no "right answer" here on purpose: whatever they pick, they win. */
  var QUESTIONS = [
    { who: "Lindsey", q: "Quelle est la squadra de cœur d’Andrea ?", options: ["Milan", "Inter", "Roma", "Juve"] },
    { who: "Andrea", q: "Quelle est la couleur préférée de Lindsey ?", options: ["Rouge", "Vert", "Bleu", "Jaune"] },
    { who: "Lindsey", q: "Quel est le passe-temps préféré d’Andrea à la montagne ?", options: [
      "Promenade spirituelle avec yoga en plein air", "Chasse avec les copains", "Randonnée chrono de 50 km", "Ramassage des feuilles tombées en automne"] },
    { who: "Andrea", q: "Quel plat Lindsey aime-t-elle te cuisiner avec amour ?", options: ["Minestrone", "Tagliatelle al salmone", "Poulet", "Salsiccia e friarielli"] }
  ];

  /* ───────────── State (survives a reload, so the IBAN isn't asked twice) ───────────── */
  var state = load();
  function load() { try { return JSON.parse(localStorage.getItem("busta") || "{}") || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem("busta", JSON.stringify(state)); } catch (e) { /* private mode */ } }

  /* ───────────── Server ───────────── */
  function post(type, fields) {
    if (window.BUSTA_POST) return window.BUSTA_POST(type, fields);    // preview: simulated
    var fd = new FormData();
    fd.append("type", type);
    Object.keys(fields).forEach(function (k) { fd.append(k, fields[k]); });
    return fetch("api/submit.php", { method: "POST", body: fd }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || !j.ok) { var e = new Error(j.error || ("HTTP " + r.status)); e.code = j.code || j.error; e.status = r.status; throw e; }
        return j;
      });
    });
  }

  /* ───────────── Screens ───────────── */
  var screens = $$(".screen");
  var order = screens.map(function (s) { return s.dataset.step; });
  var current = null;
  var bar = $(".progress span");

  function revealIn(screen) {
    var parts = $$(".screen__in > *", screen);
    if (!gsap) return;
    gsap.fromTo(parts, { opacity: 0, y: reduce ? 0 : 34 }, { opacity: 1, y: 0, duration: 1.3 * D, stagger: 0.09, ease: EXPO, clearProps: "transform" });
    var t = $(".title", screen);
    if (t && !reduce) gsap.fromTo(t, { clipPath: "inset(-20% 100% -20% 0)" }, { clipPath: "inset(-20% -10% -20% 0)", duration: 1.8, ease: "power2.inOut", delay: 0.1, clearProps: "clipPath" });
  }

  function go(step, opts) {
    var next = screens[order.indexOf(step)];
    if (!next || next === current) return;
    var prev = current;
    current = next;
    state.step = step;
    save();
    bar.style.transform = "scaleX(" + (order.indexOf(step) / (order.length - 1)).toFixed(3) + ")";
    function show() {
      if (prev) prev.classList.remove("is-active");
      next.classList.add("is-active");
      window.scrollTo(0, 0);
      revealIn(next);
      if (enter[step]) enter[step](opts || {});
    }
    if (prev && gsap) {
      gsap.to($$(".screen__in > *", prev), { opacity: 0, y: reduce ? 0 : -24, duration: 0.5 * D, stagger: 0.03, ease: "power2.in", onComplete: show });
    } else show();
  }
  function nextOf(step) { return order[order.indexOf(step) + 1]; }

  $$("[data-next]").forEach(function (b) {
    b.addEventListener("click", function () { go(nextOf(current.dataset.step)); });
  });

  var enter = {};

  /* ───────────── Envelope ───────────── */
  var opened = false;
  enter.envelope = function () {
    opened = false;
    if (!gsap) return;
    gsap.set(".env__flap", { rotateX: 0, zIndex: 4 });
    gsap.set(".env__card", { yPercent: 0, scale: 1 });
    gsap.set("#seal", { opacity: 1, scale: 1, rotate: 0 });
    gsap.fromTo("#envelope", { y: 40, rotate: -4, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 1.6 * D, ease: EXPO, delay: 0.2 });
  };
  $("#seal").addEventListener("click", function () {
    if (opened) return;
    opened = true;
    if (navigator.vibrate) navigator.vibrate(14);
    if (!gsap) { go("iban"); return; }
    gsap.timeline({ onComplete: function () { go(state.ibanDone ? "more" : "iban"); } })
      .to("#sealHint", { opacity: 0, duration: 0.4 }, 0)
      .to("#seal", { scale: 0.86, duration: 0.18, ease: "power2.in" }, 0)
      .to("#seal", { scale: 1.5, opacity: 0, rotate: 25, duration: 0.6, ease: "power2.out" }, 0.18)
      .to(".env__flap", { rotateX: 180, duration: 1.1 * D, ease: "power2.inOut" }, 0.35)
      .set(".env__flap", { zIndex: 1 }, 0.35 + 0.55 * D)
      .to(".env__card", { yPercent: -62, duration: 1.3 * D, ease: EXPO }, 1.2 * D)
      .to("#envelope", { y: 30, duration: 1.3 * D, ease: EXPO }, 1.2 * D)
      .to(".env__card", { scale: 1.08, duration: 0.6, ease: "power2.inOut" }, 2.3 * D)
      .to({}, { duration: 0.9 * D });
  });

  /* ───────────── IBAN ───────────── */
  var ibanInput = $("#iban"), ibanOk = $("#ibanOk"), holder = $("#holder");
  var form = $("#ibanForm"), status = $("#ibanStatus");

  function ibanClean(v) { return v.toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function ibanValid(iban) {
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
    var s = iban.slice(4) + iban.slice(0, 4), num = "";
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); num += c >= 65 ? String(c - 55) : s[i]; }
    var rest = 0;
    for (var j = 0; j < num.length; j += 7) rest = parseInt(String(rest) + num.slice(j, j + 7), 10) % 97;
    return rest === 1;
  }
  ibanInput.addEventListener("input", function () {
    var start = ibanInput.selectionStart, before = ibanInput.value.length;
    var clean = ibanClean(ibanInput.value).slice(0, 34);
    ibanInput.value = clean.replace(/(.{4})/g, "$1 ").trim();           // groups of 4, as on a bank card
    try { var pos = start + (ibanInput.value.length - before); ibanInput.setSelectionRange(pos, pos); } catch (e) { /* ignore */ }
    ibanOk.className = "field__ok" + (clean.length >= 15 ? (ibanValid(clean) ? " is-ok" : " is-bad") : "");
    ibanInput.closest(".field").classList.remove("is-invalid");
  });

  function setStatus(msg, kind) { status.textContent = msg; status.className = "form__status" + (kind ? " is-" + kind : ""); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var iban = ibanClean(ibanInput.value), name = holder.value.trim();
    $$(".field", form).forEach(function (f) { f.classList.remove("is-invalid"); });
    if (!name) { holder.closest(".field").classList.add("is-invalid"); setStatus("Indique le nom du titulaire du compte.", "err"); return; }
    if (!ibanValid(iban)) { ibanInput.closest(".field").classList.add("is-invalid"); setStatus("Cet IBAN ne semble pas correct : vérifie les chiffres.", "err"); return; }
    var btn = $(".btn", form);
    btn.disabled = true; btn.classList.add("is-busy");
    setStatus("Envoi…");
    post("iban", { holder: name, iban: iban, note: form.note.value, website: form.website.value }).then(function () {
      state.ibanDone = true; save();
      setStatus("C’est noté ! Le virement part très bientôt.", "ok");
      if (navigator.vibrate) navigator.vibrate([16, 60, 16]);
      setTimeout(function () { go("more"); }, 1600);
    }).catch(function (err) {
      var why = err.code === "invalid_iban" ? "Cet IBAN ne semble pas correct." : err.code === "rate_limited" ? "Trop d’essais, réessaie dans un moment." : "L’envoi n’a pas marché (" + (err.message || "réseau") + "). Réessaie.";
      setStatus(why, "err");
    }).then(function () { btn.disabled = false; btn.classList.remove("is-busy"); });
  });

  /* ───────────── Quiz ───────────── */
  var qi = 0, answers = [];
  var qWho = $("#quizWho"), qQ = $("#quizQ"), qOpts = $("#quizOptions"), qLock = $("#quizLock"), qDots = $("#quizDots");

  enter.quiz = function () { qi = 0; answers = []; renderQuestion(false); };

  function renderQuestion(animate) {
    var item = QUESTIONS[qi];
    qDots.innerHTML = QUESTIONS.map(function (_, i) { return '<i class="' + (i < qi ? "is-done" : i === qi ? "is-now" : "") + '"></i>'; }).join("");
    qWho.textContent = "Question pour " + item.who + " · " + (qi + 1) + " / " + QUESTIONS.length;
    qQ.textContent = item.q;
    qLock.textContent = "";
    qOpts.classList.remove("is-locked");
    qOpts.innerHTML = item.options.map(function (o, i) {
      return '<button type="button" class="opt" data-i="' + i + '"><b>' + "ABCD"[i] + "</b><span></span></button>";
    }).join("");
    $$(".opt", qOpts).forEach(function (b, i) { b.querySelector("span").textContent = item.options[i]; b.addEventListener("click", pick); });
    if (animate && gsap) {
      gsap.fromTo([qWho, qQ], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1 * D, stagger: 0.08, ease: EXPO });
      gsap.fromTo($$(".opt", qOpts), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1 * D, stagger: 0.07, delay: 0.15, ease: EXPO, clearProps: "transform" });
    }
  }

  function pick(e) {
    if (qOpts.classList.contains("is-locked")) return;
    var b = e.currentTarget, item = QUESTIONS[qi];
    qOpts.classList.add("is-locked");
    b.classList.add("is-picked");
    if (navigator.vibrate) navigator.vibrate(10);
    answers.push({ q: item.q, who: item.who, answer: item.options[+b.dataset.i] });
    qLock.textContent = "Réponse verrouillée";                 // never says if it's right
    if (gsap) gsap.fromTo(b, { scale: 0.97 }, { scale: 1, duration: 0.6, ease: EXPO });
    setTimeout(function () {
      if (qi < QUESTIONS.length - 1) {
        var out = [qWho, qQ].concat($$(".opt", qOpts), [qLock]);
        if (!gsap) { qi++; renderQuestion(false); return; }
        gsap.to(out, { opacity: 0, y: -20, duration: 0.45 * D, stagger: 0.03, ease: "power2.in", onComplete: function () { qi++; renderQuestion(true); gsap.set(qLock, { opacity: 1, y: 0 }); } });
      } else {
        state.quizDone = true; save();
        post("quiz", { answers: JSON.stringify(answers) }).catch(function () { /* the fun goes on anyway */ });
        go("verify");
      }
    }, 1200);
  }

  /* ───────────── Fake verification (they always win) ───────────── */
  enter.verify = function () {
    var steps = ["Analyse de la question 1…", "Analyse de la question 2…", "Analyse de la question 3…", "Analyse de la question 4…", "Calcul du score final…"];
    var out = $("#verifySteps"), fill = $(".verify span");
    var total = reduce ? 1.5 : 5.2;
    steps.forEach(function (s, i) { setTimeout(function () { out.textContent = s; }, (total * 1000 / steps.length) * i); });
    if (gsap) gsap.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: total, ease: "power1.inOut" });
    setTimeout(function () { go("won"); }, total * 1000 + 500);
  };

  enter.won = function () { petals(46); if (navigator.vibrate) navigator.vibrate([20, 80, 20, 80, 40]); };

  /* ───────────── The gift ───────────── */
  var flight = null;
  enter.gift = function () {
    if (gsap && !reduce) gsap.fromTo("#pass", { rotateX: 75, y: 60, opacity: 0, transformPerspective: 900, transformOrigin: "50% 0%" },
      { rotateX: 0, y: 0, opacity: 1, duration: 1.8, delay: 0.5, ease: EXPO });
    if (!flight && window.FlightMap) flight = new window.FlightMap($("#map"), $("#stops"));
    var map = $("#map");
    // fly when the map comes into view
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { io.disconnect(); setTimeout(function () { flight && flight.play(); }, 400); }
      }, { threshold: 0.45 });
      io.observe(map);
    } else if (flight) flight.play();
  };

  enter.final = function () { petals(60); };

  $("#replay").addEventListener("click", function () {
    state = {}; save();
    form.reset(); ibanOk.className = "field__ok"; setStatus("");
    go("thanks");
  });

  /* ───────────── Petals ───────────── */
  function petals(n) {
    if (!gsap || reduce) return;
    var colors = ["#e8cdc6", "#f3e1dc", "#fbf8f3", "#14295a", "#d9b8b0"];
    for (var i = 0; i < n; i++) {
      var p = document.createElement("i");
      p.className = "petal";
      p.style.background = colors[i % colors.length];
      document.body.appendChild(p);
      var x = Math.random() * window.innerWidth;
      gsap.set(p, { x: x, y: -30, rotate: Math.random() * 360, scale: 0.6 + Math.random() * 0.8 });
      gsap.to(p, {
        y: window.innerHeight + 40, x: x + (Math.random() - 0.5) * 220, rotate: "+=" + (Math.random() * 540 - 270),
        duration: 3.5 + Math.random() * 3, delay: Math.random() * 1.4, ease: "power1.in",
        onComplete: function () { this.targets()[0].remove(); }
      });
    }
  }

  /* ───────────── Start ───────────── */
  function start() {
    if (window.WeddingScene) window.WeddingScene.start();
    var resume = state.step && order.indexOf(state.step) > 0 ? state.step : "thanks";
    if (resume === "quiz" || resume === "verify") resume = "quiz-intro";      // a quiz restarts from the rules
    if (resume === "iban" && state.ibanDone) resume = "more";
    go(resume);
  }

  var loader = $("#loader");
  var fonts = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 2500); })]) : Promise.resolve();
  fonts.then(function () {
    if (!gsap) { loader.classList.add("is-gone"); start(); return; }
    gsap.timeline({ onComplete: function () { loader.classList.add("is-gone"); } })
      .fromTo(".loader__mono .l, .loader__mono .a", { opacity: 0, yPercent: 60 }, { opacity: 1, yPercent: 0, duration: 1.4 * D, stagger: 0.12, ease: EXPO })
      .fromTo(".loader__mono .l", { x: "-0.25em" }, { x: 0, duration: 2 * D, ease: "power3.inOut" }, 0)
      .fromTo(".loader__mono .a", { x: "0.25em" }, { x: 0, duration: 2 * D, ease: "power3.inOut" }, 0)
      .fromTo(".loader__mono .amp", { opacity: 0, scale: 0.4, rotate: -20 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.3 * D, ease: EXPO }, 1 * D)
      .fromTo(".loader__sub", { opacity: 0, letterSpacing: "0.8em" }, { opacity: 1, letterSpacing: "0.42em", duration: 1.6 * D, ease: EXPO }, 1.2 * D)
      .add(start, 2.6 * D)
      .to(loader, { opacity: 0, duration: 1 * D, ease: "power2.inOut" }, 2.6 * D);
  });
})();
