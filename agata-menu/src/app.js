(function () {
"use strict";
var A = /*ASSETS*/;
var DATA = JSON.parse(document.getElementById("agata-data").textContent);
var IMGS = {};
var LANGS = [["fr","Français"],["en","English"],["it","Italiano"],["es","Español"],["de","Deutsch"],["ru","Русский"],["ar","العربية"]];
var UI = {
  fr:{new:"Nouveau",bio:"Bio",nature:"Nature",biodyn:"Biodynamie",lang:"Langue",open:"Tout déplier",close:"Tout replier",soon:"photo à venir",veggie:"Végétarien",vegan:"Vegan",spicy:"Épicé",cucina:"La Cucina",bar:"Il Bar",copy:"Copier",copied:"Code Wi-Fi copié",dishes:"plats",refs:"références",ph:["On étale la pâte à la main…","Un filet d'huile d'olive…","Le four grimpe à 485 °C…"],closeV:"Fermer",prev:"Précédent",next:"Suivant"},
  en:{new:"New",bio:"Organic",nature:"Natural",biodyn:"Biodynamic",lang:"Language",open:"Expand all",close:"Collapse all",soon:"photo coming soon",veggie:"Vegetarian",vegan:"Vegan",spicy:"Spicy",cucina:"La Cucina",bar:"Il Bar",copy:"Copy",copied:"Wi-Fi code copied",dishes:"dishes",refs:"items",ph:["Stretching the dough by hand…","A drizzle of olive oil…","The oven climbs to 485 °C…"],closeV:"Close",prev:"Previous",next:"Next"},
  it:{new:"Novità",bio:"Bio",nature:"Naturale",biodyn:"Biodinamico",lang:"Lingua",open:"Apri tutto",close:"Chiudi tutto",soon:"foto in arrivo",veggie:"Vegetariano",vegan:"Vegano",spicy:"Piccante",cucina:"La Cucina",bar:"Il Bar",copy:"Copia",copied:"Codice Wi-Fi copiato",dishes:"piatti",refs:"proposte",ph:["Stendiamo la pasta a mano…","Un filo d'olio d'oliva…","Il forno sale a 485 °C…"],closeV:"Chiudi",prev:"Precedente",next:"Successivo"},
  es:{new:"Novedad",bio:"Ecológico",nature:"Natural",biodyn:"Biodinámico",lang:"Idioma",open:"Abrir todo",close:"Cerrar todo",soon:"foto próximamente",veggie:"Vegetariano",vegan:"Vegano",spicy:"Picante",cucina:"La Cucina",bar:"Il Bar",copy:"Copiar",copied:"Código Wi-Fi copiado",dishes:"platos",refs:"referencias",ph:["Estiramos la masa a mano…","Un chorrito de aceite de oliva…","El horno sube a 485 °C…"],closeV:"Cerrar",prev:"Anterior",next:"Siguiente"},
  de:{new:"Neu",bio:"Bio",nature:"Naturwein",biodyn:"Biodynamisch",lang:"Sprache",open:"Alle öffnen",close:"Alle schließen",soon:"Foto folgt",veggie:"Vegetarisch",vegan:"Vegan",spicy:"Scharf",cucina:"La Cucina",bar:"Il Bar",copy:"Kopieren",copied:"WLAN-Code kopiert",dishes:"Gerichte",refs:"Positionen",ph:["Der Teig wird von Hand gezogen…","Ein Schuss Olivenöl…","Der Ofen klettert auf 485 °C…"],closeV:"Schließen",prev:"Zurück",next:"Weiter"},
  ru:{new:"Новинка",bio:"Органик",nature:"Натуральное",biodyn:"Биодинамика",lang:"Язык",open:"Развернуть всё",close:"Свернуть всё",soon:"фото скоро",veggie:"Вегетарианское",vegan:"Веганское",spicy:"Острое",cucina:"La Cucina",bar:"Il Bar",copy:"Копировать",copied:"Код Wi-Fi скопирован",dishes:"блюд",refs:"позиций",ph:["Раскатываем тесто вручную…","Капля оливкового масла…","Печь разогревается до 485 °C…"],closeV:"Закрыть",prev:"Назад",next:"Далее"},
  ar:{new:"جديد",bio:"عضوي",nature:"طبيعي",biodyn:"بيوديناميكي",lang:"اللغة",open:"فتح الكل",close:"طي الكل",soon:"الصورة قريبًا",veggie:"نباتي",vegan:"نباتي صرف",spicy:"حار",cucina:"La Cucina",bar:"Il Bar",copy:"نسخ",copied:"تم نسخ رمز الواي فاي",dishes:"أطباق",refs:"أصناف",ph:["نفرد العجينة باليد…","رشّة من زيت الزيتون…","الفرن يصل إلى 485 درجة…"],closeV:"إغلاق",prev:"السابق",next:"التالي"}
};
var FONT_EXTRA = {
  ru:"https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap",
  ar:"https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Sans+Arabic:wght@400;600&display=swap"
};
var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

var lang = (function () {
  var saved = ls("agata-lang"); if (saved && UI[saved]) return saved;
  var nav = (navigator.languages || [navigator.language || "fr"]);
  for (var i = 0; i < nav.length; i++) { var c = String(nav[i]).slice(0, 2).toLowerCase(); if (UI[c]) return c; }
  return "fr";
})();
function t(k) { return (UI[lang] && UI[lang][k]) || UI.fr[k]; }
function tx(v) { if (v == null) return ""; if (typeof v === "string") return v; return v[lang] || v.fr || v.en || ""; }

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  if (FONT_EXTRA[lang] && !document.getElementById("font-" + lang)) {
    var l = document.createElement("link"); l.rel = "stylesheet"; l.id = "font-" + lang; l.href = FONT_EXTRA[lang]; document.head.appendChild(l);
  }
}
applyLang();

/* ---------- SVG ---------- */
var SVG = {
  face: function (cls) { return '<svg class="' + (cls || "face") + '" viewBox="740 255 380 375" aria-hidden="true">' + A.face + "</svg>"; },
  word: function (cls) { return '<svg class="' + cls + '" viewBox="818 100 210 48" role="img" aria-label="Agata">' + A.word + "</svg>"; },
  plus: '<svg viewBox="0 0 14 14"><path d="M2 5l5 5 5-5"/></svg>',
  pen: '<svg viewBox="0 0 16 16"><path d="M10.5 2.5l3 3L5 14H2v-3z"/></svg>',
  leaf: '<svg class="ic leaf" viewBox="0 0 16 16" aria-hidden="true"><path d="M14 2C6 2 2 6 2.5 12.5c.3 1 1 1.5 1.6 1.5C4.7 9.8 7 7 10.5 5.5 7.6 7.6 5.6 10.4 5 14c6.5.5 9.6-4.4 9-12z"/></svg>',
  chili: '<svg class="ic chili" viewBox="0 0 16 16" aria-hidden="true"><path d="M11.8 3.2c.4-.9.2-1.9-.4-2.4l-.6.5c.4.3.5.9.3 1.4-1.3-.2-2.3.6-2.5 1.8C8 9 5.2 12 1 13.8c4.6 1.5 10.6.3 12.2-6.5.4-1.6-.2-3.1-1.4-4.1z"/></svg>',
  globe: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.3"/><path d="M1.7 8h12.6M8 1.7c2 2 2 10.6 0 12.6M8 1.7c-2 2-2 10.6 0 12.6"/></svg>',
  left: '<svg viewBox="0 0 16 16"><path d="M10 3L5 8l5 5"/></svg>',
  right: '<svg viewBox="0 0 16 16"><path d="M6 3l5 5-5 5"/></svg>',
  x: '<svg viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13"/></svg>',
  up: '<svg viewBox="0 0 16 16"><path d="M3 10l5-5 5 5"/></svg>',
  down: '<svg viewBox="0 0 16 16"><path d="M3 6l5 5 5-5"/></svg>'
};

/* ---------- Coquille de la page ---------- */
var root = document.getElementById("agata-root");
root.innerHTML =
  '<div id="pre" aria-hidden="true"><div class="pre-in">' +
    '<svg class="hands" viewBox="-30 -10 478 140"><g id="hl">' + A.handL + '</g><g id="hr">' + A.handR + '</g><circle class="spark" cx="209" cy="50" r="7"/></svg>' +
    '<div class="temp"><span id="deg">0</span><small>°C</small></div>' +
    '<div class="phrase" id="phrase"></div>' + SVG.word("pre-word") +
  '</div><div class="pre-foot">Agata · Pizzeria · Rive Gauche</div></div>' +
  '<header class="top" id="top"><div class="wrap"><div class="top-row">' + SVG.word("top-word") +
    '<button class="lang-btn" id="langBtn" aria-haspopup="dialog">' + SVG.globe + '<span id="langCode"></span></button></div>' +
    '<nav class="chips" id="chips" aria-label="Menu"></nav></div></header>' +
  '<section class="hero"><div class="wrap hero-in"><div data-in style="--d:0">' + SVG.face("face") + '</div>' +
    '<div data-in style="--d:1">' + SVG.word("hero-word") + '</div>' +
    '<div class="hero-sub" data-in style="--d:2">Pizzeria · Rive Gauche</div></div></section>' +
  '<main class="wrap" id="menu"></main>' +
  '<footer class="foot" id="foot"></footer>' +
  '<div class="scrim" id="scrim"></div>' +
  '<div class="sheet" id="sheet" role="dialog" aria-modal="true"></div>' +
  '<div class="viewer" id="viewer" role="dialog" aria-modal="true"></div>' +
  '<div class="toast" id="toast" role="status"></div>';

/* ---------- Preloader ---------- */
var pre = $("#pre"), hl = $("#hl"), hr = $("#hr"), degEl = $("#deg"), phraseEl = $("#phrase");
var seen = ss("agata-seen");
var minTime = reduce ? 300 : (seen ? 1200 : 2800);
var t0 = performance.now(), finished = false, phraseIdx = -1, loaded = false, holdAt = 0, tail = null;
function setPhrase(i) {
  if (i === phraseIdx) return; phraseIdx = i;
  var txt = i < 3 ? t("ph")[i] : "Mamma mia! \uD83E\uDD0C";
  phraseEl.classList.add("swap");
  setTimeout(function () { phraseEl.textContent = txt; phraseEl.classList.remove("swap"); }, 160);
}
function easeInOut(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function drawPre(p) {
  var gap = (1 - p) * 120;
  hl.style.transform = "translateX(" + (-gap + p * 9) + "px)";
  hr.style.transform = "translateX(" + (gap - p * 9) + "px)";
  degEl.textContent = Math.round(p * 485);
  setPhrase(p < .33 ? 0 : p < .66 ? 1 : p < .999 ? 2 : 3);
}
/* Une seule courbe ease-in-out sur minTime. Si la page n'est pas prête,
   on attend juste avant la fin puis on termine en douceur. */
function tick(now) {
  var x = Math.min(1, (now - t0) / minTime), p, from = easeInOut(.82);
  if (!holdAt && !loaded && x > .82) holdAt = now;
  if (holdAt) {
    if (!loaded) p = from;
    else { if (!tail) tail = now; var y = Math.min(1, (now - tail) / 700); p = y >= 1 ? 1 : from + (1 - from) * (1 - Math.pow(1 - y, 3)); }
  } else p = easeInOut(x);
  drawPre(p);
  if (p >= 1) return endPre();
  requestAnimationFrame(tick);
}
function endPre() {
  if (finished) return; finished = true;
  pre.classList.add("touch");
  ss("agata-seen", "1");
  setTimeout(function () {
    pre.classList.add("out");
    document.body.classList.add("ready");
    setTimeout(function () { pre.classList.add("gone"); var f = $(".hero .face"); if (f && !reduce) { f.classList.add("wink"); } }, 950);
  }, reduce ? 50 : 820);
}
drawPre(0);
requestAnimationFrame(tick);
setTimeout(function () { loaded = true; }, 7000);

/* ---------- Menu ---------- */
var openSet = {};
DATA.sections.forEach(function (s) { if (s.open) openSet[s.id] = true; });
var admin = false, draft = null;
function cur() { return admin && draft ? draft : DATA; }
function imgSrc(k) { return k ? (IMGS[k] || (draft && draft.__imgs && draft.__imgs[k]) || null) : null; }
function visibleItems(sec) { return sec.items.filter(function (it) { return admin || !it.hidden; }); }

function priceHTML(p) {
  if (p == null || p === "") return "";
  return '<span class="price">' + esc(p) + "<em>€</em></span>";
}
function tagsInline(it) {
  var s = "", tg = it.tags || [];
  if (tg.indexOf("veggie") > -1) s += '<span title="' + esc(t("veggie")) + '">' + SVG.leaf + "</span>";
  if (tg.indexOf("spicy") > -1) s += '<span title="' + esc(t("spicy")) + '">' + SVG.chili + "</span>";
  return s;
}
var MK = {new:"new",veggie:"veggie",vegan:"vegan",spicy:"spicy",bio:"bio",nature:"nature",biodyn:"biodyn"};
function marks(it) {
  if (cur().settings.tags === false) return "";
  var tg = it.tags || [], out = [];
  ["new","veggie","vegan","spicy","bio","nature","biodyn"].forEach(function (k) { if (tg.indexOf(k) > -1) out.push('<span class="' + (k === "new" || k === "spicy" ? "hot" : "") + '">' + esc(t(k)) + "</span>"); });
  return out.length ? '<span class="marks">' + out.join(" · ") + "</span>" : "";
}
function pills(it) {
  var tg = it.tags || [], s = "";
  if (tg.indexOf("new") > -1) s += '<span class="pill new">New</span>';
  if (tg.indexOf("vegan") > -1) s += '<span class="pill vegan">Vegan</span>';
  if (tg.indexOf("bio") > -1) s += '<span class="pill bio">Bio</span>';
  if (tg.indexOf("nature") > -1) s += '<span class="pill nature">Nature</span>';
  if (tg.indexOf("biodyn") > -1) s += '<span class="pill biodyn">Biodynamie</span>';
  return s;
}
function editBtn(sec, it) { return admin ? '<button class="edit-dot" data-edit="' + sec.id + "|" + it.id + '" aria-label="Modifier ' + esc(tx(it.name)) + '">' + SVG.pen + "</button>" : ""; }

function cardHTML(sec, it, i, span) {
  var st = cur().settings, src = imgSrc(it.img), photos = st.photos !== false;
  var ph = "";
  if (photos) {
    ph = '<div class="ph">' + (src
      ? '<button class="ph-btn" data-view="' + sec.id + "|" + it.id + '" aria-label="' + esc(tx(it.name)) + '"></button><img alt="" decoding="async" src="' + src + '" onload="this.classList.add(\'ld\')">'
      : '<div class="ph-empty">' + SVG.face("") + "</div>") + "</div>";
  }
  return '<article class="card' + (span ? " span2" : "") + (it.hidden ? " is-hidden" : "") + '" style="--i:' + i + '">' + ph + editBtn(sec, it) +
    '<div class="meta"><h3 class="name">' + esc(tx(it.name)) + "</h3>" + priceHTML(it.price) +
    (it.desc ? '<p class="desc">' + esc(tx(it.desc)) + "</p>" : "") + marks(it) + "</div></article>";
}
function rowHTML(sec, it) {
  return '<div class="row' + (admin ? " has-edit" : "") + (it.hidden ? " is-hidden" : "") + '"><span class="name">' + esc(tx(it.name)) + "</span>" + priceHTML(it.price) + editBtn(sec, it) +
    (it.desc ? '<span class="desc">' + esc(tx(it.desc)) + "</span>" : "") + marks(it) + "</div>";
}
function bodyHTML(sec) {
  var items = visibleItems(sec), h = "";
  var lay = sec.layout;
  if (cur().settings.photos === false && (lay === "grid" || lay === "wide")) lay = "list";
  if (lay === "grid" || lay === "wide") {
    h += '<div class="grid' + (lay === "wide" ? " wide" : "") + '">';
    items.forEach(function (it, i) { h += cardHTML(sec, it, i, lay === "grid" && i === items.length - 1 && items.length % 2 === 1); });
    if (admin) h += '<button class="add-item" data-add="' + sec.id + '">+ Ajouter un plat</button>';
    h += "</div>";
  } else {
    var groups = [], last = null;
    items.forEach(function (it) { var k = tx(it.sub); if (!last || last.k !== k) { last = { k: k, items: [] }; groups.push(last); } last.items.push(it); });
    h += "<div>";
    groups.forEach(function (g) {
      h += (g.k ? '<div class="sub">' + esc(g.k) + "</div>" : "") + '<div class="list' + (g.items.length > 8 ? " cols" : "") + '">' + g.items.map(function (it) { return rowHTML(sec, it); }).join("") + "</div>";
    });
    if (admin) h += '<div class="list"><button class="add-item" data-add="' + sec.id + '" style="margin-top:14px">+ Ajouter une ligne</button></div>';
    h += "</div>";
  }
  if (sec.note) h += '<p class="sec-note">' + esc(tx(sec.note)) + "</p>";
  return h;
}
function thumbs(sec) {
  if (cur().settings.photos === false) return "";
  var ks = visibleItems(sec).map(function (it) { return it.img; }).filter(Boolean).slice(0, 6);
  if (!ks.length) return "";
  return '<span class="thumbs" aria-hidden="true">' + ks.map(function (k) { var s = imgSrc(k); return s ? '<img alt="" src="' + s + '">' : "<i></i>"; }).join("") + "</span>";
}
function renderMenu() {
  var D = cur(), h = "", lastGroup = null;
  var main = $("#menu");
  main.className = "wrap" + (D.settings.prices === false ? " hide-prices" : "") + (D.settings.desc === false ? " hide-desc" : "");
  h += '<div class="tools"><button class="fold-all" id="foldAll"></button></div>';
  D.sections.forEach(function (sec) {
    if (sec.hidden && !admin) return;
    if (sec.group !== lastGroup) { lastGroup = sec.group; h += '<div class="group-title" id="g-' + sec.group + '">' + esc(sec.group === "bar" ? t("bar") : t("cucina")) + "</div>"; }
    var n = visibleItems(sec).length, isOpen = !!openSet[sec.id];
    h += '<section class="sec ' + sec.group + (isOpen ? " open" : "") + (sec.hidden ? " is-hidden" : "") + '" id="s-' + sec.id + '">' +
      '<button class="sec-head" aria-expanded="' + isOpen + '" aria-controls="b-' + sec.id + '" data-toggle="' + sec.id + '">' +
      '<span class="sec-title">' + esc(tx(sec.title)) + "</span>" +
      '<span class="plus" aria-hidden="true">' + SVG.plus + "</span>" +
      '<span class="sec-kicker">' + esc(tx(sec.kicker)) + "</span></button>" +
      '<div class="sec-body" id="b-' + sec.id + '"><div class="sec-inner"><div class="sec-pad">' + (isOpen ? bodyHTML(sec) : "") + "</div></div></div></section>";
  });
  main.innerHTML = h;
  updateFoldAll();
  renderChips();
}
function updateFoldAll() {
  var b = $("#foldAll"); if (!b) return;
  var anyOpen = cur().sections.some(function (s) { return openSet[s.id]; });
  b.textContent = anyOpen ? t("close") : t("open");
  b.dataset.mode = anyOpen ? "close" : "open";
}
function setOpen(id, on, noScroll) {
  var el = $("#s-" + id); if (!el) return;
  var sec = cur().sections.filter(function (s) { return s.id === id; })[0];
  openSet[id] = on;
  var pad = $(".sec-pad", el);
  if (on) { pad.innerHTML = bodyHTML(sec); void el.offsetHeight; }
  el.classList.toggle("open", on);
  $(".sec-head", el).setAttribute("aria-expanded", on);
  if (!on) setTimeout(function () { if (!openSet[id]) pad.innerHTML = ""; }, 650);
  updateFoldAll();
  if (on && !noScroll) {
    var y = el.getBoundingClientRect().top;
    if (y < 80 || y > innerHeight * .6) setTimeout(function () { el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 60);
  }
}
function renderChips() {
  var D = cur(), h = "", last = null;
  D.sections.forEach(function (s) {
    if (s.hidden && !admin) return;
    if (last && s.group !== last) h += '<span class="chip-sep"></span>';
    last = s.group;
    h += '<button class="chip ' + s.group + '" data-chip="' + s.id + '">' + esc(tx(s.title)) + "</button>";
  });
  $("#chips").innerHTML = h;
  spy();
}
function renderFoot() {
  var I = DATA.info;
  $("#foot").innerHTML = '<div class="wrap foot-in">' +
    '<button class="seal-btn" id="seal" aria-label="Agata"><svg class="seal" viewBox="0 0 201.2 169.85" aria-hidden="true">' + A.logo + "</svg></button>" +
    '<div class="foot-quote">' + esc(I.quote) + "</div>" +
    '<div class="addr">' + esc(I.address) + "</div>" +
    '<div class="wifi">Wi-Fi <b>' + esc(I.wifi) + "</b> · <span id=\"wcode\">" + esc(I.wifiCode) + '</span><button id="wcopy">' + esc(t("copy")) + "</button></div>" +
    (tx(I.lines) || []).map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + "</div>";
}
function renderAll() { $("#langCode").textContent = lang.toUpperCase(); renderMenu(); renderFoot(); }

/* ---------- Défilement : barre et puces actives ---------- */
var topEl = $("#top"), spyObs = null;
var heroEl = $(".hero");
addEventListener("scroll", function () { topEl.classList.toggle("scrolled", scrollY > heroEl.offsetHeight - 120); }, { passive: true });
function spy() {
  if (spyObs) spyObs.disconnect();
  if (!("IntersectionObserver" in window)) return;
  spyObs = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var id = e.target.id.slice(2);
      $$(".chip").forEach(function (c) { c.classList.toggle("on", c.dataset.chip === id); });
      var c = $('.chip[data-chip="' + id + '"]');
      if (c) { var bar = $("#chips"); bar.scrollTo({ left: c.offsetLeft - bar.clientWidth / 2 + c.clientWidth / 2, behavior: reduce ? "auto" : "smooth" }); }
    });
  }, { rootMargin: "-120px 0px -65% 0px" });
  $$(".sec").forEach(function (s) { spyObs.observe(s); });
}

