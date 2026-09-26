/* =========================================================
   US Méné-Bré Louargat — La boutique
   ========================================================= */

/* ---------- Configuration à adapter par le club ---------- */
const CONFIG = {
  // Adresse qui reçoit les demandes d'achat.
  // L'envoi passe par le service gratuit FormSubmit (formsubmit.co) : à la toute première
  // demande, FormSubmit envoie un e-mail « Activate Form » à cette adresse. Cliquez le lien
  // une seule fois, ensuite chaque demande arrive directement dans la boîte.
  email: "A_REMPLACER@usmb-louargat.fr",
  // Message envoyé automatiquement à l'acheteur (copie de confirmation).
  autoReponse: "Merci ! Le club a bien reçu votre demande d'achat. Nous revenons vers vous pour la confirmer. Allez Louargat !",
  // Animations quand l'appareil demande à « réduire les animations » :
  //  "completes" → toutes les animations · "douces" → fondus seulement
  animationsReduites: "completes",
};

// Version du site : à augmenter avec les ?v= de index.html à chaque mise à jour
const VERSION = "2";

/* ---------- Catalogue (prix de la liste du club) ---------- */
const TAILLES = {
  adulte: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  enfant: ["6 ans", "8 ans", "10 ans", "12 ans", "14 ans"],
};
const CATS = { hauts: "Maillots & sweats", vestes: "Vestes", pantalons: "Pantalons", accessoires: "Sac" };
const PRODUCTS = [
  { id: "maillot", nom: "Maillot", cat: "hauts", adulte: 15, enfant: 12, img: "maillot-vert", couleurs: [
    { id: "vert", nom: "Vert", hex: "#1f9d55", img: "maillot-vert" },
    { id: "noir", nom: "Noir", hex: "#111", img: "maillot-noir" },
  ], tag: "Vert ou noir" },
  { id: "sous-maillot", nom: "Sous-maillot", cat: "hauts", adulte: 25, enfant: 20, img: "sous-maillot" },
  { id: "sweat-coton", nom: "Sweat coton", cat: "hauts", adulte: 40, enfant: 35, img: "sweat-coton" },
  { id: "sweat-capuche", nom: "Sweat capuche", cat: "hauts", adulte: 40, enfant: null, img: "sweat-capuche" },
  { id: "sweat-quart-zip", nom: "Sweat ¼ zip", cat: "hauts", adulte: 25, enfant: 23, img: "sweat-quart-zip" },
  { id: "coupe-vent", nom: "Coupe-vent", cat: "vestes", adulte: 25, enfant: 21, img: "coupe-vent" },
  { id: "softshell", nom: "Softshell", cat: "vestes", adulte: 60, enfant: 53, img: "softshell" },
  { id: "doudoune", nom: "Doudoune", cat: "vestes", adulte: 65, enfant: 56, img: "doudoune" },
  { id: "parka", nom: "Parka", cat: "vestes", adulte: 70, enfant: 63, img: "parka" },
  { id: "pantalon-coton", nom: "Pantalon coton", cat: "pantalons", adulte: 30, enfant: 25, img: "pantalon-coton" },
  { id: "pantalon-poly", nom: "Pantalon poly", cat: "pantalons", adulte: 30, enfant: null, img: "pantalon-poly" },
  { id: "pantalon-entrainement", nom: "Pantalon d'entraînement", cat: "pantalons", adulte: 25, enfant: 20, img: "pantalon-entrainement" },
  { id: "sac-a-dos", nom: "Sac à dos", cat: "accessoires", adulte: 20, enfant: 16, img: "sac-a-dos", tailleUnique: true },
];
const IMG = (name) => `assets/img/produits/${name}.jpg`;
const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

const diag = { init: "", errors: [] };
window.addEventListener("error", (e) => diag.errors.push(e.message));
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = CONFIG.animationsReduites !== "completes" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduced) document.documentElement.classList.add("reduce-motion");
const finePointer = window.matchMedia("(pointer: fine)").matches;
const euros = (n) => String(n).replace(".", ",");

/* =========================================================
   Catalogue, tarifs
   ========================================================= */
$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

