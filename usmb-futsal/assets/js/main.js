/* =========================================================
   US Méné-Bré Louargat — Tournoi futsal U17
   ========================================================= */

/* ---------- Configuration ---------- */
const CONFIG = {
  // Adresse qui reçoit les inscriptions. L'envoi passe par le service gratuit FormSubmit :
  // à la toute première inscription, FormSubmit envoie un e-mail « Activate Form » à cette
  // adresse ; cliquez le lien une fois, ensuite chaque inscription arrive directement.
  email: "usmenebre.ecoledefoot@gmail.com",
  autoReponse: "Merci ! Le club a bien reçu l'inscription de votre équipe au tournoi futsal U17 du mercredi 28 octobre (gymnase de Louargat, rendez-vous 16h30, coup d'envoi 17h30). Nous revenons vers vous pour la confirmer.",
  // "completes" : toutes les animations, même si l'appareil demande à les réduire · "douces" : fondus seulement
  animationsReduites: "completes",
};
const VERSION = "1";
// Rendez-vous : mercredi 28 octobre 2026, 16h30 heure de Paris (heure d'hiver, UTC+1)
const RDV = new Date("2026-10-28T16:30:00+01:00");
const FIN = new Date("2026-10-28T23:00:00+01:00");

const diag = { init: "", errors: [] };
window.addEventListener("error", (e) => diag.errors.push(e.message));
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = CONFIG.animationsReduites !== "completes" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduced) document.documentElement.classList.add("reduce-motion");
const finePointer = window.matchMedia("(pointer: fine)").matches;

$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

/* ---------- Compte à rebours ---------- */
(function countdown() {
  const root = $(".countdown");
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    const now = new Date();
    if (now >= RDV && now <= FIN) { $(".countdown__label", root).textContent = "En ce moment"; $(".countdown__value", root).textContent = "Le tournoi a commencé !"; return; }
    if (now > FIN) { $(".countdown__label", root).textContent = "Tournoi futsal U17"; $(".countdown__value", root).textContent = "Merci à toutes les équipes !"; return; }
    const d = RDV - now;
    $('[data-cd="d"]', root).textContent = pad(Math.floor(d / 864e5));
    $('[data-cd="h"]', root).textContent = pad(Math.floor((d / 36e5) % 24));
    $('[data-cd="m"]', root).textContent = pad(Math.floor((d / 6e4) % 60));
  }
  tick(); setInterval(tick, 30000);
})();

/* ---------- Inscription ---------- */
const form = $(".form");
const success = $(".success");

function recapText(fd) {
  return [
    "INSCRIPTION — TOURNOI FUTSAL U17 USMB",
    "Mercredi 28 octobre 2026 · Gymnase de Louargat · RDV 16h30",
    "",
    `Équipe : ${fd.get("equipe").trim()}`,
    `Catégorie : ${fd.get("categorie")}`,
    `Responsable : ${fd.get("responsable").trim()}`,
    `Téléphone : ${fd.get("tel").trim()}`,
    `E-mail : ${fd.get("email").trim()}`,
    fd.get("message").trim() ? `Message : ${fd.get("message").trim()}` : "",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n").trim();
}

async function send(fd, recap) {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${CONFIG.email}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `Inscription tournoi futsal U17 — ${fd.get("equipe").trim()} (${fd.get("categorie")})`,
        _template: "box",
        _captcha: "false",
        _autoresponse: CONFIG.autoReponse,
        Équipe: fd.get("equipe").trim(),
        Catégorie: fd.get("categorie"),
        Responsable: fd.get("responsable").trim(),
        Téléphone: fd.get("tel").trim(),
        email: fd.get("email").trim(),
        Message: fd.get("message").trim() || "—",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && String(data.success) === "true") return { ok: true };
    return { ok: false, message: data.message || `Erreur ${res.status}` };
  } catch (e) { return { ok: false, message: e.message }; }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $(".form__error");
  const fd = new FormData(form);
  const bad = [];
  $$(".field", form).forEach((f) => f.classList.remove("is-invalid"));
  $$("[required]", form).forEach((i) => { if (!i.checkValidity()) { i.closest(".field").classList.add("is-invalid"); bad.push(i); } });
  const catRow = $("[data-cat-row]");
  catRow.classList.toggle("is-invalid", !fd.get("categorie"));
  if (bad.length || !fd.get("categorie")) {
    err.textContent = !fd.get("categorie") && !bad.length ? "Choisissez la catégorie de l'équipe : U16 ou U17." : "Merci de compléter les champs en rouge (et de choisir U16 ou U17).";
    err.hidden = false;
    (bad[0] || form.querySelector('input[name="categorie"]')).focus({ preventScroll: true });
    window.__scrollTo?.(err);
    return;
  }
  err.hidden = true;
  const btn = form.querySelector('button[type="submit"]');
  const label = $(".btn__label", btn);
  btn.disabled = true; label.textContent = "Envoi en cours…";
  const recap = recapText(fd);
  const r = await send(fd, recap);
  btn.disabled = false; label.textContent = "Envoyer l'inscription";

  const msg = $(".success__msg");
  msg.textContent = "";
  if (r.ok) {
    $("[data-success-title]").innerHTML = 'Merci&nbsp;! <em class="serif">Inscription envoyée.</em>';
    msg.textContent = `Le club a bien reçu l'inscription de ${fd.get("equipe").trim()}. Une confirmation part à ${fd.get("email").trim()}. Rendez-vous le mercredi 28 octobre à 16h30 !`;
  } else {
    if (r.message) diag.errors.push("Envoi : " + r.message);
    $("[data-success-title]").innerHTML = 'Presque fini&nbsp;! <em class="serif">Envoyez ce récapitulatif.</em>';
    msg.append("L'envoi automatique n'a pas abouti. Copiez le récapitulatif et envoyez-le par e-mail à ",
      Object.assign(document.createElement("span"), { className: "success__mail", textContent: CONFIG.email }), ".");
    window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Inscription tournoi futsal U17 — " + fd.get("equipe").trim())}&body=${encodeURIComponent(recap)}`;
  }
  $(".success__recap").textContent = recap;
  form.hidden = true; success.hidden = false;
  success.focus({ preventScroll: true });
  window.__scrollTo?.(success);
});