/* ---------- Feuilles ---------- */
var scrim = $("#scrim"), sheet = $("#sheet"), sheetClose = null;
function openSheet(html, onClose) {
  sheet.innerHTML = '<div class="grab"></div>' + html;
  scrim.classList.add("on"); sheet.classList.add("on"); document.body.classList.add("locked");
  sheetClose = onClose || null;
}
function closeSheet() {
  scrim.classList.remove("on"); sheet.classList.remove("on"); document.body.classList.remove("locked");
  var f = sheetClose; sheetClose = null; if (f) f();
}
scrim.addEventListener("click", closeSheet);
function langSheet() {
  openSheet("<h3>" + esc(t("lang")) + '</h3><div class="langs">' + LANGS.map(function (l) {
    return '<button data-lang="' + l[0] + '" aria-current="' + (l[0] === lang) + '" lang="' + l[0] + '">' + l[1] + "<small>" + l[0].toUpperCase() + "</small></button>";
  }).join("") + "</div>");
}

/* ---------- Visionneuse ---------- */
var viewer = $("#viewer"), vState = null;
function viewList(secId) {
  var sec = cur().sections.filter(function (s) { return s.id === secId; })[0];
  return visibleItems(sec).filter(function (it) { return imgSrc(it.img); });
}
function openViewer(secId, itemId) {
  var list = viewList(secId), i = 0;
  list.forEach(function (it, k) { if (it.id === itemId) i = k; });
  vState = { sec: secId, list: list, i: i };
  drawViewer(); viewer.classList.add("on"); document.body.classList.add("locked");
}
function drawViewer() {
  var it = vState.list[vState.i], st = cur().settings;
  viewer.innerHTML = '<button class="v-btn v-close" data-vclose aria-label="' + esc(t("closeV")) + '">' + SVG.x + "</button>" +
    '<div class="v-img" id="vimg"><img alt="' + esc(tx(it.name)) + '" src="' + imgSrc(it.img) + '"></div>' +
    '<div class="v-txt"><div class="meta"><h3 class="name">' + esc(tx(it.name)) + "</h3>" + (st.prices !== false ? priceHTML(it.price) : "") +
    (it.desc && st.desc !== false ? '<p class="desc">' + esc(tx(it.desc)) + "</p>" : "") + "</div>" +
    '<div class="v-nav"><button class="v-btn" data-vstep="-1" aria-label="' + esc(t("prev")) + '">' + SVG.left + '</button><span class="v-count">' + (vState.i + 1) + " / " + vState.list.length +
    '</span><button class="v-btn" data-vstep="1" aria-label="' + esc(t("next")) + '">' + SVG.right + "</button></div></div>";
  var im = $("#vimg"), x0 = null;
  im.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
  im.addEventListener("pointerup", function (e) { if (x0 == null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) step((dx < 0 ? 1 : -1) * (lang === "ar" ? -1 : 1)); });
}
function step(d) { if (!vState) return; vState.i = (vState.i + d + vState.list.length) % vState.list.length; drawViewer(); }
function closeViewer() { viewer.classList.remove("on"); document.body.classList.remove("locked"); vState = null; }
addEventListener("keydown", function (e) {
  if (e.key === "Escape") { if (vState) closeViewer(); else if (sheet.classList.contains("on")) closeSheet(); }
  if (vState && e.key === "ArrowRight") step(lang === "ar" ? -1 : 1);
  if (vState && e.key === "ArrowLeft") step(lang === "ar" ? 1 : -1);
});

