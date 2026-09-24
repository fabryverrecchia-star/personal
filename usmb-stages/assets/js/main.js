/* =========================================================
   US Méné-Bré Louargat — Stages d'Automne
   ========================================================= */

/* ---------- Configuration à adapter par le club ---------- */
const CONFIG = {
  // Adresse qui reçoit les demandes d'inscription (ouverture du logiciel de messagerie).
  email: "A_REMPLACER@usmb-louargat.fr",
  // Optionnel : URL d'un service de formulaire (Formspree, Getform, Make…) acceptant un POST JSON.
  // Si renseignée, l'inscription est envoyée directement sans passer par la messagerie.
  endpoint: "",
  // Animations quand l'appareil demande à « réduire les animations » (réglage d'accessibilité) :
  //  "completes" → toutes les animations, comme sur un appareil sans ce réglage
  //  "douces"    → fondus, curseur et compteurs seulement (plus doux pour les personnes sensibles au mouvement)
  animationsReduites: "completes",
};

const STAGES = {
  "u8-u13": {
    label: "Stage d'Automne U8–U13",
    short: "U8–U13",
    dates: "19, 20 & 22 octobre 2026",
    min: 8, max: 13,
    price: { oui: 30, non: 40 },
    // horaires en heure de Paris (CEST jusqu'au 25/10)
    days: ["2026-10-19", "2026-10-20", "2026-10-22"],
    start: "083000", end: "163000", tz: "+02:00",
  },
  "u6-u9": {
    label: "Stage d'Automne U6–U9",
    short: "U6–U9",
    dates: "26 & 27 octobre 2026",
    min: 6, max: 9,
    price: { oui: 20, non: 25 },
    days: ["2026-10-26", "2026-10-27"],
    start: "090000", end: "163000", tz: "+01:00",
  },
};
// Catégories de la saison 2026-2027 : Uxx = né(e) en 2027 - xx
const SEASON_END = 2027;

// Version du site : à augmenter avec les ?v= de index.html à chaque mise à jour
const VERSION = "6";
const diag = { init: "", errors: [] };
window.addEventListener("error", (e) => diag.errors.push(e.message));
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = CONFIG.animationsReduites !== "completes" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduced) document.documentElement.classList.add("reduce-motion");
const finePointer = window.matchMedia("(pointer: fine)").matches;

/* =========================================================
   Utilitaires fonctionnels (indépendants des animations)
   ========================================================= */

// Année du pied de page
$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// ---- Compte à rebours
(function countdown() {
  const targets = [
    { at: new Date("2026-10-19T08:30:00+02:00"), end: new Date("2026-10-22T16:30:00+02:00"), label: "Coup d'envoi U8–U13 dans" },
    { at: new Date("2026-10-26T09:00:00+01:00"), end: new Date("2026-10-27T16:30:00+01:00"), label: "Coup d'envoi U6–U9 dans" },
  ];
  const root = $(".countdown");
  if (!root) return;
  const label = $(".countdown__label", root);
  const out = { d: $('[data-cd="d"]', root), h: $('[data-cd="h"]', root), m: $('[data-cd="m"]', root) };
  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const now = new Date();
    const live = targets.find((t) => now >= t.at && now <= t.end);
    if (live) { label.textContent = "En ce moment"; $(".countdown__value", root).textContent = "Le stage bat son plein !"; return; }
    const next = targets.find((t) => now < t.at);
    if (!next) { label.textContent = "Stages d'automne"; $(".countdown__value", root).textContent = "À très vite pour les prochains stages !"; return; }
    const diff = next.at - now;
    label.textContent = next.label;
    out.d.textContent = pad(Math.floor(diff / 864e5));
    out.h.textContent = pad(Math.floor((diff / 36e5) % 24));
    out.m.textContent = pad(Math.floor((diff / 6e4) % 60));
  }
  tick();
  setInterval(tick, 30000);
})();