$("[data-copy]").addEventListener("click", async (e) => {
  const btn = e.currentTarget, recap = $(".success__recap");
  try { await navigator.clipboard.writeText(recap.textContent); $(".btn__label", btn).textContent = "Copié"; }
  catch (_) { const r = document.createRange(); r.selectNodeContents(recap); const s = getSelection(); s.removeAllRanges(); s.addRange(r); $(".btn__label", btn).textContent = "Texte sélectionné"; }
});
$("[data-reset]").addEventListener("click", () => {
  form.reset(); success.hidden = true; form.hidden = false;
  $("[data-copy] .btn__label").textContent = "Copier le récapitulatif";
  window.__scrollTo?.(form);
});

// Barre d'inscription mobile : masquée quand le formulaire est à l'écran
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([en]) => $("[data-cta-bar]").classList.toggle("is-away", en.isIntersecting), { rootMargin: "0px 0px -25% 0px" }).observe($("#inscription"));
  new IntersectionObserver(([en]) => $("[data-cta-bar]").classList.toggle("is-hidden-top", en.isIntersecting)).observe($(".hero__cta"));
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
    const w = document.createElement("span");
    w.className = "word mask"; w.setAttribute("aria-hidden", "true");
    [...chunk].forEach((c) => { const ch = document.createElement("span"); ch.className = "char"; ch.textContent = c; w.appendChild(ch); });
    el.appendChild(w);
  });
  return $$(".char", el);
}
const hideLoader = () => $(".loader")?.remove();

function navBehaviour(lenis) {
  const nav = $(".nav"); let last = 0;
  const on = (y) => { nav.classList.toggle("is-scrolled", y > 40); nav.classList.toggle("is-hidden", y > last && y > 400); last = y; };
  if (lenis) lenis.on("scroll", ({ scroll }) => on(scroll)); else addEventListener("scroll", () => on(scrollY), { passive: true });
}