var toastT;
function toast(msg) { var el = $("#toast"); el.textContent = msg; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove("on"); }, 2600); }

/* ---------- Clics ---------- */
var sealTaps = [];
document.addEventListener("click", function (e) {
  var b = e.target.closest("button"); if (!b) return;
  var d = b.dataset;
  if (d.toggle) return setOpen(d.toggle, !openSet[d.toggle]);
  if (d.chip) { if (!openSet[d.chip]) setOpen(d.chip, true, true); var el = $("#s-" + d.chip); setTimeout(function () { el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 30); return; }
  if (d.go) { var g = $("#g-" + d.go); if (g) g.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); return; }
  if (d.view) { var p = d.view.split("|"); return openViewer(p[0], p[1]); }
  if (d.vstep) return step(+d.vstep);
  if (b.hasAttribute("data-vclose")) return closeViewer();
  if (d.lang) { lang = d.lang; ls("agata-lang", lang); applyLang(); closeSheet(); renderAll(); return; }
  if (b.id === "langBtn") return langSheet();
  if (b.id === "foldAll") {
    var mode = d.mode;
    cur().sections.forEach(function (s) { if (!s.hidden || admin) openSet[s.id] = mode === "open"; });
    renderMenu();
    if (mode === "close") { var m = $("#menu"); scrollTo({ top: m.offsetTop - 120, behavior: reduce ? "auto" : "smooth" }); }
    return;
  }
  if (b.id === "wcopy") {
    var code = DATA.info.wifiCode;
    try { navigator.clipboard.writeText(code).then(function () { toast(t("copied")); }, function () { selectCode(); }); } catch (er) { selectCode(); }
    return;
  }
  if (b.id === "seal") {
    var now = Date.now(); sealTaps = sealTaps.filter(function (x) { return now - x < 2500; }); sealTaps.push(now);
    if (sealTaps.length >= 5) { sealTaps = []; enterAdmin(); }
    return;
  }
  if (window.__agataAdminClick) window.__agataAdminClick(b, e);
});
function selectCode() { var r = document.createRange(); r.selectNodeContents($("#wcode")); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }

/* ---------- Images : arrivent après le texte ---------- */
window.__agataImages = function () {
  try { IMGS = JSON.parse(document.getElementById("agata-images").textContent) || {}; } catch (e) { IMGS = {}; }
  renderMenu();
  loaded = true;
};

renderAll();
if (location.hash === "#admin") setTimeout(function () { enterAdmin(); }, 300);

/* ======================================================================
   Mode édition (propriétaire) — enregistre une nouvelle version de la page
   ====================================================================== */
var artifactNS = null, sampleNS = null, editing = null, edLang = "fr";
var DRAFT_KEY = "agata-draft";
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function changes() { return draft ? (JSON.stringify(stripImgs(draft)) !== JSON.stringify(DATA) || Object.keys(draft.__imgs || {}).length > 0 || draft.__dropped) : false; }
function stripImgs(d) { var c = clone(d); delete c.__imgs; delete c.__dropped; return c; }
function saveDraft() { try { ls(DRAFT_KEY, JSON.stringify({ base: DATA.rev || 0, d: draft })); } catch (e) {} }

function enterAdmin() {
  if (admin) return;
  admin = true;
  var saved = null; try { saved = JSON.parse(ls(DRAFT_KEY) || "null"); } catch (e) {}
  draft = saved && saved.base === (DATA.rev || 0) && saved.d ? saved.d : clone(DATA);
  if (!draft.__imgs) draft.__imgs = {};
  document.body.classList.add("admin");
  var bar = document.createElement("div"); bar.className = "adm-bar"; bar.id = "admBar";
  bar.innerHTML = '<div class="lbl"><b>Mode édition</b><span id="admState">Touchez le crayon d\'un plat</span></div>' +
    '<button class="abtn" id="admSet">Réglages</button><button class="abtn pri" id="admPub">Publier</button><button class="abtn" id="admQuit" aria-label="Quitter">' + "✕</button>";
  document.body.appendChild(bar);
  renderMenu(); refreshBar();
  var w = window.claude;
  if (w && w.use) {
    w.use("artifact").then(function (ns) { artifactNS = ns; refreshBar(); });
    w.use("sample").then(function (ns) { sampleNS = ns; });
  } else refreshBar();
}
function refreshBar() {
  var st = $("#admState"), pub = $("#admPub"); if (!st) return;
  var n = changes();
  if (!artifactNS) st.textContent = "Publication : ouvrez le menu depuis Claude.";
  else st.textContent = n ? "Modifications non publiées" : "Aucune modification";
  pub.disabled = !artifactNS || !n;
}
function touch() { saveDraft(); renderMenu(); refreshBar(); }
function findSec(id) { return draft.sections.filter(function (s) { return s.id === id; })[0]; }
function findItem(sec, id) { return sec.items.filter(function (i) { return i.id === id; })[0]; }