(function renderCatalogue() {
  const grid = $("[data-grid]");
  grid.innerHTML = PRODUCTS.map((p, i) => `
    <article class="product" data-cat="${p.cat}">
      <button class="product__media" type="button" data-open="${p.id}" aria-label="Choisir : ${p.nom}">
        <img src="${IMG(p.img)}" alt="${p.nom} aux couleurs de l'USMB" loading="lazy" width="800" height="800">
        ${p.tag ? `<span class="product__tag">${p.tag}</span>` : ""}
        <span class="product__num">${String(i + 1).padStart(2, "0")}</span>
      </button>
      <div class="product__body">
        <h3 class="product__name">${p.nom}</h3>
        <p class="product__prices">
          <span><small>Adulte</small>${p.adulte} €</span>
          <span class="${p.enfant ? "" : "is-na"}"><small>Enfant</small>${p.enfant ? p.enfant + " €" : "—"}</span>
        </p>
        <button class="product__add" type="button" data-open="${p.id}" data-cursor="+"><span>Ajouter</span><span aria-hidden="true">+</span></button>
      </div>
    </article>`).join("");

  $("[data-price-table]").innerHTML = PRODUCTS.map((p) => `
    <tr>
      <td>${p.nom}${p.couleurs ? `<small>${p.couleurs.map((c) => c.nom).join(" ou ")}</small>` : ""}${p.enfant ? "" : "<small>Adulte uniquement</small>"}</td>
      <td>${p.adulte} €</td>
      <td class="${p.enfant ? "" : "is-na"}">${p.enfant ? p.enfant + " €" : "—"}</td>
    </tr>`).join("");
})();

// Filtres
$$(".filter").forEach((btn) =>
  btn.addEventListener("click", () => {
    const f = btn.dataset.filter;
    $$(".filter").forEach((b) => { b.classList.toggle("is-active", b === btn); b.setAttribute("aria-pressed", b === btn); });
    const shown = [];
    $$(".product").forEach((card) => {
      const on = f === "tout" || card.dataset.cat === f;
      card.hidden = !on;
      if (on) shown.push(card);
    });
    if (window.gsap && !reduced) gsap.fromTo(shown, { y: 30, autoAlpha: 0, scale: .96 }, { y: 0, autoAlpha: 1, scale: 1, duration: .7, ease: "expo.out", stagger: .05, clearProps: "transform" });
    window.ScrollTrigger?.refresh();
  })
);

/* =========================================================
   Panier (gardé dans le navigateur)
   ========================================================= */
const STORE_KEY = "usmb-boutique-panier";
let cart = [];
try { cart = JSON.parse(localStorage.getItem(STORE_KEY) || "[]").filter((l) => byId[l.id]); } catch (_) { cart = []; }
const saveCart = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (_) {} };

const unitPrice = (l) => byId[l.id][l.gamme];
const lineLabel = (l) => {
  const p = byId[l.id];
  const coul = l.couleur ? p.couleurs.find((c) => c.id === l.couleur).nom.toLowerCase() : "";
  return [p.nom + (coul ? " " + coul : ""), l.gamme === "adulte" ? "Adulte" : "Enfant", l.taille].filter(Boolean).join(" · ");
};
const lineImg = (l) => {
  const p = byId[l.id];
  return IMG(l.couleur ? p.couleurs.find((c) => c.id === l.couleur).img : p.img);
};
const cartCount = () => cart.reduce((n, l) => n + l.qty, 0);
const cartTotal = () => cart.reduce((n, l) => n + l.qty * unitPrice(l), 0);

function addToCart(line) {
  const same = cart.find((l) => l.id === line.id && l.gamme === line.gamme && l.taille === line.taille && l.couleur === line.couleur);
  if (same) same.qty = Math.min(20, same.qty + line.qty);
  else cart.push(line);
  saveCart(); renderCart(true);
}