// ---- Fichier agenda (.ics)
function downloadICS(key) {
  const s = STAGES[key];
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const toUTC = (day, time) => {
    const d = new Date(`${day}T${time.slice(0, 2)}:${time.slice(2, 4)}:00${s.tz}`);
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };
  const events = s.days.map((day, i) => [
    "BEGIN:VEVENT",
    `UID:usmb-${key}-${day}@usmb-louargat`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toUTC(day, s.start)}`,
    `DTEND:${toUTC(day, s.end)}`,
    `SUMMARY:${s.label} — jour ${i + 1}`,
    "LOCATION:Louargat",
    "DESCRIPTION:US Méné-Bré Louargat. Repas à fournir\\, goûter offert.",
    "END:VEVENT",
  ].join("\r\n"));
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//USMB Louargat//Stages//FR", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `usmb-stage-${key}.ics` });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$$("[data-ics]").forEach((b) => b.addEventListener("click", () => downloadICS(b.dataset.ics)));

// ---- Formulaire d'inscription
const form = $(".form");
const success = $(".success");

function categoryOf(dateStr) {
  if (!dateStr) return null;
  const y = Number(dateStr.slice(0, 4));
  return y ? SEASON_END - y : null;
}

function updateForm() {
  const fd = new FormData(form);
  const chosen = fd.getAll("stage");
  const lic = fd.get("licencie") || "oui";
  const total = chosen.reduce((sum, k) => sum + STAGES[k].price[lic], 0);
  $("[data-total]").textContent = total;
  $("[data-total-detail]").textContent = chosen.length
    ? chosen.map((k) => `${STAGES[k].short} · ${STAGES[k].price[lic]} €`).join("  +  ") + (lic === "oui" ? " (licencié)" : " (non-licencié)")
    : "Sélectionnez un stage";

  const cat = categoryOf(fd.get("naissance"));
  const hint = $("[data-cat-hint]");
  hint.textContent = "";
  if (cat) {
    const bad = chosen.filter((k) => cat < STAGES[k].min || cat > STAGES[k].max);
    if (cat < 6 || cat > 13) hint.textContent = `Catégorie U${cat} : les stages sont ouverts de U6 à U13.`;
    else if (bad.length) hint.textContent = `Votre enfant est en U${cat} : le stage ${bad.map((k) => STAGES[k].short).join(" et ")} ne correspond pas à sa catégorie.`;
    else if (!chosen.length) hint.textContent = `Votre enfant est en U${cat}.`;
  }
}

function preselect(key) {
  if (!form || !STAGES[key]) return;
  const box = form.querySelector(`input[name="stage"][value="${key}"]`);
  if (box && !box.checked) { box.checked = true; updateForm(); }
}

if (form) {
  form.addEventListener("input", updateForm);
  form.addEventListener("change", updateForm);
  $$("[data-stage]").forEach((a) => a.addEventListener("click", () => preselect(a.dataset.stage)));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $(".form__error");
    const fd = new FormData(form);
    const problems = [];

    $$(".field", form).forEach((f) => f.classList.remove("is-invalid"));
    $$("[required]", form).forEach((input) => {
      if (!input.checkValidity()) { input.closest(".field")?.classList.add("is-invalid"); problems.push(input); }
    });
    const chosen = fd.getAll("stage");
    let msg = "";
    if (!chosen.length) msg = "Choisissez au moins un stage.";
    else if (problems.length) msg = "Merci de compléter les champs en rouge.";
    else {
      const cat = categoryOf(fd.get("naissance"));
      const bad = chosen.filter((k) => cat < STAGES[k].min || cat > STAGES[k].max);
      if (bad.length) msg = `La date de naissance (catégorie U${cat}) ne correspond pas au stage ${bad.map((k) => STAGES[k].short).join(" et ")}.`;
    }
    if (msg) {
      err.textContent = msg; err.hidden = false;
      (problems[0] || form.querySelector('input[name="stage"]')).focus({ preventScroll: true });
      err.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      return;
    }
    err.hidden = true;

    const lic = fd.get("licencie");
    const total = chosen.reduce((s, k) => s + STAGES[k].price[lic], 0);
    const cat = categoryOf(fd.get("naissance"));
    const data = {
      stages: chosen.map((k) => `${STAGES[k].label} (${STAGES[k].dates})`),
      enfant: `${fd.get("prenom").trim()} ${fd.get("nom").trim().toUpperCase()}`,
      naissance: new Date(fd.get("naissance")).toLocaleDateString("fr-FR"),
      categorie: `U${cat}`,
      licencie: lic === "oui" ? "Oui" : "Non",
      total: `${total} €`,
      infos: fd.get("infos").trim() || "—",
      responsable: fd.get("parent").trim(),
      telephone: fd.get("tel").trim(),
      email: fd.get("email").trim(),
      droit_image: fd.get("image") ? "Oui" : "Non",
    };
    const recap = [
      `Stage(s) : ${data.stages.join(" + ")}`,
      `Enfant : ${data.enfant} — né(e) le ${data.naissance} (${data.categorie})`,
      `Licencié(e) USMB : ${data.licencie}`,
      `Montant : ${data.total}`,
      `Infos santé / allergies : ${data.infos}`,
      "",
      `Responsable : ${data.responsable}`,
      `Téléphone : ${data.telephone}`,
      `E-mail : ${data.email}`,
      `Droit à l'image : ${data.droit_image}`,
    ].join("\n");

    const btn = form.querySelector('button[type="submit"]');
    let sent = false;
    if (CONFIG.endpoint) {
      btn.disabled = true;
      $(".btn__label", btn).textContent = "Envoi…";
      try {
        const res = await fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
        sent = res.ok;
      } catch (_) { sent = false; }
      btn.disabled = false;
      $(".btn__label", btn).textContent = "Envoyer l'inscription";
    }
    if (!sent) {
      const subject = `Inscription ${chosen.map((k) => STAGES[k].short).join(" + ")} — ${data.enfant}`;
      window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(recap)}`;
    }

    $(".success__msg").textContent = sent
      ? "Votre demande a bien été transmise au club. Nous revenons vers vous pour confirmer l'inscription."
      : "";
    if (!sent) {
      const msg = $(".success__msg");
      msg.textContent = "Envoyez ce récapitulatif au club à l'adresse ";
      const mail = Object.assign(document.createElement("span"), { className: "success__mail", textContent: CONFIG.email });
      msg.append(mail, ". Si votre messagerie ne s'est pas ouverte, copiez-le avec le bouton ci-dessous. Le club reviendra vers vous pour confirmer l'inscription.");
    }
    $(".success__recap").textContent = recap;
    form.hidden = true;
    success.hidden = false;
    success.focus({ preventScroll: true });
    window.__usmbScrollTo?.(success);
  });

  $("[data-copy]")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    const recap = $(".success__recap");
    try {
      await navigator.clipboard.writeText(recap.textContent);
      $(".btn__label", btn).textContent = "Copié";
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents(recap);
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
      $(".btn__label", btn).textContent = "Texte sélectionné";
    }
  });

  $("[data-reset]")?.addEventListener("click", () => {
    const keepParent = ["parent", "tel", "email", "image"].map((n) => [n, form.elements[n]]);
    const saved = keepParent.map(([n, el]) => [el, el.type === "checkbox" ? el.checked : el.value]);
    form.reset();
    saved.forEach(([el, v]) => (el.type === "checkbox" ? (el.checked = v) : (el.value = v)));
    success.hidden = true;
    form.hidden = false;
    const copyLabel = $("[data-copy] .btn__label");
    if (copyLabel) copyLabel.textContent = "Copier le récapitulatif";
    updateForm();
    form.elements.prenom.focus({ preventScroll: true });
    window.__usmbScrollTo?.(form);
  });

  updateForm();
}

/* =========================================================
   Animations
   ========================================================= */

function splitChars(el) {
  const text = el.textContent;
  el.setAttribute("aria-label", text);
  el.textContent = "";
  text.split(/(\s+)/).forEach((chunk) => {
    if (/^\s+$/.test(chunk)) { el.appendChild(document.createTextNode(" ")); return; }
    const word = document.createElement("span");
    word.className = "word mask";
    word.setAttribute("aria-hidden", "true");
    [...chunk].forEach((c) => {
      const ch = document.createElement("span");
      ch.className = "char";
      ch.textContent = c;
      word.appendChild(ch);
    });
    el.appendChild(word);
  });
  return $$(".char", el);
}

function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = "";
  words.forEach((w, i) => {
    const s = document.createElement("span");
    s.className = "word";
    s.textContent = w;
    el.appendChild(s);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
  return $$(".word", el);
}

function hideLoader() {
  const l = $(".loader");
  if (l) l.remove();
}

/* ---- Blocs partagés entre la version complète et la version douce */
function wordsAndCounters(gsap) {
  /* ---- Manifeste mot par mot */
  const words = splitWords($(".manifesto__text"));
  gsap.to(words, {
    opacity: 1, stagger: .1, ease: "none",
    scrollTrigger: { trigger: ".manifesto__text", start: "top 80%", end: "bottom 45%", scrub: true },
  });

  /* ---- Compteurs */
  $$("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count);
    const o = { v: end > 100 ? end - 60 : 0 };
    el.textContent = Math.round(o.v);
    gsap.to(o, {
      v: end, duration: 2, ease: "power3.out",
      onUpdate: () => (el.textContent = Math.round(o.v)),
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });
}

function setupCursor(gsap, magnetic) {
  const cursor = $(".cursor");
  const label = $(".cursor__label");
  const xTo = gsap.quickTo(cursor, "x", { duration: .45, ease: "power3" });
  const yTo = gsap.quickTo(cursor, "y", { duration: .45, ease: "power3" });
  window.addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); });
  $$("[data-cursor]").forEach((el) => {
    el.addEventListener("pointerenter", () => { label.textContent = el.dataset.cursor; cursor.classList.add("is-hover"); });
    el.addEventListener("pointerleave", () => cursor.classList.remove("is-hover"));
  });
  document.addEventListener("pointerleave", () => gsap.to(cursor, { autoAlpha: 0, duration: .3 }));
  document.addEventListener("pointerenter", () => gsap.to(cursor, { autoAlpha: 1, duration: .3 }));
  if (!magnetic) return;
  $$(".magnetic").forEach((el) => {
    const strength = el.classList.contains("btn--xl") ? 10 : 22;
    const mx = gsap.quickTo(el, "x", { duration: .8, ease: "elastic.out(1, .4)" });
    const my = gsap.quickTo(el, "y", { duration: .8, ease: "elastic.out(1, .4)" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      mx(((e.clientX - r.left) / r.width - .5) * strength);
      my(((e.clientY - r.top) / r.height - .5) * strength);
    });
    el.addEventListener("pointerleave", () => { mx(0); my(0); });
  });
}

/* ---- Version douce : fondus sans déplacement (appareil réglé sur « réduire les animations ») */
function lightMotion(gsap, ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  hideLoader();
  window.__usmbScrollTo = (el) => el.scrollIntoView({ block: "start" });
  navBehaviour();
  gsap.from([".hero__media img", ".hero__inner", ".hero__foot"], { autoAlpha: 0, duration: 1.4, ease: "power1.out", stagger: .25 });
  const groups = [".manifesto > .eyebrow", ".stats li", ".section-head", ".stage__media", ".stage__body", ".programme__head", ".day", ".info-card", ".pricing__row", ".signup__intro", ".form__group", ".footer__big", ".footer__row"];
  $$(groups.join(",")).forEach((el) =>
    gsap.from(el, { autoAlpha: 0, duration: 1, ease: "power1.out", scrollTrigger: { trigger: el, start: "top 92%", once: true } })
  );
  wordsAndCounters(gsap);
  if (finePointer) setupCursor(gsap, false);
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

function init() {
  const { gsap, ScrollTrigger } = window;
  if (gsap && ScrollTrigger && reduced) { lightMotion(gsap, ScrollTrigger); return; }
  if (!gsap || !ScrollTrigger) {
    hideLoader();
    // Défilement fluide natif pour les ancres, sans librairie
    window.__usmbScrollTo = (el) => el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    navBehaviour();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  // Évite les sauts quand la barre d'adresse mobile apparaît / disparaît
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---- Lenis (défilement fluide) */
  // Souris : lissage de la molette. Tactile : défilement avec inertie (syncTouch).
  let lenis = null;
  if (window.Lenis) {
    try {
      lenis = new window.Lenis({
        duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        syncTouch: !finePointer, syncTouchLerp: .085, touchInertiaMultiplier: 28,
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    } catch (e) { diag.errors.push("Lenis : " + e.message); lenis = null; }
  }
  window.__usmbScrollTo = (el) => (lenis ? lenis.scrollTo(el, { offset: -90 }) : el.scrollIntoView({ behavior: "smooth" }));
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(id === "#top" ? 0 : target, { offset: id === "#top" ? 0 : -90 }) : target.scrollIntoView({ behavior: "smooth" });
    })
  );

  navBehaviour(lenis);

  /* ---- Split des titres */
  const heroStage = splitChars($(".hero__stage"));
  const heroAutumn = splitChars($(".hero__autumn"));
  $$("section:not(.hero) [data-split]").forEach(splitChars);

  /* ---- Intro */
  gsap.set([heroStage, heroAutumn], { yPercent: 110 });
  gsap.set(".hero__glowline span", { scaleX: 0 });
  gsap.set([".hero__glowline em", ".hero__eyebrow", ".pill-card", ".hero__foot"], { autoAlpha: 0, y: 24 });
  gsap.set(".hero__media img", { scale: 1.35 });

  const count = { v: 0 };
  const loaderTl = gsap.timeline();
  loaderTl
    .to(count, {
      v: 100, duration: 1.5, ease: "power2.inOut",
      onUpdate: () => {
        const v = Math.round(count.v);
        const b = $(".loader__count b"); if (b) b.textContent = v;
        const f = $(".loader__fill"); if (f) f.style.clipPath = `inset(${100 - v}% 0 0 0)`;
      },
    })
    .to(".loader__crest", { scale: .9, duration: .5, ease: "power3.in" }, "+=.1")
    .addLabel("reveal", "-=.15")
    .to(".loader", { yPercent: -100, duration: 1, ease: "expo.inOut" }, "reveal")
    .to(".hero__media img", { scale: 1.12, duration: 2.2, ease: "expo.out" }, "<.2")
    .to(heroStage, { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: .05 }, "<.25")
    .to(heroAutumn, { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: .035 }, "<.15")
    .to(".hero__glowline span", { scaleX: 1, duration: 1.2, ease: "expo.out" }, "<.4")
    .to([".hero__eyebrow", ".hero__glowline em", ".pill-card", ".hero__foot"], { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: .07, clearProps: "transform" }, "<.1")
    .from(".nav", { yPercent: -100, autoAlpha: 0, duration: 1, ease: "expo.out", clearProps: "transform,opacity,visibility" }, "<")
    .from(".hero__arc", { rotate: -40, autoAlpha: 0, duration: 2.4, ease: "expo.out", transformOrigin: "50% 50%" }, "<")
    .call(() => lenis?.start(), null, "reveal+=.5")
    .call(hideLoader, null, "reveal+=1");

  /* ---- Hero au défilement */
  gsap.to(".hero__media img", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__inner", { yPercent: -18, autoAlpha: 0, filter: "blur(8px)", ease: "none", scrollTrigger: { trigger: ".hero", start: "20% top", end: "bottom top", scrub: true } });
  gsap.to(".hero__arc", { rotate: 50, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---- Marquee : accélère / inverse avec le défilement */
  const track = $(".marquee__track");
  if (track) {
    track.style.animation = "none";
    const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
    let dir = 1;
    ScrollTrigger.create({
      onUpdate: (self) => {
        const v = self.getVelocity();
        if (Math.abs(v) > 10) dir = v > 0 ? 1 : -1;
        gsap.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(v) / 400, 5)), duration: .3, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: .3 });
      },
    });
  }

  wordsAndCounters(gsap);

  /* ---- Titres de section */
  $$("section:not(.hero) .section-title").forEach((t) => {
    const chars = $$(".char", t);
    if (chars.length) gsap.from(chars, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: .025, scrollTrigger: { trigger: t, start: "top 85%" } });
    else gsap.from(t, { y: 60, autoAlpha: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: t, start: "top 85%" } });
  });
  gsap.utils.toArray("section:not(.hero) .eyebrow").forEach((e) =>
    gsap.from(e, { x: -20, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: e, start: "top 90%" } })
  );

  /* ---- Images : rideau + parallaxe */
  $$(".reveal-img").forEach((fig) => {
    const img = $("img", fig);
    gsap.fromTo(fig, { clipPath: "inset(18% 12% 18% 12% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "power2.out", scrollTrigger: { trigger: fig, start: "top 90%", end: "top 35%", scrub: 1 } });
    gsap.fromTo(img, { yPercent: -12, scale: 1.25 }, { yPercent: 0, scale: 1, ease: "none", scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from($(".stage__badge", fig), { yPercent: 100, autoAlpha: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: fig, start: "top 60%" } });
  });

  $$(".stage__body").forEach((body) =>
    gsap.from(body.children, { y: 50, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: .09, scrollTrigger: { trigger: body, start: "top 78%" } })
  );

  /* ---- Programme horizontal épinglé (ordinateur et mobile) */
  {
    const section = $(".programme");
    const trackEl = $(".programme__track");
    const distance = () => Math.max(0, trackEl.scrollWidth - window.innerWidth);
    section.classList.add("is-pinned");
    const tween = gsap.to(trackEl, {
      x: () => -distance(), ease: "none",
      scrollTrigger: {
        trigger: ".programme__pin", start: "top top", end: () => "+=" + distance() * (finePointer ? 1 : 1.3),
        pin: true, scrub: finePointer ? 1 : .6, invalidateOnRefresh: true, anticipatePin: 1,
      },
    });
    gsap.to(".programme__progress span", { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".programme__pin", start: "top top", end: () => "+=" + distance() * (finePointer ? 1 : 1.3), scrub: true, invalidateOnRefresh: true } });
    $$(".day").forEach((d, i) => {
      gsap.from(d, { rotate: i % 2 ? 4 : -4, y: 60, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: d, containerAnimation: tween, start: "left 95%" } });
      // Sur écran tactile : effet carrousel 3D, la carte au centre se redresse
      if (!finePointer) {
        gsap.set(d, { transformPerspective: 900 });
        gsap.timeline({ scrollTrigger: { trigger: d, containerAnimation: tween, start: "left right", end: "right left", scrub: true } })
          .fromTo(d, { rotateY: -22, scale: .88 }, { rotateY: 0, scale: 1, ease: "sine.out" })
          .to(d, { rotateY: 22, scale: .88, ease: "sine.in" });
      }
    });
  }

  /* ---- Inclinaison selon la vitesse de défilement (tous écrans) */
  const skewTargets = $$(".stage__media, .section-title");
  const skewTo = skewTargets.map((el) => gsap.quickTo(el, "skewY", { duration: .5, ease: "power3" }));
  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = gsap.utils.clamp(-5, 5, self.getVelocity() / -350);
      skewTo.forEach((fn) => fn(v));
      clearTimeout(skewTargets._t);
      skewTargets._t = setTimeout(() => skewTo.forEach((fn) => fn(0)), 120);
    },
  });

  /* ---- Infos, tarifs, formulaire */
  gsap.from(".info-card", { y: 70, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: .12, scrollTrigger: { trigger: ".infos__grid", start: "top 85%" } });
  gsap.from(".pricing__row", { y: 30, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: ".pricing", start: "top 85%" } });
  gsap.from(".form__group, .form > .btn", { y: 50, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: ".form", start: "top 85%" } });
  gsap.from(".signup__lead, .signup__total", { y: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: ".signup__intro", start: "top 80%" } });

  /* ---- Footer */
  gsap.from(".footer__big > *", { yPercent: 60, autoAlpha: 0, duration: 1.4, ease: "expo.out", stagger: .12, scrollTrigger: { trigger: ".footer", start: "top 85%" } });
  gsap.from(".footer__logo", { rotate: -25, scale: .6, autoAlpha: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".footer__row", start: "top 95%" } });

  /* ---- Curseur & boutons magnétiques */
  if (finePointer) {
    setupCursor(gsap, true);

    // Légère inclinaison 3D des cartes programme
    $$(".day").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        gsap.to(card, { y: -8, rotateY: ((e.clientX - r.left) / r.width - .5) * 8, rotateX: -((e.clientY - r.top) / r.height - .5) * 8, transformPerspective: 900, duration: .6, ease: "power3.out" });
      });
      card.addEventListener("pointerleave", () => gsap.to(card, { y: 0, rotateX: 0, rotateY: 0, duration: .8, ease: "elastic.out(1, .5)" }));
    });
  }

  /* ---- Équivalents tactiles : onde au toucher, boutons qui s'enfoncent */
  if (!finePointer) {
    document.addEventListener("pointerdown", (e) => {
      const r = document.createElement("span");
      r.className = "tap-ripple";
      r.style.left = e.clientX + "px";
      r.style.top = e.clientY + "px";
      document.body.appendChild(r);
      gsap.fromTo(r, { scale: 0, autoAlpha: .7 }, { scale: 1, autoAlpha: 0, duration: .8, ease: "expo.out", onComplete: () => r.remove() });
    }, { passive: true });
    $$(".btn, .pill-card, .choice__box, .info-card").forEach((el) => {
      el.addEventListener("pointerdown", () => gsap.to(el, { scale: .95, duration: .2, ease: "power3.out" }), { passive: true });
      const release = () => gsap.to(el, { scale: 1, duration: .7, ease: "elastic.out(1, .4)" });
      el.addEventListener("pointerup", release);
      el.addEventListener("pointercancel", release);
      el.addEventListener("pointerleave", release);
    });
  }

  window.addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

function navBehaviour(lenis) {
  const nav = $(".nav");
  let last = 0;
  const onScroll = (y) => {
    nav.classList.toggle("is-scrolled", y > 40);
    nav.classList.toggle("is-hidden", y > last && y > 400);
    last = y;
  };
  if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
}

// Les scripts sont en `defer` : le DOM et les librairies sont prêts.
try { init(); diag.init = "ok"; } catch (e) {
  console.error(e);
  diag.init = "erreur";
  diag.errors.push(e.message);
  // Ne jamais laisser de contenu masqué par une animation interrompue
  hideLoader();
  window.ScrollTrigger?.killAll();
  window.gsap?.globalTimeline.clear();
  $$("main [style], .nav[style]").forEach((el) => el.removeAttribute("style"));
}

/* ---- Diagnostic : ajouter #diag à l'adresse de la page */
function showDiag() {
  if (location.hash !== "#diag") return;
  let scrolls = 0;
  window.addEventListener("scroll", () => scrolls++, { passive: true });
  const box = document.createElement("pre");
  box.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:200;margin:0;padding:10px;border-radius:10px;background:rgba(0,0,0,.85);color:#9ff5bd;font:11px/1.45 ui-monospace,monospace;white-space:pre-wrap;pointer-events:none";
  document.body.appendChild(box);
  const render = () => {
    box.textContent = [
      "Version du site : " + VERSION,
      "Navigateur : " + navigator.userAgent.replace(/^Mozilla\/5\.0 /, "").slice(0, 90),
      "GSAP : " + (window.gsap ? window.gsap.version : "NON CHARGÉ"),
      "ScrollTrigger : " + (window.ScrollTrigger ? window.ScrollTrigger.getAll().length + " déclencheurs" : "NON CHARGÉ"),
      "Lenis : " + (window.Lenis ? "chargé" : "non chargé"),
      "Réduire les animations : " + (reduced ? "OUI → version douce" : "non") + " (réglage : " + CONFIG.animationsReduites + ")",
      "Pointeur souris : " + (finePointer ? "oui" : "non (tactile)"),
      "Fenêtre : " + innerWidth + "×" + innerHeight + (window.top !== window ? " (dans un cadre)" : ""),
      "Hauteur page : " + document.documentElement.scrollHeight + " · scrollY " + Math.round(scrollY) + " · évènements scroll " + scrolls,
      "Démarrage : " + (diag.init || "?"),
      "Erreurs : " + (diag.errors.length ? diag.errors.join(" | ") : "aucune"),
    ].join("\n");
  };
  render();
  setInterval(render, 500);
}
showDiag();
window.addEventListener("hashchange", showDiag);