window.__agataAdminClick = function (b) {
  if (!admin) return;
  var d = b.dataset;
  if (b.id === "admQuit") {
    admin = false; document.body.classList.remove("admin"); var bar = $("#admBar"); if (bar) bar.remove(); renderMenu(); return;
  }
  if (b.id === "admSet") return settingsSheet();
  if (b.id === "admPub") return publish();
  if (d.edit) { var p = d.edit.split("|"); return itemSheet(p[0], p[1]); }
  if (d.add) {
    var sec = findSec(d.add), id = "n" + Date.now().toString(36);
    var it = { id: id, name: "Nouveau plat", price: "", desc: { fr: "" } };
    if (sec.layout === "drinks" || sec.layout === "list") { var lastIt = sec.items[sec.items.length - 1]; if (lastIt && lastIt.sub) it.sub = lastIt.sub; delete it.desc; it.name = "Nouvelle ligne"; }
    sec.items.push(it); touch(); return itemSheet(sec.id, id);
  }
  if (d.set) { draft.settings[d.set] = b.getAttribute("aria-pressed") !== "true"; touch(); return settingsSheet(); }
  if (d.secmove) { var q = d.secmove.split("|"), i = draft.sections.findIndex(function (s) { return s.id === q[0]; }), j = i + (+q[1]);
    if (j >= 0 && j < draft.sections.length) { var tmp = draft.sections[i]; draft.sections[i] = draft.sections[j]; draft.sections[j] = tmp; touch(); } return settingsSheet(); }
  if (d.ed) return edAction(d.ed, b);
  if (d.edlang) { readItemForm(); edLang = d.edlang; return itemSheet(editing.sec, editing.id); }
  if (d.discard) { draft = clone(DATA); draft.__imgs = {}; ls(DRAFT_KEY, null); touch(); closeSheet(); toast("Modifications annulées"); return; }
};