function renderCart(bump) {
  const list = $("[data-basket]");
  list.innerHTML = cart.map((l, i) => `
    <li class="basket__line">
      <img src="${lineImg(l)}" alt="" width="56" height="56">
      <div class="basket__info"><b>${byId[l.id].nom}</b><span>${lineLabel(l).split(" · ").slice(1).join(" · ")}${l.couleur ? " · " + byId[l.id].couleurs.find((c) => c.id === l.couleur).nom : ""}</span></div>
      <div class="basket__side">
        <span class="basket__price">${l.qty * unitPrice(l)} €</span>
        <span class="basket__ctrl">
          <button type="button" data-line="${i}" data-step="-1" aria-label="Retirer un ${byId[l.id].nom}">${l.qty > 1 ? "−" : '<svg class="ico" viewBox="0 0 24 24"><use href="#i-trash"/></svg>'}</button>
          <output>${l.qty}</output>
          <button type="button" data-line="${i}" data-step="1" aria-label="Ajouter un ${byId[l.id].nom}">+</button>
        </span>
      </div>
    </li>`).join("");
  $("[data-basket-empty]").hidden = cart.length > 0;
  $("[data-total]").textContent = euros(cartTotal());
  $$("[data-cart-count]").forEach((el) => {
    el.textContent = cartCount();
    if (bump) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  });
  $$("[data-cart-total]").forEach((el) => (el.textContent = euros(cartTotal())));
  const bar = $("[data-cart-bar]");
  bar.hidden = cart.length === 0 || !$(".success").hidden;
}

$("[data-basket]").addEventListener("click", (e) => {
  const b = e.target.closest("[data-line]");
  if (!b) return;
  const l = cart[Number(b.dataset.line)];
  l.qty += Number(b.dataset.step);
  if (l.qty <= 0) cart.splice(Number(b.dataset.line), 1);
  l.qty = Math.min(20, l.qty);
  saveCart(); renderCart();
});
renderCart();

// La barre panier mobile s'efface quand la section commande est à l'écran
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => $("[data-cart-bar]").classList.toggle("is-away", entry.isIntersecting), { rootMargin: "0px 0px -30% 0px" }).observe($("#commande"));
}

/* =========================================================
   Configurateur (choix version, couleur, taille, quantité)
   ========================================================= */
const sheet = $("[data-sheet]");
const state = { id: null, gamme: "adulte", taille: null, couleur: null, qty: 1 };
let lastFocus = null;

function sheetPrice() { $("[data-sheet-price]").textContent = byId[state.id][state.gamme] * state.qty; }

function renderSizes() {
  const p = byId[state.id];
  const box = $("[data-tailles]");
  if (p.tailleUnique) {
    state.taille = "Taille unique";
    box.innerHTML = `<label><input type="radio" name="taille" value="Taille unique" checked><span>Taille unique</span></label>`;
  } else {
    if (!TAILLES[state.gamme].includes(state.taille)) state.taille = null;
    box.innerHTML = TAILLES[state.gamme].map((t) => `<label><input type="radio" name="taille" value="${t}" ${t === state.taille ? "checked" : ""}><span>${t}</span></label>`).join("");
  }
  $("[data-taille-hint]").textContent = state.gamme === "enfant" && !p.tailleUnique ? "· selon l'âge" : "";
}

function openSheet(id, trigger) {
  const p = byId[id];
  Object.assign(state, { id, gamme: "adulte", taille: null, couleur: p.couleurs ? p.couleurs[0].id : null, qty: 1 });
  lastFocus = trigger || document.activeElement;
  $("[data-sheet-title]").textContent = p.nom;
  $("[data-sheet-cat]").textContent = CATS[p.cat];
  const img = $("[data-sheet-img]");
  img.src = IMG(p.couleurs ? p.couleurs[0].img : p.img);
  img.alt = p.nom;
  const enfant = sheet.querySelector('input[name="gamme"][value="enfant"]');
  enfant.disabled = !p.enfant;
  sheet.querySelector('input[name="gamme"][value="adulte"]').checked = true;
  $("[data-opt-gamme] .opt__label").textContent = p.enfant ? "Version" : "Version · adulte uniquement";
  $("[data-opt-couleur]").hidden = !p.couleurs;
  if (p.couleurs) $("[data-couleurs]").innerHTML = p.couleurs.map((c, i) => `<label><input type="radio" name="couleur" value="${c.id}" ${i ? "" : "checked"}><span><i style="background:${c.hex}"></i>${c.nom}</span></label>`).join("");
  renderSizes();
  $("[data-qty-value]").textContent = 1;
  $(".sheet__error").hidden = true;
  sheetPrice();
  sheet.hidden = false;
  document.documentElement.style.overflow = "hidden";
  window.__lenis?.stop();
  if (window.gsap && !reduced) {
    gsap.fromTo(".sheet__backdrop", { autoAlpha: 0 }, { autoAlpha: 1, duration: .4 });
    gsap.fromTo(".sheet__panel", { y: 60, autoAlpha: 0, scale: .97 }, { y: 0, autoAlpha: 1, scale: 1, duration: .7, ease: "expo.out" });
    gsap.fromTo(".sheet__body > *", { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .6, ease: "expo.out", stagger: .04, delay: .1 });
  }
  setTimeout(() => $(".sheet__close").focus({ preventScroll: true }), 50);
}