function init() {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger || reduced) {
    hideLoader(); navBehaviour();
    window.__scrollTo = (el) => el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  let lenis = null;
  if (window.Lenis) {
    try {
      lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), syncTouch: !finePointer, syncTouchLerp: .085, touchInertiaMultiplier: 28 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    } catch (e) { diag.errors.push("Lenis : " + e.message); lenis = null; }
  }
  window.__scrollTo = (el) => (lenis ? lenis.scrollTo(el, { offset: -90 }) : el.scrollIntoView({ behavior: "smooth" }));
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href"); const t = id === "#top" ? document.body : $(id); if (!t) return;
    e.preventDefault(); lenis ? lenis.scrollTo(id === "#top" ? 0 : t, { offset: id === "#top" ? 0 : -90 }) : t.scrollIntoView({ behavior: "smooth" });
  }));
  navBehaviour(lenis);

  const t1 = splitChars($(".futsal-title .t1"));
  const t2 = splitChars($(".futsal-title .t2"));
  $$("section:not(.hero) [data-split]").forEach(splitChars);

  /* ---- Intro */
  gsap.set(t1, { yPercent: 115 });
  gsap.set(t2, { yPercent: 115, rotate: 8 });
  gsap.set([".hero__date", ".hero__sub", ".hero__cta"], { autoAlpha: 0, y: 24 });
  gsap.set(".hero__photo", { clipPath: "inset(40% 8% 40% 8% round 24px)" });
  gsap.set(".beam", { xPercent: -60, autoAlpha: 0 });
  gsap.set(".hero__ball", { scale: 0, rotate: -120 });
  const count = { v: 0 };
  gsap.timeline()
    .to(count, { v: 100, duration: 1.3, ease: "power2.inOut", onUpdate: () => {
      const v = Math.round(count.v); const b = $(".loader__count b"); if (b) b.textContent = v;
      const f = $(".loader__fill"); if (f) f.style.clipPath = `inset(${100 - v}% 0 0 0)`;
    } })
    .to(".loader__crest", { scale: .9, duration: .45, ease: "power3.in" }, "+=.1")
    .addLabel("reveal", "-=.15")
    .to(".loader", { yPercent: -100, duration: 1, ease: "expo.inOut" }, "reveal")
    .to(".beam", { xPercent: 0, autoAlpha: 1, duration: 1.6, ease: "expo.out", stagger: .15 }, "reveal+=.4")
    .to(t1, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: .045 }, "reveal+=.45")
    .to(t2, { yPercent: 0, rotate: 0, duration: 1.4, ease: "expo.out", stagger: .05 }, "<.2")
    .to([".hero__date", ".hero__sub", ".hero__cta"], { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: .08, clearProps: "transform" }, "<.2")
    .to(".hero__ball", { scale: 1, rotate: 0, duration: 1.8, ease: "elastic.out(1, .55)" }, "<")
    .to(".hero__photo", { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.6, ease: "expo.inOut" }, "<")
    .from(".nav", { yPercent: -100, autoAlpha: 0, duration: 1, ease: "expo.out", clearProps: "transform,opacity,visibility" }, "<")
    .from(".hero__arc", { rotate: -40, autoAlpha: 0, duration: 2.4, ease: "expo.out", transformOrigin: "50% 50%" }, "<")
    .call(() => lenis?.start(), null, "reveal+=.5")
    .call(hideLoader, null, "reveal+=1");

  /* ---- Hero au défilement */
  gsap.to(".hero__photo img", { yPercent: -16, ease: "none", scrollTrigger: { trigger: ".hero__photo", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.to(".beam", { xPercent: 25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__ball", { rotate: 300, yPercent: 60, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__arc", { rotate: 50, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".futsal-title", { yPercent: -25, autoAlpha: .2, ease: "none", scrollTrigger: { trigger: ".hero", start: "10% top", end: "60% top", scrub: true } });

  /* ---- Marquee réactif */
  const track = $(".marquee__track");
  track.style.animation = "none";
  const loop = gsap.to(track, { xPercent: -50, duration: 34, ease: "none", repeat: -1 });
  let dir = 1;
  ScrollTrigger.create({ onUpdate: (self) => {
    const v = self.getVelocity(); if (Math.abs(v) > 10) dir = v > 0 ? 1 : -1;
    gsap.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(v) / 400, 5)), duration: .3, overwrite: true });
    gsap.to(loop, { timeScale: dir, duration: 1.2, delay: .3 });
  } });

  /* ---- Titres, cartes, déroulé */
  $$("section:not(.hero) .section-title").forEach((t) => gsap.from($$(".char", t), { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: .03, scrollTrigger: { trigger: t, start: "top 88%" } }));
  gsap.utils.toArray("section:not(.hero) .eyebrow").forEach((e) => gsap.from(e, { x: -20, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: e, start: "top 92%" } }));
  gsap.from(".card", { y: 80, rotate: (i) => (i % 2 ? 3 : -3), autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: ".cards", start: "top 85%" } });
  gsap.fromTo(".timeline__fill", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".timeline", start: "top 70%", end: "bottom 60%", scrub: true } });
  gsap.from(".step", { y: 50, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .15, scrollTrigger: { trigger: ".timeline", start: "top 78%" } });
  gsap.from(".order__lead, .signup__mail", { y: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: ".order__intro", start: "top 80%" } });
  gsap.from(".form__group, .form > .btn, .form__legal", { y: 50, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: ".form", start: "top 85%" } });
  gsap.from(".footer__big > *", { yPercent: 60, autoAlpha: 0, duration: 1.4, ease: "expo.out", stagger: .12, scrollTrigger: { trigger: ".footer", start: "top 85%" } });
  gsap.from(".footer__logo", { rotate: -25, scale: .6, autoAlpha: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".footer__row", start: "top 95%" } });

  /* ---- Souris */
  if (finePointer) {
    const cursor = $(".cursor"), label = $(".cursor__label");
    const xTo = gsap.quickTo(cursor, "x", { duration: .45, ease: "power3" }), yTo = gsap.quickTo(cursor, "y", { duration: .45, ease: "power3" });
    addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); });
    $$("[data-cursor]").forEach((el) => {
      el.addEventListener("pointerenter", () => { label.textContent = el.dataset.cursor; cursor.classList.add("is-hover"); });
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-hover"));
    });
    $$(".magnetic").forEach((el) => {
      const s = el.classList.contains("btn--xl") ? 10 : 22;
      const mx = gsap.quickTo(el, "x", { duration: .8, ease: "elastic.out(1, .4)" }), my = gsap.quickTo(el, "y", { duration: .8, ease: "elastic.out(1, .4)" });
      el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(); mx(((e.clientX - r.left) / r.width - .5) * s); my(((e.clientY - r.top) / r.height - .5) * s); });
      el.addEventListener("pointerleave", () => { mx(0); my(0); });
    });
    $$(".card").forEach((c) => {
      c.addEventListener("pointermove", (e) => { const r = c.getBoundingClientRect(); gsap.to(c, { y: -6, rotateY: ((e.clientX - r.left) / r.width - .5) * 10, rotateX: -((e.clientY - r.top) / r.height - .5) * 10, transformPerspective: 900, duration: .6, ease: "power3.out" }); });
      c.addEventListener("pointerleave", () => gsap.to(c, { y: 0, rotateX: 0, rotateY: 0, duration: .8, ease: "elastic.out(1, .5)" }));
    });
    const bx = gsap.quickTo(".beam", "x", { duration: 1.2, ease: "power3" });
    const ballX = gsap.quickTo(".hero__ball", "x", { duration: 1, ease: "power3" }), ballY = gsap.quickTo(".hero__ball", "y", { duration: 1, ease: "power3" });
    $(".hero").addEventListener("pointermove", (e) => { const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5; bx(nx * 120); ballX(nx * -50); ballY(ny * -40); });
  } else {
    /* ---- Doigt */
    document.addEventListener("pointerdown", (e) => {
      const r = document.createElement("span"); r.className = "tap-ripple";
      r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px"; document.body.appendChild(r);
      gsap.fromTo(r, { scale: 0, autoAlpha: .7 }, { scale: 1, autoAlpha: 0, duration: .8, ease: "expo.out", onComplete: () => r.remove() });
      const el = e.target.closest(".btn, .card, .seg label, .cta-bar"); if (!el) return;
      gsap.to(el, { scale: .95, duration: .2, ease: "power3.out" });
      const up = () => { gsap.to(el, { scale: 1, duration: .7, ease: "elastic.out(1, .4)" }); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); el.removeEventListener("pointerleave", up); };
      el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); el.addEventListener("pointerleave", up);
    }, { passive: true });
  }

  addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