function settingsSheet() {
  var s = draft.settings;
  function sw(k, label) { return '<label class="sw">' + label + '<input type="checkbox" id="set-' + k + '" data-setsw="' + k + '"' + (s[k] !== false ? " checked" : "") + "></label>"; }
  var h = "<h3>Réglages du menu</h3>" + sw("photos", "Afficher les photos") + sw("prices", "Afficher les prix") + sw("desc", "Afficher les descriptions") + sw("tags", "Afficher les pictos (végé, vegan, épicé, new)") +
    '<h3 style="margin-top:24px">Rubriques</h3>';
  draft.sections.forEach(function (sec, i) {
    h += '<div class="sec-adm"><div class="t"><span>' + esc(tx(sec.title)) + '</span><span class="mini"><button data-secmove="' + sec.id + '|-1" aria-label="Monter">' + SVG.up + '</button><button data-secmove="' + sec.id + '|1" aria-label="Descendre">' + SVG.down + "</button></span></div>" +
      '<label class="field"><span>Titre</span><input type="text" id="st-' + sec.id + '" data-sectitle="' + sec.id + '" value="' + esc(tx(sec.title)) + '"></label>' +
      '<label class="field"><span>Mise en page</span><select id="sl-' + sec.id + '" data-seclayout="' + sec.id + '">' +
      [["grid", "Deux colonnes, photos carrées"], ["wide", "Une colonne, grande photo"], ["list", "Liste sans photo"], ["drinks", "Liste carte des boissons"]].map(function (o) {
        return '<option value="' + o[0] + '"' + (sec.layout === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>" +
      '<div class="checks"><label class="check"><input type="checkbox" id="so-' + sec.id + '" data-secopen="' + sec.id + '"' + (sec.open ? " checked" : "") + '>Ouverte à l\'arrivée</label>' +
      '<label class="check"><input type="checkbox" id="sh-' + sec.id + '" data-sechide="' + sec.id + '"' + (sec.hidden ? " checked" : "") + ">Masquer la rubrique</label></div></div>";
  });
  h += '<div class="btns" style="margin-top:8px"><button class="b" data-discard="1">Annuler toutes les modifications</button><button class="b pri" id="setDone">Terminé</button></div>';
  openSheet(h);
  $$("[data-setsw]", sheet).forEach(function (el) { el.addEventListener("change", function () { draft.settings[el.dataset.setsw] = el.checked; touch(); }); });
  $$("[data-sectitle]", sheet).forEach(function (el) { el.addEventListener("change", function () { var sec = findSec(el.dataset.sectitle); sec.title = typeof sec.title === "string" ? el.value : Object.assign({}, sec.title, (function (o) { o[lang] = el.value; return o; })({})); touch(); }); });
  $$("[data-seclayout]", sheet).forEach(function (el) { el.addEventListener("change", function () { findSec(el.dataset.seclayout).layout = el.value; touch(); }); });
  $$("[data-secopen]", sheet).forEach(function (el) { el.addEventListener("change", function () { findSec(el.dataset.secopen).open = el.checked; touch(); }); });
  $$("[data-sechide]", sheet).forEach(function (el) { el.addEventListener("change", function () { findSec(el.dataset.sechide).hidden = el.checked; touch(); }); });
  $("#setDone").addEventListener("click", closeSheet);
}

var TAGS = [["veggie", "Végétarien"], ["vegan", "Vegan"], ["spicy", "Épicé"], ["new", "New"], ["bio", "Bio"]];
function itemSheet(secId, itemId) {
  var sec = findSec(secId), it = findItem(sec, itemId); if (!it) return;
  editing = { sec: secId, id: itemId };
  var src = imgSrc(it.img), list = sec.layout === "drinks" || sec.layout === "list";
  var desc = typeof it.desc === "string" ? { fr: it.desc } : (it.desc || {});
  var h = "<h3>" + esc(tx(it.name) || "Plat") + "</h3><div class=\"form\">" +
    '<div class="field"><span>Photo</span><div class="ed-img"><div class="ph">' + (src ? '<img alt="" src="' + src + '">' : '<div class="ph-empty">' + SVG.face("") + "</div>") + "</div>" +
    '<div class="btns"><label class="b file">' + (src ? "Remplacer la photo" : "Ajouter une photo") + '<input type="file" accept="image/*" id="edFile"></label>' +
    (src ? '<button class="b warn" data-ed="noimg">Retirer</button>' : "") + "</div></div></div>" +
    '<label class="field"><span>Nom</span><input type="text" id="edName" value="' + esc(tx(it.name)) + '"></label>' +
    '<label class="field"><span>Prix (€)</span><input type="text" id="edPrice" inputmode="decimal" value="' + esc(it.price) + '"></label>' +
    '<div class="field"><span>Description</span><div class="tabs">' + LANGS.map(function (l) {
      return '<button data-edlang="' + l[0] + '" class="' + (l[0] === edLang ? "on" : "") + (desc[l[0]] ? "" : " miss") + '">' + l[0].toUpperCase() + "</button>"; }).join("") + "</div>" +
    '<textarea id="edDesc" dir="' + (edLang === "ar" ? "rtl" : "ltr") + '" placeholder="Description (' + edLang.toUpperCase() + ')">' + esc(desc[edLang] || "") + "</textarea>" +
    '<div class="btns"><button class="b" data-ed="tr" id="edTr"' + (sampleNS ? "" : " disabled") + ">Traduire le FR dans les 6 autres langues</button></div></div>" +
    '<div class="field"><span>Pictos</span><div class="checks">' + TAGS.map(function (tg) {
      return '<label class="check"><input type="checkbox" data-tag="' + tg[0] + '"' + ((it.tags || []).indexOf(tg[0]) > -1 ? " checked" : "") + ">" + tg[1] + "</label>"; }).join("") + "</div></div>" +
    '<label class="sw">Masquer ce plat<input type="checkbox" id="edHide"' + (it.hidden ? " checked" : "") + "></label>" +
    '<div class="btns"><button class="b" data-ed="up">' + "Monter</button><button class=\"b\" data-ed=\"down\">Descendre</button><button class=\"b warn\" data-ed=\"del\">Supprimer</button></div>" +
    '<div class="confirm" id="edConfirm">Supprimer définitivement ce plat ? <button class="b warn" data-ed="delok">Oui, supprimer</button><button class="b" data-ed="delno">Non</button></div>' +
    '<div class="btns"><button class="b pri" data-ed="ok">Enregistrer</button><button class="b" data-ed="cancel">Fermer</button></div></div>';
  openSheet(h, function () { readItemForm(); touch(); editing = null; });
  $("#edFile").addEventListener("change", function (e) { var f = e.target.files && e.target.files[0]; if (f) takePhoto(f); });
}
function readItemForm() {
  if (!editing) return;
  var sec = findSec(editing.sec), it = findItem(sec, editing.id); if (!it || !$("#edName")) return;
  var nm = $("#edName").value.trim();
  if (typeof it.name === "object") it.name[lang] = nm; else it.name = nm;
  it.price = $("#edPrice").value.trim();
  var dv = $("#edDesc").value.trim();
  if (typeof it.desc !== "object" || !it.desc) it.desc = it.desc ? { fr: it.desc } : {};
  if (dv) it.desc[edLang] = dv; else delete it.desc[edLang];
  if (!Object.keys(it.desc).length) delete it.desc;
  it.tags = $$("[data-tag]", sheet).filter(function (c) { return c.checked; }).map(function (c) { return c.dataset.tag; });
  if (!it.tags.length) delete it.tags;
  if ($("#edHide").checked) it.hidden = true; else delete it.hidden;
}
function edAction(a, b) {
  var sec = findSec(editing.sec), it = findItem(sec, editing.id), idx = sec.items.indexOf(it);
  if (a === "ok" || a === "cancel") return closeSheet();
  if (a === "del") return $("#edConfirm").classList.add("on");
  if (a === "delno") return $("#edConfirm").classList.remove("on");
  if (a === "delok") { sec.items.splice(idx, 1); editing = null; closeSheet(); touch(); toast("Plat supprimé"); return; }
  readItemForm();
  if (a === "up" || a === "down") {
    var j = idx + (a === "up" ? -1 : 1);
    if (j >= 0 && j < sec.items.length) { sec.items.splice(idx, 1); sec.items.splice(j, 0, it); }
    touch(); toast(a === "up" ? "Plat monté" : "Plat descendu"); return;
  }
  if (a === "noimg") { delete it.img; touch(); return itemSheet(sec.id, it.id); }
  if (a === "tr") return translate(it, b);
}
function takePhoto(file) {
  var url = URL.createObjectURL(file), im = new Image();
  im.onload = function () {
    var max = 1100, r = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
    var c = document.createElement("canvas"); c.width = Math.round(im.naturalWidth * r); c.height = Math.round(im.naturalHeight * r);
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
    var data = c.toDataURL("image/webp", .76);
    if (data.indexOf("data:image/webp") !== 0) data = c.toDataURL("image/jpeg", .8);
    URL.revokeObjectURL(url);
    readItemForm();
    var sec = findSec(editing.sec), it = findItem(sec, editing.id), key = "u" + Date.now().toString(36);
    draft.__imgs[key] = data; it.img = key;
    touch(); itemSheet(sec.id, it.id); toast("Photo ajoutée");
  };
  im.onerror = function () { URL.revokeObjectURL(url); toast("Format d'image non lu. Essayez un JPEG ou un PNG."); };
  im.src = url;
}
function translate(it, btn) {
  var fr = it.desc && it.desc.fr;
  if (!sampleNS) return toast("Traduction indisponible dans cette vue.");
  if (!fr) return toast("Écrivez d'abord la description en FR.");
  btn.disabled = true; btn.textContent = "Traduction en cours…";
  sampleNS.json("You translate an Italian restaurant menu (Agata Pizzeria, Paris). Translate this French dish description into English, Italian, Spanish, German, Russian and Arabic. Keep Italian product names (burrata, fior di latte, stracciatella, San Marzano D.O.P., etc.) and brand names as they are. Keep it short and appetising, same punctuation style. Reply with only a JSON object with the keys en, it, es, de, ru, ar.\n\nFrench: " + fr, { modelTier: "quick" })
    .then(function (o) {
      ["en", "it", "es", "de", "ru", "ar"].forEach(function (k) { if (o && typeof o[k] === "string" && o[k].trim()) it.desc[k] = o[k].trim(); });
      touch(); itemSheet(editing.sec, it.id); toast("Description traduite dans les 6 langues");
    }, function (e) {
      btn.disabled = false; btn.textContent = "Traduire le FR dans les 6 autres langues";
      toast(e && e.code === "not_granted" ? "Traduction refusée dans cette vue." : e && e.code === "rate_limited" ? "Trop de traductions d'affilée, réessayez dans une minute." : "La traduction n'a pas abouti. Réessayez.");
    });
}

/* Reconstruit la page entière à partir de l'état, puis la publie */
function buildHTML() {
  var data = stripImgs(draft); data.rev = (DATA.rev || 0) + 1;
  var used = {}; data.sections.forEach(function (s) { s.items.forEach(function (i) { if (i.img) used[i.img] = 1; }); });
  var all = Object.assign({}, IMGS, draft.__imgs || {}), imgs = {};
  Object.keys(used).forEach(function (k) { if (all[k]) imgs[k] = all[k]; });
  var J = function (o) { return JSON.stringify(o).replace(/</g, "\\u003c"); };
  var reset = document.head.querySelector("style") ? document.head.querySelector("style").textContent : "";
  var keep = ["title", 'meta[name="theme-color"]'].map(function (s) { var e = document.querySelector(s); return e ? e.outerHTML : ""; }).join("") +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' + document.getElementById("font-base").outerHTML;
  return "<!doctype html><html><head><meta charset=utf8><meta name=viewport content=\"width=device-width,initial-scale=1,viewport-fit=cover\"><style>" + reset + "</style></head><body>" +
    keep + document.getElementById("agata-css").outerHTML + '<div id="agata-root"></div>' +
    '<script type="application/json" id="agata-data">' + J(data) + "<\/script>" +
    document.getElementById("agata-app").outerHTML +
    '<script type="application/json" id="agata-images">' + J(imgs) + "<\/script>" +
    document.getElementById("agata-boot").outerHTML + "</body></html>";
}
function publish() {
  if (!artifactNS) return toast("Publication indisponible dans cette vue.");
  var btn = $("#admPub"); btn.disabled = true; btn.textContent = "Publication…";
  var html; try { html = buildHTML(); } catch (e) { btn.disabled = false; btn.textContent = "Publier"; return toast("La page n'a pas pu être préparée."); }
  artifactNS.publish(html).then(function () {
    ls(DRAFT_KEY, null); toast("Menu publié");
  }, function (e) {
    btn.disabled = false; btn.textContent = "Publier";
    var c = e && e.code;
    if (c === "conflict") toast("Une version plus récente vient d'être publiée : la page se recharge.");
    else if (c === "not_writer" || c === "not_granted" || c === "consent_required") toast("Ce compte peut lire le menu mais pas le modifier.");
    else if (c === "too_large") toast("Le menu dépasse la taille maximale. Retirez quelques photos.");
    else if (c === "rate_limited") toast("Trop de publications d'affilée. Attendez une minute.");
    else toast("La publication a échoué. Réessayez.");
  });
}
})();