function closeSheet() {
  const done = () => {
    sheet.hidden = true;
    document.documentElement.style.overflow = "";
    window.__lenis?.start();
    lastFocus?.focus?.({ preventScroll: true });
  };
  if (window.gsap && !reduced) {
    gsap.to(".sheet__panel", { y: 40, autoAlpha: 0, duration: .35, ease: "power2.in" });
    gsap.to(".sheet__backdrop", { autoAlpha: 0, duration: .35, onComplete: done });
  } else done();
}

document.addEventListener("click", (e) => {
  const open = e.target.closest("[data-open]");
  if (open) openSheet(open.dataset.open, open);
  if (e.target.closest("[data-close]")) closeSheet();
});
document.addEventListener("keydown", (e) => {
  if (sheet.hidden) return;
  if (e.key === "Escape") closeSheet();
  if (e.key === "Tab") {
    const f = $$('button, input:not(:disabled), [tabindex]:not([tabindex="-1"])', sheet).filter((el) => el.offsetParent);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});

sheet.addEventListener("change", (e) => {
  const t = e.target;
  if (t.name === "gamme") { state.gamme = t.value; renderSizes(); sheetPrice(); }
  if (t.name === "taille") { state.taille = t.value; $(".sheet__error").hidden = true; }
  if (t.name === "couleur") {
    state.couleur = t.value;
    const img = $("[data-sheet-img]");
    const src = IMG(byId[state.id].couleurs.find((c) => c.id === t.value).img);
    if (window.gsap && !reduced) gsap.to(img, { autoAlpha: 0, scale: .94, duration: .18, onComplete: () => { img.src = src; gsap.to(img, { autoAlpha: 1, scale: 1, duration: .45, ease: "expo.out" }); } });
    else img.src = src;
  }
});
$$("[data-qty]").forEach((b) => b.addEventListener("click", () => {
  state.qty = Math.max(1, Math.min(20, state.qty + Number(b.dataset.qty)));
  $("[data-qty-value]").textContent = state.qty;
  sheetPrice();
}));

$("[data-add]").addEventListener("click", () => {
  if (!state.taille) {
    $(".sheet__error").hidden = false;
    if (window.gsap && !reduced) gsap.fromTo("[data-tailles]", { x: -8 }, { x: 0, duration: .5, ease: "elastic.out(1, .3)" });
    return;
  }
  addToCart({ id: state.id, gamme: state.gamme, taille: state.taille, couleur: state.couleur, qty: state.qty });
  flyToCart($("[data-sheet-img]"));
  closeSheet();
});

// Vignette qui vole vers le bouton panier
function flyToCart(img) {
  if (!window.gsap || reduced) return;
  const from = img.getBoundingClientRect();
  const bar = $("[data-cart-bar]");
  const target = (!bar.hidden && getComputedStyle(bar).display !== "none" ? bar : $(".cart-btn")).getBoundingClientRect();
  const clone = Object.assign(document.createElement("img"), { src: img.src, className: "fly", alt: "" });
  const size = Math.min(from.width, 220);
  Object.assign(clone.style, { left: from.left + (from.width - size) / 2 + "px", top: from.top + (from.height - size) / 2 + "px", width: size + "px", height: size + "px" });
  document.body.appendChild(clone);
  gsap.to(clone, {
    x: target.left + target.width / 2 - (from.left + from.width / 2),
    y: target.top + target.height / 2 - (from.top + from.height / 2),
    scale: .12, rotate: 25, duration: .9, ease: "power3.in",
    onComplete: () => clone.remove(),
  });
}

/* =========================================================
   Envoi de la demande d'achat
   ========================================================= */
const form = $(".form");
const success = $(".success");

function recapText(fd) {
  const lines = cart.map((l) => `• ${l.qty} × ${lineLabel(l)} — ${l.qty * unitPrice(l)} €`);
  return [
    "DEMANDE D'ACHAT — BOUTIQUE USMB",
    "",
    ...lines,
    "",
    `TOTAL : ${cartTotal()} €`,
    "",
    `Nom : ${fd.get("nom").trim()}`,
    `Téléphone : ${fd.get("tel").trim()}`,
    `E-mail : ${fd.get("email").trim()}`,
    fd.get("joueur").trim() ? `Pour : ${fd.get("joueur").trim()}${fd.get("categorie").trim() ? " (" + fd.get("categorie").trim() + ")" : ""}` : "",
    fd.get("message").trim() ? `Message : ${fd.get("message").trim()}` : "",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n").trim();
}

async function sendOrder(fd, recap) {
  if (!CONFIG.email || CONFIG.email.includes("A_REMPLACER")) return { ok: false, reason: "config" };
  const payload = {
    _subject: `Demande d'achat boutique — ${fd.get("nom").trim()} — ${cartTotal()} €`,
    _template: "box",
    _captcha: "false",
    _autoresponse: CONFIG.autoReponse,
    Nom: fd.get("nom").trim(),
    Téléphone: fd.get("tel").trim(),
    email: fd.get("email").trim(),
    Joueur: fd.get("joueur").trim() || "—",
    Catégorie: fd.get("categorie").trim() || "—",
    Commande: cart.map((l) => `${l.qty} × ${lineLabel(l)} = ${l.qty * unitPrice(l)} €`).join("\n"),
    Total: `${cartTotal()} €`,
    Message: fd.get("message").trim() || "—",
    Récapitulatif: recap,
  };
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${CONFIG.email.trim()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && String(data.success) === "true") return { ok: true };
    return { ok: false, reason: "service", message: data.message || `Erreur ${res.status}` };
  } catch (e) {
    return { ok: false, reason: "network", message: e.message };
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $(".form__error");
  const fd = new FormData(form);
  const bad = [];
  $$(".field", form).forEach((f) => f.classList.remove("is-invalid"));
  $$("[required]", form).forEach((input) => { if (!input.checkValidity()) { input.closest(".field").classList.add("is-invalid"); bad.push(input); } });
  let msg = "";
  if (!cart.length) msg = "Votre panier est vide : ajoutez au moins un article depuis la collection.";
  else if (bad.length) msg = "Merci de compléter les champs en rouge (nom, téléphone et e-mail valide).";
  if (msg) {
    err.textContent = msg; err.hidden = false;
    if (bad[0]) bad[0].focus({ preventScroll: true });
    window.__usmbScrollTo?.(cart.length ? err : $("#collection"));
    return;
  }
  err.hidden = true;

  const btn = form.querySelector('button[type="submit"]');
  const label = $(".btn__label", btn);
  btn.disabled = true; label.textContent = "Envoi en cours…";
  const recap = recapText(fd);
  const result = await sendOrder(fd, recap);
  btn.disabled = false; label.textContent = "Envoyer ma demande d'achat";

  const msgEl = $(".success__msg");
  msgEl.textContent = "";
  if (result.ok) {
    $("[data-success-title]").innerHTML = 'Merci&nbsp;! <em class="serif">Demande envoyée au club.</em>';
    msgEl.textContent = `Le club a reçu votre demande et vous recontacte pour la confirmer. Une copie de confirmation part à ${fd.get("email").trim()}.`;
  } else {
    $("[data-success-title]").innerHTML = 'Presque fini&nbsp;! <em class="serif">Envoyez ce récapitulatif.</em>';
    msgEl.append(
      result.reason === "config" ? "L'envoi automatique n'est pas encore configuré. " : "L'envoi automatique n'a pas abouti. ",
      "Copiez le récapitulatif ci-dessous et envoyez-le par e-mail au club",
      ...(CONFIG.email.includes("A_REMPLACER") ? ["."] : [" : ", Object.assign(document.createElement("span"), { className: "success__mail", textContent: CONFIG.email }), "."])
    );
    if (result.message) diag.errors.push("Envoi : " + result.message);
    if (!CONFIG.email.includes("A_REMPLACER")) {
      window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Demande d'achat boutique — " + fd.get("nom").trim())}&body=${encodeURIComponent(recap)}`;
    }
  }
  $(".success__recap").textContent = recap;
  form.hidden = true;
  success.hidden = false;
  if (result.ok) { cart = []; saveCart(); renderCart(); }
  $("[data-cart-bar]").hidden = true;
  success.focus({ preventScroll: true });
  window.__usmbScrollTo?.(success);
});

$("[data-copy]").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  const recap = $(".success__recap");
  try { await navigator.clipboard.writeText(recap.textContent); $(".btn__label", btn).textContent = "Copié"; }
  catch (_) {
    const r = document.createRange(); r.selectNodeContents(recap);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    $(".btn__label", btn).textContent = "Texte sélectionné";
  }
});
$("[data-reset]").addEventListener("click", () => {
  success.hidden = true; form.hidden = false;
  $("[data-copy] .btn__label").textContent = "Copier le récapitulatif";
  renderCart();
  window.__usmbScrollTo?.(cart.length ? form : $("#collection"));
});

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