try { init(); diag.init = "ok"; } catch (e) {
  console.error(e); diag.init = "erreur"; diag.errors.push(e.message);
  hideLoader(); window.ScrollTrigger?.killAll(); window.gsap?.globalTimeline.clear();
  $$("main [style], .nav[style]").forEach((el) => el.removeAttribute("style"));
}

/* ---- Diagnostic : #diag à la fin de l'adresse */
function showDiag() {
  if (location.hash !== "#diag" || $(".diag")) return;
  const box = document.createElement("pre"); box.className = "diag";
  box.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:200;margin:0;padding:10px;border-radius:10px;background:rgba(0,0,0,.85);color:#9ff5bd;font:11px/1.45 ui-monospace,monospace;white-space:pre-wrap;pointer-events:none";
  document.body.appendChild(box);
  const render = () => { box.textContent = [
    "Version : " + VERSION, "Navigateur : " + navigator.userAgent.replace(/^Mozilla\/5\.0 /, "").slice(0, 90),
    "GSAP : " + (window.gsap ? gsap.version : "NON CHARGÉ") + " · Réduire les animations : " + (matchMedia("(prefers-reduced-motion: reduce)").matches ? "oui" : "non"),
    "Démarrage : " + (diag.init || "?") + " · Erreurs : " + (diag.errors.join(" | ") || "aucune"),
  ].join("\n"); };
  render(); setInterval(render, 500);
}
showDiag(); addEventListener("hashchange", showDiag);