function hideLoader() { $(".loader")?.remove(); }

function navBehaviour(lenis) {
  const nav = $(".nav");
  let last = 0;
  const onScroll = (y) => {
    nav.classList.toggle("is-scrolled", y > 40);
    nav.classList.toggle("is-hidden", y > last && y > 400 && sheet.hidden);
    last = y;
  };
  if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
}

function setupCursor(gsap, magnetic) {
  const cursor = $(".cursor");
  const label = $(".cursor__label");
  const xTo = gsap.quickTo(cursor, "x", { duration: .45, ease: "power3" });
  const yTo = gsap.quickTo(cursor, "y", { duration: .45, ease: "power3" });
  window.addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); });
  document.addEventListener("pointerover", (e) => {
    const el = e.target.closest("[data-cursor], .product__media");
    if (el) { label.textContent = el.dataset.cursor || "Voir"; cursor.classList.add("is-hover"); }
    else cursor.classList.remove("is-hover");
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

function lightMotion(gsap, ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  hideLoader();
  window.__usmbScrollTo = (el) => el.scrollIntoView({ block: "start" });
  navBehaviour();
  gsap.from([".hero__inner", ".hero__floats", ".hero__foot"], { autoAlpha: 0, duration: 1.2, stagger: .2 });
  $$(".section-head, .collection__head, .product, .price-table tbody tr, .order__intro, .form__group, .footer__big").forEach((el) =>
    gsap.from(el, { autoAlpha: 0, duration: .9, scrollTrigger: { trigger: el, start: "top 94%", once: true } })
  );
  if (finePointer) setupCursor(gsap, false);
}

function init() {
  const { gsap, ScrollTrigger } = window;
  if (gsap && ScrollTrigger && reduced) { lightMotion(gsap, ScrollTrigger); return; }
  if (!gsap || !ScrollTrigger) {
    hideLoader();
    window.__usmbScrollTo = (el) => el.scrollIntoView({ behavior: "smooth", block: "start" });
    navBehaviour();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---- Défilement fluide (souris et doigt) */
  let lenis = null;
  if (window.Lenis) {
    try {
      lenis = new window.Lenis({
        duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        syncTouch: !finePointer, syncTouchLerp: .085, touchInertiaMultiplier: 28,
        prevent: (node) => !!node.closest?.(".sheet, .basket__list"),
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
      window.__lenis = lenis;
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

  /* ---- Titres */
  const heroA = splitChars($(".hero__stage"));
  const heroB = splitChars($(".hero__autumn"));
  $$("section:not(.hero) [data-split]").forEach(splitChars);

  /* ---- Intro */
  gsap.set([heroA, heroB], { yPercent: 110 });
  gsap.set(".hero__glowline span", { scaleX: 0 });
  gsap.set([".hero__glowline em", ".hero__eyebrow", ".hero__cta", ".hero__foot"], { autoAlpha: 0, y: 24 });
  gsap.set(".float", { autoAlpha: 0, scale: .4, y: 80 });

  const count = { v: 0 };
  gsap.timeline()
    .to(count, {
      v: 100, duration: 1.4, ease: "power2.inOut",
      onUpdate: () => {
        const v = Math.round(count.v);
        const b = $(".loader__count b"); if (b) b.textContent = v;
        const f = $(".loader__fill"); if (f) f.style.clipPath = `inset(${100 - v}% 0 0 0)`;
      },
    })
    .to(".loader__crest", { scale: .9, duration: .5, ease: "power3.in" }, "+=.1")
    .addLabel("reveal", "-=.15")
    .to(".loader", { yPercent: -100, duration: 1, ease: "expo.inOut" }, "reveal")
    .to(heroA, { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: .045 }, "reveal+=.45")
    .to(heroB, { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: .04 }, "<.15")
    .to(".float", { autoAlpha: 1, scale: 1, y: 0, duration: 1.6, ease: "elastic.out(1, .6)", stagger: .1 }, "<.1")
    .to(".hero__glowline span", { scaleX: 1, duration: 1.2, ease: "expo.out" }, "<.2")
    .to([".hero__eyebrow", ".hero__glowline em", ".hero__cta", ".hero__foot"], { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: .07, clearProps: "transform" }, "<.1")
    .from(".nav", { yPercent: -100, autoAlpha: 0, duration: 1, ease: "expo.out", clearProps: "transform,opacity,visibility" }, "<")
    .from(".hero__arc", { rotate: -40, autoAlpha: 0, duration: 2.4, ease: "expo.out", transformOrigin: "50% 50%" }, "<")
    .call(() => lenis?.start(), null, "reveal+=.5")
    .call(hideLoader, null, "reveal+=1");

  /* ---- Articles flottants : lévitation, parallaxe au défilement et à la souris */
  $$(".float").forEach((f, i) => {
    const img = $("img", f);
    gsap.to(img, { yPercent: i % 2 ? 4 : -4, rotate: i % 2 ? 2 : -2, duration: 2.6 + i * .4, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to(f, { y: () => -window.innerHeight * .35 * Number(f.dataset.depth), ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  });
  if (finePointer) {
    const movers = $$(".float").map((f) => ({ d: Number(f.dataset.depth), x: gsap.quickTo($("img", f), "x", { duration: 1, ease: "power3" }) }));
    $(".hero").addEventListener("pointermove", (e) => {
      const nx = e.clientX / window.innerWidth - .5, ny = e.clientY / window.innerHeight - .5;
      movers.forEach((m) => { m.x(nx * 40 * m.d); });
      gsap.to(".hero__floats", { rotateY: nx * 6, rotateX: -ny * 6, transformPerspective: 1200, duration: 1, ease: "power3.out" });
    });
  }
  gsap.to(".hero__inner", { yPercent: -16, autoAlpha: 0, filter: "blur(8px)", ease: "none", scrollTrigger: { trigger: ".hero", start: "25% top", end: "bottom top", scrub: true } });
  gsap.to(".hero__arc", { rotate: 50, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---- Marquee réactif à la vitesse */
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

  /* ---- Titres de section et sur-titres */
  $$("section:not(.hero) .section-title").forEach((t) =>
    gsap.from($$(".char", t), { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: .03, scrollTrigger: { trigger: t, start: "top 88%" } })
  );
  gsap.utils.toArray("section:not(.hero) .eyebrow").forEach((e) =>
    gsap.from(e, { x: -20, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: e, start: "top 92%" } })
  );
  gsap.from(".filter", { y: 20, autoAlpha: 0, duration: .8, ease: "expo.out", stagger: .05, scrollTrigger: { trigger: ".filters", start: "top 92%" } });

  /* ---- Cartes articles : apparition en cascade + inclinaison selon la vitesse */
  gsap.set(".product", { y: 70, autoAlpha: 0, rotate: () => gsap.utils.random(-3, 3) });
  ScrollTrigger.batch(".product", {
    start: "top 92%",
    onEnter: (els) => gsap.to(els, { y: 0, autoAlpha: 1, rotate: 0, duration: 1.1, ease: "expo.out", stagger: .08, overwrite: true }),
  });
  const skewers = [gsap.quickTo(".grid", "skewY", { duration: .5, ease: "power3" }), gsap.quickTo(".price-table", "skewY", { duration: .5, ease: "power3" })];
  let skewT;
  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = gsap.utils.clamp(-3, 3, self.getVelocity() / -500);
      skewers.forEach((fn) => fn(v));
      clearTimeout(skewT);
      skewT = setTimeout(() => skewers.forEach((fn) => fn(0)), 120);
    },
  });

  /* ---- Tarifs, commande, pied de page */
  gsap.from(".price-table tbody tr", { x: -40, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: .05, scrollTrigger: { trigger: ".price-table", start: "top 85%" } });
  gsap.from(".order__lead, .basket", { y: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: ".order__intro", start: "top 80%" } });
  gsap.from(".form__group, .form > .btn, .form__legal", { y: 50, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: ".form", start: "top 85%" } });
  gsap.from(".footer__big > *", { yPercent: 60, autoAlpha: 0, duration: 1.4, ease: "expo.out", stagger: .12, scrollTrigger: { trigger: ".footer", start: "top 85%" } });
  gsap.from(".footer__logo", { rotate: -25, scale: .6, autoAlpha: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".footer__row", start: "top 95%" } });

  /* ---- Souris : curseur, boutons magnétiques, cartes inclinables */
  if (finePointer) {
    setupCursor(gsap, true);
    $$(".product").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        gsap.to(card, { y: -6, rotateY: ((e.clientX - r.left) / r.width - .5) * 8, rotateX: -((e.clientY - r.top) / r.height - .5) * 8, transformPerspective: 900, duration: .6, ease: "power3.out" });
      });
      card.addEventListener("pointerleave", () => gsap.to(card, { y: 0, rotateX: 0, rotateY: 0, duration: .8, ease: "elastic.out(1, .5)" }));
    });
  }

  /* ---- Doigt : onde au toucher, éléments qui s'enfoncent */
  if (!finePointer) {
    document.addEventListener("pointerdown", (e) => {
      const r = document.createElement("span");
      r.className = "tap-ripple";
      r.style.left = e.clientX + "px";
      r.style.top = e.clientY + "px";
      document.body.appendChild(r);
      gsap.fromTo(r, { scale: 0, autoAlpha: .7 }, { scale: 1, autoAlpha: 0, duration: .8, ease: "expo.out", onComplete: () => r.remove() });
    }, { passive: true });
    document.addEventListener("pointerdown", (e) => {
      const el = e.target.closest(".btn, .product, .filter, .cart-btn, .cart-bar, .chips label, .seg label");
      if (!el) return;
      gsap.to(el, { scale: .95, duration: .2, ease: "power3.out" });
      const release = () => { gsap.to(el, { scale: 1, duration: .7, ease: "elastic.out(1, .4)" }); el.removeEventListener("pointerup", release); el.removeEventListener("pointercancel", release); el.removeEventListener("pointerleave", release); };
      el.addEventListener("pointerup", release);
      el.addEventListener("pointercancel", release);
      el.addEventListener("pointerleave", release);
    }, { passive: true });
  }

  window.addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

try { init(); diag.init = "ok"; } catch (e) {
  console.error(e);
  diag.init = "erreur";
  diag.errors.push(e.message);
  hideLoader();
  window.ScrollTrigger?.killAll();
  window.gsap?.globalTimeline.clear();
  $$("main [style], .nav[style], .product[style]").forEach((el) => el.removeAttribute("style"));
}

/* ---- Diagnostic : ajouter #diag à l'adresse de la page */
function showDiag() {
  if (location.hash !== "#diag" || $(".diag")) return;
  let scrolls = 0;
  window.addEventListener("scroll", () => scrolls++, { passive: true });
  const box = document.createElement("pre");
  box.className = "diag";
  box.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:200;margin:0;padding:10px;border-radius:10px;background:rgba(0,0,0,.85);color:#9ff5bd;font:11px/1.45 ui-monospace,monospace;white-space:pre-wrap;pointer-events:none";
  document.body.appendChild(box);
  const render = () => {
    box.textContent = [
      "Version du site : " + VERSION,
      "Navigateur : " + navigator.userAgent.replace(/^Mozilla\/5\.0 /, "").slice(0, 90),
      "GSAP : " + (window.gsap ? window.gsap.version : "NON CHARGÉ") + " · ScrollTrigger : " + (window.ScrollTrigger ? window.ScrollTrigger.getAll().length : "NON"),
      "Réduire les animations : " + (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "oui" : "non") + " (réglage : " + CONFIG.animationsReduites + ")",
      "Pointeur souris : " + (finePointer ? "oui" : "non (tactile)") + " · Fenêtre : " + innerWidth + "×" + innerHeight,
      "Défilement : scrollY " + Math.round(scrollY) + " · évènements " + scrolls,
      "E-mail configuré : " + (CONFIG.email.includes("A_REMPLACER") ? "NON" : CONFIG.email),
      "Démarrage : " + (diag.init || "?") + " · Erreurs : " + (diag.errors.length ? diag.errors.join(" | ") : "aucune"),
    ].join("\n");
  };
  render();
  setInterval(render, 500);
}
showDiag();
window.addEventListener("hashchange", showDiag);
