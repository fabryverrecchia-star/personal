/* ==========================================================================
   18H22 × Client — Media planning
   Construit la page depuis window.PLAN puis orchestre les animations.
   ========================================================================== */
(function () {
  'use strict';

  var PLAN = window.PLAN;
  var BASE = window.CLIENT_BASE || '';
  // Les animations font partie de la présentation : on les garde même quand le téléphone
  // a « Réduire les animations » activé (réglage fréquent sur iPhone, qui coupait tout).
  var reduce = false;
  var gsap = window.gsap;

  if (gsap && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  /* ---------------------------------------------------------------- utils */
  var JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  var JOURS_LONGS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

  function parseDate(s) {
    var p = String(s).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function src(path) { return /^(https?:|data:|\/)/.test(path) ? path : BASE + path; }
  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }
  function list(v) { return Array.isArray(v) ? v : v ? [v] : []; }

  var ICONS = {
    reel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M3 8.5h18M9 3l3 5.5M15 3l3 5.5"/><path d="M10 12v5l4.5-2.5z" fill="currentColor" stroke="none"/></svg>',
    carousel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/></svg>',
    post: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="3" width="16" height="18" rx="2"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15L19.5 12z"/></svg>',
    muted: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>',
  };
  var TYPE_LABEL = { post: 'Post', carousel: 'Carrousel', reel: 'Reel' };
  var LETTRES = 'ABCDEFGH';

  function markSvg(cls) {
    return '<svg class="lockup__mark ' + (cls || '') + '" viewBox="0 0 418.46 277.09" aria-hidden="true"><use href="#mark"/></svg>';
  }
  function clientHtml() {
    var c = PLAN.client || {};
    return c.logo
      ? '<img src="' + esc(src(c.logo)) + '" alt="' + esc(c.name) + '" data-svg-logo>'
      : '<span class="client-word">' + esc(c.name) + '</span>';
  }

  // Un logo SVG est injecté dans la page pour prendre la couleur du texte
  // (18H22 au début, puis celle du client au scroll).
  function inlineSvgs() {
    document.querySelectorAll('img[data-svg-logo], [data-svg]').forEach(function (node) {
      var url = node.getAttribute('src') || node.getAttribute('data-svg');
      if (!/\.svg(\?|$)|^data:image\/svg/.test(url) || !window.fetch) return;
      svgText(url).then(function (txt) {
        var svg = el(txt.slice(txt.indexOf('<svg')));
        if (!svg || svg.nodeName.toLowerCase() !== 'svg') return;
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', node.getAttribute('alt') || (PLAN.client && PLAN.client.name) || '');
        if (node.nodeName === 'IMG') node.replaceWith(svg);
        else { node.innerHTML = ''; node.appendChild(svg); }
        if (node.hasAttribute('data-compose')) composeLogo(svg, node);
      }).catch(function () {
        // Jamais de logo noir : sans SVG injecté, on le masque plutôt que l'afficher en <img>
        if (node.nodeName === 'IMG') node.style.visibility = 'hidden';
      });
    });
  }
  // Un logo en data: est décodé sur place (certains aperçus bloquent fetch sur data:)
  function svgText(url) {
    var m = /^data:image\/svg\+xml(;base64)?,(.*)$/.exec(url);
    if (m) {
      try {
        var raw = m[1] ? atob(m[2]) : decodeURIComponent(m[2]);
        return Promise.resolve(m[1] ? decodeURIComponent(escape(raw)) : raw);
      } catch (e) { return Promise.reject(e); }
    }
    return fetch(url).then(function (r) { return r.ok ? r.text() : Promise.reject(); });
  }

  // Logo qui s'écrit au scroll, comme à la main : un masque trace le contour de chaque
  // lettre dans l'ordre d'écriture (La, Petite, Maison, puis le trait), au rythme du défilement.
  var maskId = 0;
  function composeLogo(svg, box) {
    var path = svg.querySelector('path');
    if (!path || !gsap || !window.ScrollTrigger) return;
    var subs = path.getAttribute('d').match(/M[^M]*/g) || [];
    if (subs.length < 2) return;
    var ns = svg.namespaceURI;
    var vb = svg.viewBox.baseVal;
    var id = 'write-' + (++maskId);
    var mask = document.createElementNS(ns, 'mask');
    mask.setAttribute('id', id);
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('x', vb.x - 20); mask.setAttribute('y', vb.y - 20);
    mask.setAttribute('width', vb.width + 40); mask.setAttribute('height', vb.height + 40);
    var defs = document.createElementNS(ns, 'defs');
    defs.appendChild(mask);
    svg.insertBefore(defs, svg.firstChild);
    var strokes = subs.map(function (d) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', '#fff');
      p.setAttribute('stroke-width', String((PLAN.client && PLAN.client.writeStroke) || 13));
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      mask.appendChild(p);
      return p;
    });
    // Ordre d'écriture : ligne par ligne (La / Petite / Maison), de gauche à droite, le grand trait à la fin
    var info = strokes.map(function (p, i) {
      var b = p.getBBox();
      return { p: p, b: b, len: p.getTotalLength(), row: Math.floor((b.y + b.height / 2) / (vb.height / 3.2)) };
    });
    // writeFlourish: false → pas de grand trait final (logo en lettres capitales)
    var widest = PLAN.client && PLAN.client.writeFlourish === false ? null : info.reduce(function (a, c) { return c.b.width > a.b.width ? c : a; });
    info.sort(function (a, c) {
      if (a === widest) return 1;
      if (c === widest) return -1;
      return a.row - c.row || a.b.x - c.b.x;
    });
    info.forEach(function (o) { o.p.style.strokeDasharray = o.len + ' ' + o.len; o.p.style.strokeDashoffset = o.len; });
    path.setAttribute('mask', 'url(#' + id + ')');
    var tl = gsap.timeline({
      scrollTrigger: { trigger: box, start: 'top 90%', end: 'bottom 45%', scrub: 0.6 },
    });
    var at = 0;
    info.forEach(function (o) {
      var dur = Math.max(0.15, o.len / 400);
      tl.to(o.p, { strokeDashoffset: 0, duration: dur, ease: 'none' }, at);
      at += dur * 0.8;
    });
  }

  function lockup(extra) {
    return (
      '<span class="lockup ' + (extra || '') + '">' +
      '<span class="lockup__brand">' + markSvg() + '<span class="lockup__word">18H22</span></span>' +
      '<span class="lockup__x" aria-hidden="true">×</span>' +
      '<span class="lockup__client">' + clientHtml() + '</span>' +
      '</span>'
    );
  }

  /* ------------------------ planning modifié par l'équipe : dates, ajouts, retraits */
  // Appliqué avant le rendu, depuis suivi.php : après ce type de changement, la page se recharge.
  var BASE_MONTHS = PLAN && PLAN.months ? JSON.parse(JSON.stringify(PLAN.months)) : null;
  var BASE_ADS = PLAN && PLAN.ads ? JSON.parse(JSON.stringify(list(PLAN.ads.campaigns))) : null;
  var PH = '';
  function timeVal(t) { var m = String(t || '').match(/(\d{1,2})(?:\D+(\d{2}))?/); return m ? +m[1] * 60 + (+m[2] || 0) : 0; }
  // Visuel d'attente d'une publication ou campagne ajoutée, aux couleurs du client
  function placeholder() {
    if (PH) return PH;
    var t = PLAN.theme || {};
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">' +
      '<rect width="1080" height="1350" fill="' + (t.paper || t.bg || '#efeae0') + '"/>' +
      '<rect x="70" y="70" width="940" height="1210" fill="none" stroke="' + (t.gold || t.ink || '#999') + '" stroke-opacity=".55" stroke-width="2" stroke-dasharray="12 16"/>' +
      '<text x="540" y="690" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="34" letter-spacing="12" fill="' + (t.ink || '#333') + '" fill-opacity=".7">VISUEL À VENIR</text></svg>';
    PH = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return PH;
  }
  var REMOVED = [];
  function applyStructure(edits) {
    edits = edits && typeof edits === 'object' && !Array.isArray(edits) ? edits : {};
    var keys = Object.keys(edits);
    REMOVED = [];
    if (BASE_MONTHS) {
      var months = BASE_MONTHS.map(function (m) {
        var c = JSON.parse(JSON.stringify(m));
        // Un mois sans post garde sa place grâce à month: 'AAAA-MM'
        c._key = String((list(m.posts)[0] || {}).date || m.month || '').slice(0, 7);
        c.posts = [];
        return c;
      });
      var posts = [];
      BASE_MONTHS.forEach(function (m) { list(m.posts).forEach(function (p) { posts.push(JSON.parse(JSON.stringify(p))); }); });
      keys.forEach(function (k) {
        var e = edits[k];
        if (e && e.added === 'post' && e.date) posts.push({ id: k, date: e.date, time: '', type: 'post', media: placeholder(), title: '', caption: [], _added: true });
      });
      posts = posts.filter(function (p) {
        var e = (p.id && edits[p.id]) || {};
        p._base = { date: p._added ? '' : p.date, time: p._added ? '' : p.time || '' };
        if (e.date) p.date = e.date;
        if (e.deleted) { REMOVED.push({ kind: 'post', id: p.id, title: e.title || p.title, date: p.date }); return false; }
        if (e.time) p.time = e.time;
        return true;
      });
      posts.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : timeVal(a.time) - timeVal(b.time); });
      posts.forEach(function (p) {
        var k = p.date.slice(0, 7);
        var m = months.filter(function (x) { return x._key === k; })[0];
        if (!m) {
          var d = parseDate(k + '-01');
          m = { title: MOIS_LONGS[d.getMonth()], posts: [], _key: k };
          months.push(m);
        }
        m.posts.push(p);
      });
      PLAN.months = months.filter(function (m) { return m.posts.length; }).sort(function (a, b) { return a._key < b._key ? -1 : 1; });
      if (!PLAN.months.length) PLAN.months = months.slice(0, 1);
    }
    if (BASE_ADS) {
      var cs = BASE_ADS.map(function (c) { return JSON.parse(JSON.stringify(c)); });
      keys.forEach(function (k) {
        var e = edits[k];
        if (e && e.added === 'ad' && e.start) cs.push({ id: k, start: e.start, end: e.end || e.start, media: placeholder(), title: '', caption: [], _added: true });
      });
      PLAN.ads.campaigns = cs.filter(function (c) {
        var e = edits[c.id] || {};
        c._base = { start: c._added ? '' : c.start, end: c._added ? '' : c.end };
        if (e.start) c.start = e.start;
        if (e.deleted) { REMOVED.push({ kind: 'ad', id: c.id, title: e.title || c.title, date: c.start }); return false; }
        if (e.end) c.end = e.end;
        return true;
      }).sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
    }
  }

  // Équipe : publications et campagnes retirées du planning, avec « Rétablir »
  function restoreHtml(kind, mk) {
    var items = REMOVED.filter(function (x) { return x.kind === kind && (!mk || x.date.slice(0, 7) === mk); });
    if (!items.length) return '';
    return '<div class="restore">' + items.map(function (x) {
      var d = parseDate(x.date);
      return '<p><span class="label">Retirée · ' + pad(d.getDate()) + ' ' + MOIS[d.getMonth()] + '</span><b>' + esc(x.title || '') + '</b>' +
        '<button type="button" class="label" data-restore="' + esc(x.id) + '" data-restore-kind="' + kind + '">Rétablir</button></p>';
    }).join('') + '</div>';
  }

  /* --------------------------------------------------------------- render */
  var allPosts = [];

  function renderPost(post, w, i) {
    var d = parseDate(post.date);
    // id stable dans plan.js : les modifications de l'équipe (photo, légende) y sont rattachées
    var id = post.id ? 'p-' + String(post.id).replace(/[^a-z0-9-]/gi, '') : 'p-' + post.date + '-' + i;
    post._id = id;
    post._key = post.id || post.date + '-' + i;
    post._date = d;
    post._week = w;
    post._orig = JSON.parse(JSON.stringify(post));
    allPosts.push(post);

    return (
      '<article class="post" id="' + id + '" data-type="' + (post.type || 'post') + '">' +
      '<div class="day" data-reveal>' +
      '<span class="label day__name">' + JOURS[d.getDay()] + '</span>' +
      '<span class="day__num">' + pad(d.getDate()) + '</span>' +
      '<span class="label day__month">' + MOIS[d.getMonth()] + '</span>' +
      (post.time ? '<span class="day__time">' + esc(post.time) + '</span>' : '') +
      '</div>' +
      '<div class="post__body">' +
      '<div class="post__meta" data-reveal><span class="slot" data-slot="tag">' + tagHtml(post) + '</span>' +
      '<span class="label post__index">' + JOURS_LONGS[d.getDay()] + '</span></div>' +
      '<div class="slot" data-slot="media">' + mediaHtml(post) + '</div>' +
      '<div class="caption" data-reveal data-slot="caption">' + captionHtml(post) + '</div>' +
      '<div class="post__tools"><button type="button" class="label edit-btn" data-edit-post="' + esc(post._key) + '">' + EDIT_ICON + 'Modifier la publication</button>' +
      '<span class="slot" data-slot="dl">' + dlHtml(post) + '</span></div>' +
      feedbackHtml(post) + '</div></article>'
    );
  }

  // Équipe : la vidéo d'un reel se télécharge telle qu'elle a été envoyée
  var DL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14"/></svg>';
  function dlHtml(post) {
    var v = post.type === 'reel' && post.video;
    if (!v || /^blob:/.test(v)) return '';
    var ext = (String(v).match(/\.(mp4|mov|m4v)(?:$|[?#])/i) || [0, 'mp4'])[1].toLowerCase();
    var name = String(post.title || 'reel').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'reel';
    return '<a class="label edit-btn dl-btn" href="' + esc(src(v)) + '" download="' + esc(name + '.' + ext) + '">' + DL_ICON + 'Télécharger la vidéo</a>';
  }
  var EDIT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 20l1-4.5L16 4.5l3.5 3.5-11 11z"/><path d="M13.5 7l3.5 3.5"/></svg>';
  function tagHtml(post) {
    var type = post.type || 'post';
    return '<span class="label tag tag--' + type + '">' + ICONS[type] + TYPE_LABEL[type] + '</span>';
  }
  function captionHtml(post) {
    var caption = list(post.caption).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    var tags = list(post.hashtags).length ? '<div class="hashtags">' + list(post.hashtags).map(esc).join(' ') + '</div>' : '';
    var note = post.note ? '<div class="note">' + esc(post.note) + '</div>' : '';
    return (post.title ? '<strong class="caption__title">' + esc(post.title) + '</strong>' : '') + caption + tags + note;
  }
  function mediaHtml(post) {
    var type = post.type || 'post';
    var id = post._id;
    var media;
    if (type === 'reel') {
      media =
        '<div class="media media--reel" data-reveal-media>' +
        '<div class="media__inner"><img src="' + esc(src(post.poster)) + '" alt="" loading="lazy" decoding="async"></div>' +
        '<button class="reel-open" data-reel="' + id + '" aria-label="Lire le reel : ' + esc(post.title || '') + '">' +
        '<span class="reel-open__ring"></span><span class="reel-open__play">' + ICONS.play + '</span>' +
        '<span class="label reel-open__hint">Toucher pour lire</span>' +
        '</button></div>';
    } else if (type === 'carousel') {
      var imgs = list(post.media);
      media =
        '<div class="media" data-reveal-media><div class="media__inner"><div class="carousel">' +
        imgs.map(function (m, k) {
          // Une slide peut être une image ('x.jpg') ou une vidéo ({ video, poster })
          if (m && typeof m === 'object') {
            return '<div class="slide slide--video" data-k="' + k + '">' +
              (m.video
                ? '<video muted loop playsinline preload="none" poster="' + esc(src(m.poster)) + '" data-autoplay data-video="' + esc(src(m.video)) + '"></video>'
                : '<img src="' + esc(src(m.poster)) + '" alt="" loading="lazy" decoding="async">') +
              '<span class="label slide__tag">' + ICONS.play + (m.video ? 'Vidéo' : 'Vidéo à venir') + '</span></div>';
          }
          return '<img src="' + esc(src(m)) + '" alt="" loading="lazy" decoding="async" data-k="' + k + '">';
        }).join('') +
        '</div><span class="label carousel__count"><b>1</b>/' + imgs.length + '</span></div></div>' +
        '<div class="dots" aria-hidden="true">' + imgs.map(function (_, k) { return '<i class="' + (k ? '' : 'is-on') + '"></i>'; }).join('') + '</div>';
    } else if (list(post.options).length > 1) {
      // Propositions : un seul visuel sera publié, le client choisit entre A, B, C…
      var opts = list(post.options);
      media =
        '<div class="media media--options" data-reveal-media data-options="' + id + '"><div class="media__inner">' +
        opts.map(function (m, k) {
          return '<img class="option' + (k ? '' : ' is-on') + '" src="' + esc(src(m)) + '" alt="Proposition ' + LETTRES[k] + '" loading="lazy" decoding="async">';
        }).join('') +
        '<span class="label option__badge">Proposition <b>' + LETTRES[0] + '</b></span></div></div>' +
        '<div class="options" role="group" aria-label="Propositions de visuel">' +
        '<p class="label options__hint">Un seul visuel publié · ' + opts.length + ' propositions</p>' +
        '<div class="options__list">' +
        opts.map(function (m, k) {
          return '<button type="button" class="options__btn' + (k ? '' : ' is-on') + '" data-option="' + k + '" aria-pressed="' + (k ? 'false' : 'true') + '">' +
            '<img src="' + esc(src(m)) + '" alt="" loading="lazy" decoding="async"><span class="label">' + LETTRES[k] + '</span></button>';
        }).join('') +
        '</div></div>';
    } else {
      media =
        '<div class="media" data-reveal-media><div class="media__inner"><img src="' + esc(src(list(post.media)[0])) +
        '" alt="" loading="lazy" decoding="async"></div></div>';
    }
    return media;
  }

  // Retours du client : statut + commentaire par post, envoyés en un message récapitulatif
  // (les inspirations du mois ont les mêmes retours : fbRefresh les repeint quand le panneau change)
  var fbRefresh = function () {};
  var INSPI_ITEMS = [];
  function feedbackHtml(post) {
    if (!PLAN.feedback) return '';
    return (
      '<div class="fb" data-fb="' + post._id + '" data-reveal>' +
      '<div class="fb__status" role="group" aria-label="Votre avis">' +
      '<button type="button" class="label fb__btn" data-fb-status="ok" aria-pressed="false">Validé</button>' +
      '<button type="button" class="label fb__btn" data-fb-status="revoir" aria-pressed="false">À revoir</button>' +
      '</div>' +
      '<textarea class="fb__note" rows="1" placeholder="Un commentaire ?" aria-label="Commentaire"></textarea>' +
      '</div>'
    );
  }
  function feedbackFooter() {
    var f = PLAN.feedback;
    if (!f) return '';
    var ways = [];
    if (f.whatsapp !== undefined) ways.push('<button type="button" class="label fb-send__btn" data-fb-send="whatsapp">Envoyer sur WhatsApp</button>');
    if (f.email !== undefined) ways.push('<button type="button" class="label fb-send__btn" data-fb-send="email">Envoyer par e-mail</button>');
    return (
      '<section class="fb-send" data-reveal>' +
      '<p class="label fb-send__kicker">Vos retours</p>' +
      '<p class="fb-send__text">Validez ou commentez chaque publication, puis envoyez-nous le récapitulatif.</p>' +
      '<p class="label fb-send__count" data-fb-count></p>' +
      '<div class="fb-send__ways">' + ways.join('') + '</div>' +
      '</section>'
    );
  }

  function render() {
    var app = document.getElementById('app');
    var c = PLAN.client || {};
    // Planning au mois (PLAN.months) ou à la semaine (PLAN.weeks)
    var monthly = !!PLAN.months;
    var weeks = PLAN.months || PLAN.weeks || [];
    function firstDate(w) { var p = list(w.posts)[0]; var k = w._key || w.month; return p ? parseDate(p.date) : k ? parseDate(String(k).slice(0, 7) + '-01') : new Date(); }
    var html = '';

    document.title = '18H22 × ' + (c.name || '') + ' · ' + (PLAN.title || 'Media planning');
    applyFonts();
    document.getElementById('bar').innerHTML = '<a href="#top" class="lockup-link" aria-label="Haut de page">' + lockup() + '</a>';

    var name = esc(c.name || '');
    var words = name.split(' ');
    html +=
      '<section class="hero" id="top">' +
      '<div class="hero__center">' +
      '<div class="hero__lockup" data-hero>' + lockup() + '</div>' +
      '<p class="label hero__kicker" data-hero>' + esc(PLAN.title || 'Media planning') + '</p>' +
      // Nom en un seul mot long (ex. Jacqueline) : taille réduite pour qu'il ne se coupe pas
      '<h1 class="hero__title' + (Math.max.apply(null, words.map(function (w) { return w.length; })) > 8 ? ' hero__title--long' : '') + '">' +
      words.map(function (w) {
        return '<span class="line">' + w.split('').map(function (ch) { return '<span class="char">' + ch + '</span>'; }).join('') + '</span>';
      }).join('') +
      '</h1>' +
      '<p class="label hero__services" data-hero>' + list(c.services).map(esc).join(' . ') + '</p>' +
      '<div class="hero__rule"></div>' +
      '</div>' +
      '<div class="hero__foot" data-hero><span class="label">' + esc(c.location || '') + '</span><span class="label">' + esc(PLAN.period || '') + '</span></div>' +
      '</section>';

    var total = 0, reels = 0;
    weeks.forEach(function (w) {
      list(w.posts).forEach(function (p) { total++; if (p.type === 'reel') reels++; });
    });

    html +=
      '<section class="intro">' +
      (PLAN.intro ? '<p class="intro__text" data-reveal>' + PLAN.intro + '</p>' : '') +
      '<div class="stats" data-reveal>' +
      '<div class="stat"><span class="stat__num" data-count="' + weeks.length + '">' + weeks.length + '</span><span class="label">' + (monthly ? 'Mois' : 'Semaines') + '</span></div>' +
      '<div class="stat"><span class="stat__num" data-count="' + total + '">' + total + '</span><span class="label">Publications</span></div>' +
      '<div class="stat"><span class="stat__num" data-count="' + reels + '">' + reels + '</span><span class="label">Reels</span></div>' +
      '</div>' +
      '<div class="legend label" data-reveal>' +
      '<span>' + ICONS.post.replace('<svg', '<svg width="13" height="13"') + 'Post</span>' +
      '<span>' + ICONS.carousel.replace('<svg', '<svg width="13" height="13"') + 'Carrousel</span>' +
      '<span>' + ICONS.reel.replace('<svg', '<svg width="13" height="13"') + 'Reel</span>' +
      '</div>' +
      '</section>';

    if (PLAN.theme || c.badge) {
      html +=
        '<section class="brand" id="univers">' +
        (c.badge ? '<div class="brand__badge" data-svg="' + esc(src(c.badge)) + '" data-compose></div>' : '') +
        (PLAN.brandText ? '<p class="brand__text" data-brand>' + PLAN.brandText + '</p>' : '') +
        '</section>';
    }

    html +=
      '<nav class="weeknav" aria-label="' + (monthly ? 'Mois' : 'Semaines') + '">' +
      '<a class="label" href="#feed">Feed</a>' +
      weeks.map(function (w, k) { return '<a class="label" href="#s' + (k + 1) + '">' + (monthly ? MOIS_LONGS[firstDate(w).getMonth()] : 'S' + pad(k + 1)) + '</a>'; }).join('') +
      (PLAN.ads ? '<a class="label" href="#ads">Sponsorisé</a>' : '') +
      (PLAN.suivi ? '<a class="label" href="#passages">' + (PLAN.suivi.passages === false ? 'Calendrier' : 'Passages') + '</a><a class="label" href="#missions">Missions</a>' : '') +
      '</nav>';

    // Le feed passe en premier (vue d'ensemble), le détail des posts suit
    var weeksHtml = '';

    weeks.forEach(function (w, k) {
      var posts = list(w.posts);
      var first = firstDate(w);
      var last = posts.length ? parseDate(posts[posts.length - 1].date) : first;
      var range = posts.length
        ? pad(first.getDate()) + (first.getMonth() !== last.getMonth() ? ' ' + MOIS[first.getMonth()] : '') +
          ' — ' + pad(last.getDate()) + ' ' + MOIS[last.getMonth()]
        : '';
      weeksHtml +=
        '<section class="week" id="s' + (k + 1) + '">' +
        '<header class="week__head">' +
        '<span class="week__num" aria-hidden="true">' + pad(monthly ? first.getMonth() + 1 : k + 1) + '</span>' +
        '<p class="label week__kicker" data-reveal>' + (monthly
          ? MOIS_LONGS[first.getMonth()] + ' ' + first.getFullYear() + ' · ' + (posts.length ? posts.length + ' publication' + (posts.length > 1 ? 's' : '') : 'publications à venir')
          : 'Semaine ' + pad(k + 1) + ' · ' + range) + '</p>' +
        '<h2 class="week__title" data-reveal>' + (w.title || (monthly ? MOIS_LONGS[first.getMonth()] : 'Semaine ' + (k + 1))) + '</h2>' +
        (w.theme ? '<p class="week__theme" data-reveal>' + esc(w.theme) + '</p>' : '') +
        '</header>' +
        posts.map(function (p, i) { return renderPost(p, k, i); }).join('') +
        (PLAN.suivi ? '<button type="button" class="label add-item" data-add-post="' + (w._key || iso(first)) + '"><span>+</span>Ajouter une publication</button>' + restoreHtml('post', w._key || iso(first).slice(0, 7)) : '') +
        '</section>';
    });

    // Aperçu du feed Instagram : du plus récent au plus ancien, comme sur le profil
    var feed = allPosts.slice().sort(function (a, b) { return b._date - a._date; });
    var live = list(PLAN.feedExisting);
    html +=
      '<section class="feed" id="feed">' +
      '<p class="label hero__kicker" data-reveal>Aperçu du profil · touchez un post pour le détail</p>' +
      '<h2 class="feed__title" data-reveal>Le <em>feed</em></h2>' +
      '<div class="grid">' +
      feed.map(function (p) {
        var n = list(p.options).length;
        return '<a href="#' + p._id + '" data-grid' + (n > 1 ? ' data-grid-options="' + p._id + '"' : '') + '>' + gridInner(p) + '</a>';
      }).join('') +
      live.map(function (img) {
        return '<a class="is-live" data-grid><img src="' + esc(src(img)) + '" alt="" loading="lazy" decoding="async"><span class="label grid__live">En ligne</span></a>';
      }).join('') +
      '</div>' +
      (live.length ? '<p class="label" style="margin-top:14px;opacity:.7">Voilés : publications déjà en ligne</p>' : '') +
      '</section>' +
      weeksHtml;

    html += adsHtml();
    html += feedbackFooter();
    html += suiviHtml();

    html +=
      '<footer class="footer">' +
      '<div class="footer__rule"></div>' +
      '<div class="hero__lockup">' + lockup() + '</div>' +
      (PLAN.footer ? '<p>' + esc(PLAN.footer) + '</p>' : '') +
      '<a class="label totop" href="#top">Haut de page</a>' +
      '</footer>';

    app.innerHTML = html;
  }

  function gridInner(p) {
    var img = p.type === 'reel' ? p.poster : list(p.options)[0] || list(p.media)[0];
    if (img && typeof img === 'object') img = img.poster;
    var n = list(p.options).length;
    var icon = n > 1 ? '<span class="label grid__options">' + LETTRES.slice(0, n).split('').join(' / ') + '</span>'
      : (p.type || 'post') === 'post' ? '' : '<span class="grid__icon">' + ICONS[p.type] + '</span>';
    return '<img src="' + esc(src(img)) + '" alt="" loading="lazy" decoding="async">' + icon +
      '<span class="label grid__day">' + JOURS[p._date.getDay()] + ' ' + pad(p._date.getDate()) + '</span>';
  }

  /* ------------------------------------------------ campagnes sponsorisées */
  // Deux campagnes par mois, budget indicatif mensuel, barre d'avancement du budget.
  // Photo, légende, budget, dépensé et état modifiables depuis l'espace équipe (EDITS).
  var EDITS = {};
  var AD_STATUS = { prevue: 'Prévue', live: 'En cours', done: 'Terminée' };
  function euros(n) {
    var r = Math.round(n * 100) / 100;
    return (r % 1 ? r.toFixed(2).replace('.', ',') : String(r)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
  }
  function adCampaigns() { return PLAN.ads ? list(PLAN.ads.campaigns) : []; }
  function adMonthKey(c) { return String(c.start || '').slice(0, 7); }
  // Campagne telle qu'affichée : plan.js + modifications de l'équipe + estimation du dépensé
  function adView(c) {
    var e = EDITS[c.id] || {};
    var same = adCampaigns().filter(function (x) { return adMonthKey(x) === adMonthKey(c); }).length || 1;
    var v = {
      id: c.id,
      objective: e.objective != null ? e.objective : c.objective,
      audience: e.audience != null ? e.audience : c.audience,
      cta: (e.cta != null ? e.cta : c.cta) || 'En savoir plus',
      title: e.title != null ? e.title : c.title,
      caption: e.caption != null ? String(e.caption).split(/\n+/).filter(Boolean) : list(c.caption),
      media: (e.media && e.media[0]) || c.media,
      start: e.start || c.start,
      end: e.end || c.end,
      budget: e.budget != null ? +e.budget : c.budget != null ? +c.budget : (PLAN.ads.budget || 0) / same,
    };
    var t = today(), s = v.start ? parseDate(v.start) : t, f = v.end ? parseDate(v.end) : s;
    v.status = e.status || (t < s ? 'prevue' : t > f ? 'done' : 'live');
    if (e.spent != null || c.spent != null) { v.spent = +(e.spent != null ? e.spent : c.spent); v.real = true; }
    else {
      // Diffusion régulière : estimation au prorata des jours écoulés
      var days = Math.round((f - s) / 864e5) + 1;
      var gone = v.status === 'prevue' ? 0 : v.status === 'done' ? days : Math.min(days, Math.round((t - s) / 864e5) + 1);
      v.spent = Math.round(v.budget * gone / Math.max(1, days));
      v.real = false;
    }
    v.edited = !!EDITS[c.id];
    return v;
  }
  function adRange(v) {
    if (!v.start) return '';
    var a = parseDate(v.start), b = parseDate(v.end || v.start);
    return pad(a.getDate()) + (a.getMonth() !== b.getMonth() ? ' ' + MOIS[a.getMonth()] : '') + ' → ' + pad(b.getDate()) + ' ' + MOIS[b.getMonth()];
  }
  function adCardHtml(v) {
    var ig = (PLAN.client && PLAN.client.instagram) || '';
    var initial = esc(((PLAN.client && PLAN.client.name) || '').charAt(0));
    var pct = v.budget ? Math.min(100, v.spent / v.budget * 100) : 0;
    return (
      '<div class="ad__phone">' +
      '<div class="ad__head"><span class="ad__avatar">' + initial + '</span>' +
      '<span class="ad__who"><b>' + esc(ig) + '</b><small>Sponsorisé</small></span><span class="ad__more" aria-hidden="true">···</span></div>' +
      '<div class="media ad__media"><div class="media__inner"><img src="' + esc(src(v.media)) + '" alt="" loading="lazy" decoding="async"></div></div>' +
      '<div class="ad__cta"><span>' + esc(v.cta) + '</span>' + SICONS_NEXT + '</div>' +
      '<div class="ad__caption">' + v.caption.map(function (p, k) { return '<p>' + (k ? '' : '<b>' + esc(ig) + '</b> ') + esc(p) + '</p>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="ad__info">' +
      '<div class="ad__top"><span class="label ad__status ad__status--' + v.status + '"><i></i>' + AD_STATUS[v.status] + '</span>' +
      '<span class="label ad__dates">' + adRange(v) + '</span></div>' +
      '<h3 class="ad__title">' + esc(v.title) + '</h3>' +
      '<dl class="ad__facts">' +
      (v.objective ? '<div><dt class="label">Objectif</dt><dd>' + esc(v.objective) + '</dd></div>' : '') +
      (v.audience ? '<div><dt class="label">Audience</dt><dd>' + esc(v.audience) + '</dd></div>' : '') +
      '</dl>' +
      '<div class="ad__budget"><div class="ad__bar"><span style="--p:' + pct.toFixed(1) + '%"></span></div>' +
      '<p class="label ad__spent"><b>' + euros(v.spent) + '</b> / ' + euros(v.budget) + (v.real ? '' : ' · estimé') + '</p></div>' +
      // Équipe : dépensé saisi directement sur la campagne
      '<form class="ad__quick" data-quick-spent="' + esc(v.id) + '" novalidate>' +
      '<label class="label" for="qs-' + esc(v.id) + '">Dépensé à ce jour</label>' +
      '<div class="ad__quick-row"><input id="qs-' + esc(v.id) + '" type="text" name="spent" inputmode="decimal" autocomplete="off" value="' + (v.real ? v.spent : '') + '" placeholder="' + (v.real ? '' : 'estimé ' + v.spent) + '">' +
      '<span aria-hidden="true">€</span><button type="submit" class="label">OK</button></div></form>' +
      '<button type="button" class="label edit-btn" data-edit-ad="' + esc(v.id) + '">' + EDIT_ICON + 'Modifier la campagne</button>' +
      '</div>'
    );
  }
  var SICONS_NEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg>';
  function adsHtml() {
    var all = adCampaigns();
    if (!all.length) return '';
    var months = [];
    all.forEach(function (c) { if (months.indexOf(adMonthKey(c)) < 0) months.push(adMonthKey(c)); });
    return (
      '<section class="ads" id="ads">' +
      '<header class="suivi__head">' +
      '<p class="label suivi__kicker" data-reveal>' + esc(PLAN.ads.platform || 'Publicité') + '</p>' +
      '<h2 class="suivi__title" data-reveal>Campagnes <em>sponsorisées</em></h2>' +
      '<p class="suivi__lead" data-reveal>Deux campagnes par mois, budget indicatif de ' + euros(PLAN.ads.budget || 0) + ' par mois.</p>' +
      '</header>' +
      months.map(function (m) {
        var d = parseDate(m + '-01');
        return '<div class="ads__month">' +
          '<div class="budget" data-reveal data-budget="' + m + '"></div>' +
          all.filter(function (c) { return adMonthKey(c) === m; }).map(function (c) {
            return '<article class="ad" id="ad-' + esc(c.id) + '" data-reveal data-ad="' + esc(c.id) + '">' + adCardHtml(adView(c)) + '</article>';
          }).join('') +
          (months.length > 1 ? '<p class="label ads__month-name">' + MOIS_LONGS[d.getMonth()] + '</p>' : '') +
          '</div>';
      }).join('') +
      (PLAN.suivi ? '<button type="button" class="label add-item" data-add-ad="' + months[months.length - 1] + '"><span>+</span>Ajouter une campagne</button>' + restoreHtml('ad') : '') +
      '</section>'
    );
  }
  // Barre d'avancement : dépensé (plein), engagé sur les campagnes (clair), budget indicatif du mois
  var adSig = {};
  function paintAds() {
    var all = adCampaigns();
    if (!all.length) return;
    var views = all.map(adView);
    views.forEach(function (v) {
      var box = document.querySelector('[data-ad="' + v.id + '"]');
      var sig = JSON.stringify(v);
      if (box && adSig[v.id] !== sig) {
        if (adSig[v.id] !== undefined) box.innerHTML = adCardHtml(v);
        adSig[v.id] = sig;
      }
    });
    document.querySelectorAll('[data-budget]').forEach(function (b) {
      var m = b.getAttribute('data-budget');
      var vs = views.filter(function (v, k) { return adMonthKey(all[k]) === m; });
      var cap = +((PLAN.ads.months || {})[m] || PLAN.ads.budget || 0);
      var spent = vs.reduce(function (a, v) { return a + v.spent; }, 0);
      var planned = vs.reduce(function (a, v) { return a + v.budget; }, 0);
      var est = vs.some(function (v) { return !v.real && v.status !== 'prevue'; });
      var max = Math.max(cap, planned) || 1;
      var d = parseDate(m + '-01');
      var pct = Math.round(spent / (cap || max) * 100);
      b.classList.toggle('is-over', planned > cap);
      b.innerHTML =
        '<div class="budget__top"><span class="label">' + MOIS_LONGS[d.getMonth()] + ' ' + d.getFullYear() + '</span>' +
        '<span class="label budget__pct">' + pct + ' %</span></div>' +
        '<p class="budget__nums"><b data-euros="' + spent + '">' + euros(b._shown || 0) + '</b><span> sur ' + euros(cap) + '</span></p>' +
        '<div class="budget__bar" role="img" aria-label="' + euros(spent) + ' dépensés sur ' + euros(cap) + '">' +
        '<span class="budget__planned" style="--p:' + (planned / max * 100).toFixed(1) + '%"></span>' +
        '<span class="budget__fill" style="--p:' + (spent / max * 100).toFixed(1) + '%"></span>' +
        (planned > cap ? '<i class="budget__cap" style="left:' + (cap / max * 100).toFixed(1) + '%"></i>' : '') +
        '</div>' +
        '<p class="label budget__legend">' +
        '<span><i class="budget__dot budget__dot--fill"></i>Dépensé' + (est ? ' (estimé)' : '') + '</span>' +
        '<span><i class="budget__dot budget__dot--planned"></i>Engagé ' + euros(planned) + '</span>' +
        '<span>Reste ' + euros(Math.max(0, cap - spent)) + '</span></p>' +
        '<p class="label budget__team">Dépensé : à saisir sur chaque campagne ci-dessous</p>';
      countEuros(b, spent);
    });
  }
  // Le montant défile jusqu'au dépensé quand la barre arrive à l'écran
  function countEuros(b, to) {
    var n = b.querySelector('[data-euros]');
    if (!b.classList.contains('is-in')) { b._target = to; return; }
    var from = b._shown || 0;
    b._shown = to;
    if (!gsap || from === to) { n.textContent = euros(to); return; }
    var o = { v: from };
    gsap.to(o, { v: to, duration: 1.6, ease: 'power2.out', onUpdate: function () { n.textContent = euros(Math.round(o.v)); } });
  }
  function initAds() {
    paintAds();
    var boxes = document.querySelectorAll('[data-budget]');
    if (!boxes.length) return;
    var go = function (b) { b.classList.add('is-in'); countEuros(b, b._target || 0); };
    if (!('IntersectionObserver' in window)) { boxes.forEach(go); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); setTimeout(function () { go(e.target); }, 350); } });
    }, { threshold: 0.4 });
    boxes.forEach(function (b) { io.observe(b); });
  }

  /* ------------------------------------- modifications de l'équipe (posts) */
  // Une modification remplace la photo (ou les photos d'un carrousel), la couverture ou la vidéo
  // d'un reel, le titre et la légende. Le post est redessiné sur place.
  function postView(p) {
    var o = p._orig, e = EDITS[p._key] || {};
    var v = { type: o.type || 'post', media: o.media, options: o.options, poster: o.poster, video: o.video, title: o.title, caption: o.caption };
    var orig = o.type || 'post';
    // e.format : l'équipe peut passer un post photo en reel (vidéo + couverture), ou un reel en photo
    var reel = e.format ? e.format === 'reel' : orig === 'reel';
    var photos = e.media && e.media.length ? e.media
      : orig === 'reel' ? list(o.poster) : list(o.options).length > 1 ? [list(o.options)[0]] : list(o.media).map(firstPath);
    if (reel) {
      v.type = 'reel';
      v.poster = e.poster || o.poster || photos[0];
      v.video = e.video || o.video;
      v.media = undefined;
      v.options = undefined;
    } else if (orig === 'reel' || (e.media && e.media.length)) {
      v.media = photos.length > 1 ? photos : photos[0];
      v.options = undefined;
      v.poster = v.video = undefined;
      v.type = photos.length > 1 ? 'carousel' : 'post';
    }
    if (e.title != null) v.title = e.title;
    if (e.caption != null) v.caption = String(e.caption).split(/\n+/).filter(Boolean);
    return v;
  }
  function firstPath(m) { return m && typeof m === 'object' ? m.poster : m; }
  var postSig = {};
  function applyEdits(edits) {
    EDITS = edits && typeof edits === 'object' && !Array.isArray(edits) ? edits : {};
    allPosts.forEach(function (p) {
      var v = postView(p);
      var sig = JSON.stringify(v);
      if (postSig[p._id] === undefined && !EDITS[p._key]) { postSig[p._id] = sig; return; }
      if (postSig[p._id] === sig) return;
      postSig[p._id] = sig;
      Object.keys(v).forEach(function (k) { p[k] = v[k]; });
      var art = document.getElementById(p._id);
      if (!art) return;
      art.setAttribute('data-type', p.type);
      art.querySelector('[data-slot="tag"]').innerHTML = tagHtml(p);
      var slot = art.querySelector('[data-slot="media"]');
      slot.innerHTML = mediaHtml(p);
      slot.querySelectorAll('.carousel').forEach(initCarousel);
      slot.querySelectorAll('video[data-autoplay]').forEach(function (vid) { attachVideo(vid, vid.getAttribute('data-video')).then(playVideo); });
      art.querySelector('[data-slot="caption"]').innerHTML = captionHtml(p);
      var dl = art.querySelector('[data-slot="dl"]');
      if (dl) dl.innerHTML = dlHtml(p);
      var cell = document.querySelector('[data-grid][href="#' + p._id + '"]');
      if (cell) { cell.innerHTML = gridInner(p); if (!list(p.options).length) cell.removeAttribute('data-grid-options'); }
    });
    paintAds();
  }

  function initFeedback() {
    if (!PLAN.feedback) return;
    var key = 'retours:' + (window.CLIENT_BASE || '') + (PLAN.period || '');
    var data = {};
    try { data = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) {}
    function save() { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {} }
    function paint(box) {
      var d = data[box.getAttribute('data-fb')] || {};
      box.querySelectorAll('[data-fb-status]').forEach(function (b) {
        var on = d.status === b.getAttribute('data-fb-status');
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      box.classList.toggle('is-ok', d.status === 'ok');
      box.classList.toggle('is-revoir', d.status === 'revoir');
      // Publication non validée : noir et blanc + croix, sur le post et sa vignette du feed
      var id = box.getAttribute('data-fb');
      var art = document.getElementById(id);
      var cell = document.querySelector('[data-grid][href="#' + id + '"]');
      [art, cell].forEach(function (n) { if (n) n.classList.toggle('is-refused', d.status === 'revoir'); });
    }
    function count() {
      var n = allPosts.filter(function (p) { var d = data[p._id]; return d && (d.status || d.note); }).length;
      var el = document.querySelector('[data-fb-count]');
      if (el) el.textContent = n + ' / ' + allPosts.length + ' publications commentées';
    }
    function grow(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
    fbRefresh = function (root) {
      (root || document).querySelectorAll('[data-fb]').forEach(function (box) {
        var d = data[box.getAttribute('data-fb')] || {};
        var t = box.querySelector('textarea');
        if (d.note && t && !t.value) { t.value = d.note; grow(t); }
        paint(box);
      });
      count();
    };
    fbRefresh();
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fb-status]');
      if (!b) return;
      var box = b.closest('[data-fb]');
      var id = box.getAttribute('data-fb');
      var d = data[id] || (data[id] = {});
      var v = b.getAttribute('data-fb-status');
      d.status = d.status === v ? '' : v;
      paint(box); save(); count();
    });
    document.addEventListener('input', function (e) {
      var t = e.target.closest('.fb__note');
      if (!t) return;
      var id = t.closest('[data-fb]').getAttribute('data-fb');
      (data[id] || (data[id] = {})).note = t.value;
      grow(t); save(); count();
    });
    function summary() {
      var c = PLAN.client || {};
      var lines = ['Retours ' + (c.name || '') + ' · ' + (PLAN.title || 'Media planning') + (PLAN.period ? ' (' + PLAN.period + ')' : ''), ''];
      allPosts.forEach(function (p) {
        var d = data[p._id] || {};
        var head = JOURS_LONGS[p._date.getDay()] + ' ' + p._date.getDate() + ' ' + MOIS[p._date.getMonth()] + (p.title ? ' · ' + p.title.replace(/<[^>]+>/g, '') : '');
        var st = d.status === 'ok' ? 'Validé' : d.status === 'revoir' ? 'À revoir' : 'Sans avis';
        var opt = '';
        var on = document.querySelector('#' + p._id + ' .options__btn.is-on');
        if (on) opt = ' · Proposition ' + LETTRES[+on.getAttribute('data-option')];
        lines.push(head);
        lines.push('→ ' + st + opt);
        if (d.note && d.note.trim()) lines.push('« ' + d.note.trim() + ' »');
        lines.push('');
      });
      // Inspirations du mois : seulement celles qui ont un avis ou un commentaire
      var ins = INSPI_ITEMS.filter(function (it) { var d = data['inspi-' + it.id]; return d && (d.status || (d.note && d.note.trim())); });
      if (ins.length) {
        lines.push('Inspiration du mois', '');
        ins.forEach(function (it) {
          var d = data['inspi-' + it.id];
          lines.push((it.author ? '@' + it.author + ' · ' : '') + it.url);
          lines.push('→ ' + (d.status === 'ok' ? 'Validé' : d.status === 'revoir' ? 'À revoir' : 'Sans avis'));
          if (d.note && d.note.trim()) lines.push('« ' + d.note.trim() + ' »');
          lines.push('');
        });
      }
      return lines.join('\n').trim();
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fb-send]');
      if (!b) return;
      var f = PLAN.feedback, txt = summary(), url;
      if (b.getAttribute('data-fb-send') === 'whatsapp') {
        url = 'https://wa.me/' + String(f.whatsapp || '').replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(txt);
      } else {
        url = 'mailto:' + (f.email || '') + '?subject=' + encodeURIComponent('Retours ' + ((PLAN.client || {}).name || '') + ' · ' + (PLAN.title || 'Media planning')) + '&body=' + encodeURIComponent(txt);
      }
      if (url.indexOf('mailto:') === 0 || !window.open(url, '_blank')) location.href = url;
    });
  }

  /* ---------------------------------------------------- typographies client */
  // Les polices du client servent à partir de son univers ; l'ouverture reste en 18H22
  function applyFonts() {
    var f = PLAN.fonts;
    if (!f) return;
    if (f.css) {
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = src(f.css);
      document.head.appendChild(l);
    }
    var root = document.documentElement;
    if (f.display) root.style.setProperty('--c-display', f.display);
    if (f.text) root.style.setProperty('--c-text', f.text);
    document.body.classList.add('has-client-fonts');
  }

  /* ------------------------------------------- suivi : passages & missions */
  var MOIS_LONGS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  var KIND = { photo: 'Shooting photo', video: 'Tournage vidéo', both: 'Photo + vidéo', meeting: 'Rendez-vous' };
  var CAT = { photo: 'Photos', video: 'Vidéo', montage: 'Montage', planning: 'Media planning', redaction: 'Rédaction', ads: 'Campagnes sponsorisées', autre: 'Autre' };
  var STATUS = { doing: 'En cours', todo: 'À venir', done: 'Livré' };
  var NEXT_STATUS = { todo: 'doing', doing: 'done', done: 'todo' };
  var SICONS = {
    photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3.5 8.5h3l1.6-2.5h7.8l1.6 2.5h3v10h-17z"/><circle cx="12" cy="13" r="3.6"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="7" width="12.5" height="10" rx="1.5"/><path d="M15.5 10.5l5-3v9l-5-3"/></svg>',
    both: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3.5 8.5h3l1.6-2.5h7.8l1.6 2.5h3v10h-17z"/><path d="M10.5 10.5v5l4-2.5z" fill="currentColor" stroke="none"/></svg>',
    meeting: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 6.5h16v10H9l-4 3.5v-3.5H4z"/></svg>',
    montage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="6.5" cy="7" r="2.5"/><circle cx="6.5" cy="17" r="2.5"/><path d="M8.6 8.4L20 16M8.6 15.6L20 8"/></svg>',
    planning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>',
    redaction: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 20l1-4.5L16 4.5l3.5 3.5-11 11z"/><path d="M13.5 7l3.5 3.5"/></svg>',
    autre: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
    ads: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 10v4h3l7 4.5v-13L7 10z"/><path d="M17.5 9.5a3.5 3.5 0 0 1 0 5M7 14l1.5 5h2.5L10 14.6"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17.5l5-4.5 4 3.5 3-2.5 4.5 3.5"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1-5.1-1.9 5.1-1.9z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 20l1-4.5L16 4.5l3.5 3.5-11 11z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9.5 5.5L16 12l-6.5 6.5"/></svg>',
  };
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function shortDate(s) { var d = parseDate(s); return JOURS[d.getDay()] + '. ' + pad(d.getDate()) + ' ' + MOIS[d.getMonth()]; }
  function options(map, sel) {
    return Object.keys(map).map(function (k) { return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + map[k] + '</option>'; }).join('');
  }

  function suiviHtml() {
    if (!PLAN.suivi) return '';
    var team = list(PLAN.suivi.team);
    var who = team.map(function (n, k) {
      return '<button type="button" class="label chip' + (k ? '' : ' is-on') + '" data-who="' + esc(n) + '" aria-pressed="' + (k ? 'false' : 'true') + '">' + esc(n) + '</button>';
    }).join('');
    // Sans passages prévus (suivi.passages: false) : le calendrier ne montre que les publications et le sponsorisé
    var pubs = PLAN.suivi.passages === false;
    var calHtml =
      '<div class="cal" data-reveal>' +
      '<div class="cal__top">' +
      '<button type="button" class="cal__nav" data-cal="-1" aria-label="Mois précédent">' + SICONS.prev + '</button>' +
      '<span class="cal__month" data-cal-month aria-live="polite"></span>' +
      '<button type="button" class="cal__nav" data-cal="1" aria-label="Mois suivant">' + SICONS.next + '</button>' +
      '</div>' +
      '<div class="cal__dow label" aria-hidden="true"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>' +
      '<div class="cal__grid" data-cal-grid></div>' +
      '<div class="cal__legend label">' + (pubs
        ? '<span><i class="cal__key cal__key--visit"></i>Publication</span><span><i class="cal__key cal__key--ad"></i>Sponsorisé</span>'
        : '<span><i class="cal__key cal__key--visit"></i>Passage</span><span><i class="cal__key cal__key--post"></i>Publication</span>') +
      '<span><i class="cal__key cal__key--today"></i>Aujourd’hui</span></div>' +
      '</div>';
    var passagesHtml = pubs
      ? '<section class="suivi suivi--pubs" id="passages">' +
        '<header class="suivi__head">' +
        '<p class="label suivi__kicker" data-reveal>Publications et sponsorisé</p>' +
        '<h2 class="suivi__title" data-reveal>Le calendrier</h2>' +
        '<p class="suivi__lead" data-reveal data-next>&nbsp;</p>' +
        '</header>' + calHtml +
        '<p class="label cal__tip">Touchez un jour pour voir la publication</p>' +
        '</section>'
      : '';
    return (
      passagesHtml +
      (pubs ? '' : '<section class="suivi" id="passages">' +
      '<header class="suivi__head">' +
      '<p class="label suivi__kicker" data-reveal>Sur place</p>' +
      '<h2 class="suivi__title" data-reveal>Jours de passage</h2>' +
      '<p class="suivi__lead" data-reveal data-next>&nbsp;</p>' +
      '</header>' +
      '<div class="admin-wrap"><div class="admin-wrap__in">' +
      '<form class="admin-form" data-add="passages" autocomplete="off">' +
      '<p class="label admin-form__title" data-form-title="Ajouter un passage">Ajouter un passage</p>' +
      '<div class="admin-form__row"><input type="date" name="date" required aria-label="Date"><input type="text" name="time" placeholder="Horaire (ex. 10h – 13h)" aria-label="Horaire" maxlength="30"></div>' +
      '<select name="kind" aria-label="Type de passage">' + options(KIND, 'photo') + '</select>' +
      '<input type="text" name="title" placeholder="Objet (ex. shooting de la carte)" aria-label="Objet" maxlength="140">' +
      '<div class="admin-form__actions"><button type="submit" class="label admin-form__go" data-go="Ajouter">Ajouter</button>' +
      '<button type="button" class="label admin-form__cancel" data-cancel>Annuler</button></div>' +
      '</form>' +
      '</div></div>' +
      '<div class="cal" data-reveal>' +
      '<div class="cal__top">' +
      '<button type="button" class="cal__nav" data-cal="-1" aria-label="Mois précédent">' + SICONS.prev + '</button>' +
      '<span class="cal__month" data-cal-month aria-live="polite"></span>' +
      '<button type="button" class="cal__nav" data-cal="1" aria-label="Mois suivant">' + SICONS.next + '</button>' +
      '</div>' +
      '<div class="cal__dow label" aria-hidden="true"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>' +
      '<div class="cal__grid" data-cal-grid></div>' +
      '<div class="cal__legend label"><span><i class="cal__key cal__key--visit"></i>Passage</span><span><i class="cal__key cal__key--post"></i>Publication</span><span><i class="cal__key cal__key--today"></i>Aujourd’hui</span></div>' +
      '</div>' +
      '<ol class="visits" data-visits></ol>' +
      '</section>') +

      '<section class="suivi" id="missions">' +
      '<header class="suivi__head">' +
      '<p class="label suivi__kicker" data-reveal>En coulisses</p>' +
      '<h2 class="suivi__title" data-reveal>Missions en cours</h2>' +
      '<div class="progress" data-reveal data-progress></div>' +
      '</header>' +
      '<div class="admin-wrap"><div class="admin-wrap__in">' +
      '<form class="admin-form" data-add="missions" autocomplete="off">' +
      '<p class="label admin-form__title" data-form-title="Nouvelle mission">Nouvelle mission</p>' +
      '<input type="text" name="title" placeholder="Ex. montage du reel « En cuisine »" aria-label="Mission" maxlength="140" required>' +
      '<div class="admin-form__row"><select name="cat" aria-label="Catégorie">' + options(CAT, 'photo') + '</select>' +
      '<select name="status" aria-label="État">' + options(STATUS, 'todo') + '</select></div>' +
      '<div class="admin-form__who"><span class="label">Publié par</span>' + who + '</div>' +
      '<div class="admin-form__actions"><button type="submit" class="label admin-form__go" data-go="Publier">Publier</button>' +
      '<button type="button" class="label admin-form__cancel" data-cancel>Annuler</button></div>' +
      '</form>' +
      '</div></div>' +
      '<ul class="tasks" data-tasks></ul>' +
      '<p class="label suivi__mode" data-suivi-mode></p>' +
      '</section>' +
      // Espace équipe : bouton flottant en bas à droite, on choisit le formulaire à ouvrir
      '<div class="team-fab" data-fab>' +
      '<div class="team-fab__menu" role="menu" aria-label="Espace équipe">' +
      (pubs ? '' : '<button type="button" class="team-fab__item" role="menuitem" data-goto="passages">' + SICONS.planning + '<span><b>Rendez-vous</b><small class="label">Calendrier des passages</small></span></button>') +
      '<button type="button" class="team-fab__item" role="menuitem" data-goto="contenus">' + SICONS.image + '<span><b>Publications</b><small class="label">Date, visuel, texte · ajouter, supprimer</small></span></button>' +
      (PLAN.ads ? '<button type="button" class="team-fab__item" role="menuitem" data-goto="ads">' + SICONS.ads + '<span><b>Sponsorisé</b><small class="label">Dépensé, budget, campagnes</small></span></button>' : '') +
      '<button type="button" class="team-fab__item" role="menuitem" data-goto="missions">' + SICONS.redaction + '<span><b>Tâches</b><small class="label">Missions en cours</small></span></button>' +
      '<button type="button" class="team-fab__item" role="menuitem" data-goto="inspi">' + SICONS.spark + '<span><b>Inspiration</b><small class="label">Reels et carrousels du mois</small></span></button>' +
      '<button type="button" class="team-fab__item team-fab__quit" role="menuitem" data-fab-quit>' + SICONS.close + '<span><b>Fermer l’espace équipe</b></span></button>' +
      '</div>' +
      '<button type="button" class="label team-fab__btn" data-fab-toggle aria-expanded="false"><i class="team-fab__dot"></i><span>Espace équipe</span></button>' +
      '</div>' +
      // Fenêtre intégrée (code équipe, confirmation) : les fenêtres du navigateur sont bloquées sur mobile
      '<div class="sheet" data-sheet aria-hidden="true">' +
      '<div class="sheet__backdrop" data-sheet-cancel></div>' +
      '<form class="sheet__panel" data-sheet-form role="dialog" aria-modal="true" autocomplete="off">' +
      '<p class="label sheet__kicker" data-sheet-kicker></p>' +
      '<h3 class="sheet__title" data-sheet-title></h3>' +
      '<input class="sheet__input" data-sheet-input type="password" autocomplete="current-password" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" aria-label="Code équipe">' +
      '<p class="label sheet__error" data-sheet-error aria-live="polite"></p>' +
      '<div class="sheet__actions"><button type="button" class="label sheet__btn" data-sheet-cancel>Annuler</button>' +
      '<button type="submit" class="label sheet__btn sheet__btn--main" data-sheet-ok>Valider</button></div>' +
      '</form></div>' +
      '<div class="toast label" data-toast aria-live="polite"></div>' +
      // Modifier un post ou une campagne : photo(s), légende, et pour les campagnes dates et budget
      '<div class="editor" data-editor aria-hidden="true">' +
      '<div class="editor__backdrop" data-editor-close></div>' +
      '<form class="editor__panel" data-editor-form role="dialog" aria-modal="true" aria-label="Modifier" autocomplete="off" novalidate>' +
      '<header class="editor__head"><div><p class="label editor__kicker" data-ed-kicker></p><h3 class="editor__title" data-ed-heading></h3></div>' +
      '<button type="button" class="inspi__close" data-editor-close aria-label="Fermer">' + SICONS.close + '</button></header>' +
      '<div class="editor__body" data-ed-body>' +
      // Parties numérotées, dans l'ordre utile : post (date, visuel, texte), campagne (dépensé et budget, dates, visuel, texte, ciblage)
      '<section class="ed-sec" data-sec="when"><h4 class="label ed-sec__title"><i></i>Date de publication</h4>' +
      '<div class="admin-form__row"><label class="editor__field"><span class="label">Jour</span><input type="date" name="date"></label>' +
      '<label class="editor__field"><span class="label">Heure</span><input type="text" name="time" maxlength="12" placeholder="18h30"></label></div></section>' +
      '<section class="ed-sec" data-sec="budget"><h4 class="label ed-sec__title"><i></i>Dépensé et budget</h4>' +
      '<div class="admin-form__row"><label class="editor__field"><span class="label">Dépensé à ce jour (€)</span><input type="text" name="spent" inputmode="decimal" autocomplete="off"></label>' +
      '<label class="editor__field"><span class="label">Budget (€)</span><input type="text" name="budget" inputmode="decimal" autocomplete="off"></label></div>' +
      '<p class="editor__hint">Le dépensé se lit dans le Gestionnaire de publicités Meta. Vide : estimé selon les jours de diffusion.</p></section>' +
      '<section class="ed-sec" data-sec="dates"><h4 class="label ed-sec__title"><i></i>Dates de diffusion</h4>' +
      '<div class="admin-form__row"><label class="editor__field"><span class="label">Début</span><input type="date" name="start"></label>' +
      '<label class="editor__field"><span class="label">Fin</span><input type="date" name="end"></label></div>' +
      '<label class="editor__field"><span class="label">État</span><select name="status"><option value="">Automatique (selon les dates)</option>' + options(AD_STATUS, '') + '</select></label></section>' +
      '<section class="ed-sec" data-sec="visual"><h4 class="label ed-sec__title"><i></i><span data-ed-media-label></span></h4>' +
      '<div class="ed-format" data-ed-format-box role="group" aria-label="Format du post"></div>' +
      '<div class="editor__media" data-ed-media></div>' +
      '<p class="editor__hint" data-ed-hint></p>' +
      '<div class="ed-cover" data-ed-cover></div>' +
      '<input type="file" accept="image/*" data-ed-file hidden>' +
      '<input type="file" accept="video/mp4,video/quicktime,video/*" data-ed-video hidden></section>' +
      '<section class="ed-sec" data-sec="text"><h4 class="label ed-sec__title"><i></i>Texte</h4>' +
      '<label class="editor__field"><span class="label">Titre</span><input type="text" name="title" maxlength="140"></label>' +
      '<label class="editor__field"><span class="label">Légende <small data-ed-count></small></span><textarea name="caption" rows="6" maxlength="2200" placeholder="Une ligne par paragraphe"></textarea></label></section>' +
      '<section class="ed-sec" data-sec="target"><h4 class="label ed-sec__title"><i></i>Ciblage</h4>' +
      '<label class="editor__field"><span class="label">Objectif</span><input type="text" name="objective" maxlength="160" placeholder="Notoriété, messages, trafic…"></label>' +
      '<label class="editor__field"><span class="label">Audience</span><input type="text" name="audience" maxlength="160" placeholder="Paris · 25-50 ans · centres d’intérêt"></label>' +
      '<label class="editor__field"><span class="label">Bouton</span><input type="text" name="cta" maxlength="40" placeholder="En savoir plus"></label></section>' +
      '<button type="button" class="label editor__delete" data-ed-delete></button>' +
      '</div>' +
      '<div class="editor__actions">' +
      '<button type="button" class="label editor__reset" data-ed-reset>Revenir à l’original</button>' +
      '<button type="submit" class="label admin-form__go" data-ed-save>Enregistrer</button>' +
      '</div>' +
      '</form></div>' +
      // Inspiration du mois : bouton flottant (couleur 18H22) et panneau des reels / carrousels Instagram
      '<button type="button" class="label inspi-fab" data-inspi-open hidden>' + SICONS.spark + '<span>Inspiration du mois</span></button>' +
      '<div class="inspi" data-inspi aria-hidden="true" role="dialog" aria-modal="true" aria-label="Inspiration du mois">' +
      '<div class="inspi__backdrop" data-inspi-close></div>' +
      '<div class="inspi__panel">' +
      '<header class="inspi__head"><div><p class="label inspi__kicker">Inspiration du mois</p><h3 class="inspi__title" data-inspi-month></h3></div>' +
      '<button type="button" class="inspi__close" data-inspi-close aria-label="Fermer">' + SICONS.close + '</button></header>' +
      '<form class="admin-form inspi__form" data-inspi-form autocomplete="off">' +
      '<p class="label admin-form__title">Ajouter une inspiration</p>' +
      '<p class="inspi__help">Collez le lien d’un reel, d’un carrousel ou d’un post : l’image, le compte et la légende sont récupérés sur Instagram.</p>' +
      '<input type="url" name="url" placeholder="Lien Instagram (reel, carrousel, post)" aria-label="Lien Instagram" required>' +
      '<div class="admin-form__row"><select name="format" aria-label="Format"><option value="">Format auto</option><option value="reel">Reel</option><option value="carousel">Carrousel</option><option value="post">Post</option></select>' +
      '<input type="text" name="note" placeholder="Ce qu’on en retient" aria-label="Note" maxlength="200"></div>' +
      '<button type="submit" class="label admin-form__go">Ajouter</button>' +
      '</form>' +
      '<div class="inspi__track" data-inspi-track></div>' +
      '<div class="inspi__dots" data-inspi-dots aria-hidden="true"></div>' +
      (PLAN.feedback && (PLAN.feedback.whatsapp !== undefined || PLAN.feedback.email !== undefined)
        ? '<div class="inspi__send"><p class="inspi__help">Validez ou commentez chaque inspiration, puis envoyez-nous vos retours.</p>' +
          '<button type="button" class="label fb-send__btn" data-fb-send="' + (PLAN.feedback.whatsapp !== undefined ? 'whatsapp' : 'email') + '">Envoyer mes retours</button></div>'
        : '') +
      '</div></div>'
    );
  }

  /* ------------------------------------------------- données de suivi.php */
  function json(r) {
    if (!r.ok) return Promise.reject(r.status);
    return r.text().then(function (t) { return JSON.parse(t); });
  }
  function valid(d) {
    if (!d || !Array.isArray(d.passages) || !Array.isArray(d.missions)) return false;
    if (!Array.isArray(d.inspirations)) d.inspirations = [];
    if (!d.edits || typeof d.edits !== 'object' || Array.isArray(d.edits)) d.edits = {};
    return true;
  }
  // Données partagées (suivi.php) ; sans PHP (aperçu statique) : fichier de départ, puis modifications gardées sur l'appareil
  function getSuivi() {
    var cfg = PLAN.suivi;
    var API = cfg.api ? src(cfg.api) : '';
    var LOCAL = 'suivi:' + BASE;
    var fromApi = API ? fetch(API + '?t=' + Date.now(), { cache: 'no-store' }).then(json) : Promise.reject();
    return fromApi.then(function (d) {
      if (!valid(d)) throw 0;
      return { d: d, mode: 'api' };
    }).catch(function () {
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem(LOCAL)); } catch (e) {}
      // Un appareil qui a déjà des modifications garde les siennes, en récupérant les inspirations ajoutées depuis
      if (saved && Array.isArray(saved.passages) && cfg.seed) {
        var mine = Array.isArray(saved.inspirations) ? saved.inspirations : [];
        var ids = mine.map(function (x) { return x.id; });
        saved.inspirations = (cfg.seed.inspirations || []).filter(function (x) { return ids.indexOf(x.id) < 0; }).concat(mine);
      }
      var d = valid(saved) ? saved : valid(cfg.seed) ? JSON.parse(JSON.stringify(cfg.seed))
        : fetch(src(cfg.data)).then(json).catch(function () { return { passages: [], missions: [] }; });
      return Promise.resolve(d).then(function (x) { return { d: x, mode: 'local' }; });
    });
  }
  var FIRST = null;
  var STRUCT_OK = false;
  // Après un ajout, un retrait ou un changement de date, la page se recharge sans l'ouverture 18H22
  var QUICK_KEY = 'mp-quick:' + BASE;
  var QUICK = null;
  try { QUICK = JSON.parse(sessionStorage.getItem(QUICK_KEY)); sessionStorage.removeItem(QUICK_KEY); } catch (e) {}
  function relaunch(o) {
    try { sessionStorage.setItem(QUICK_KEY, JSON.stringify(o)); } catch (e) {}
    location.reload();
  }

  function initSuivi() {
    var cfg = PLAN.suivi;
    if (!cfg) return;
    var API = cfg.api ? src(cfg.api) : '';
    var LOCAL = 'suivi:' + BASE;
    var CODE = 'suivi-code:' + BASE;
    var WHO = 'suivi-who:' + BASE;
    var state = { passages: [], missions: [] };
    var mode = 'api';
    var admin = false;
    var month = null;
    var wantsAdmin = new URLSearchParams(location.search).has('admin');
    var code = '';
    try { code = localStorage.getItem(CODE) || ''; } catch (e) {}

    var grid = document.querySelector('[data-cal-grid]');
    var monthEl = document.querySelector('[data-cal-month]');
    var visitsEl = document.querySelector('[data-visits]');
    var tasksEl = document.querySelector('[data-tasks]');
    var fab = document.querySelector('[data-fab]');

    function load() {
      var p = FIRST || getSuivi();
      FIRST = null;
      return p.then(function (r) {
        mode = r.mode;
        state = valid(r.d) ? r.d : { passages: [], missions: [] };
        paint();
      });
    }

    function localOp(op) {
      var d = JSON.parse(JSON.stringify(state));
      if (op.kind === 'edits') {
        if (op.action === 'reset') delete d.edits[op.id];
        else {
          var cur = d.edits[op.id] || {};
          Object.keys(op.item).forEach(function (k) { if (op.item[k] == null) delete cur[k]; else cur[k] = op.item[k]; });
          if (Object.keys(cur).length) d.edits[op.id] = cur; else delete d.edits[op.id];
        }
        try { localStorage.setItem(LOCAL, JSON.stringify(d)); } catch (e) { toast('Mémoire de l’appareil pleine : la photo ne sera pas gardée après fermeture.'); }
        return Promise.resolve(d);
      }
      var arr = d[op.kind];
      if (op.action === 'add') {
        var it = op.item;
        it.id = op.kind[0] + Date.now().toString(36);
        if (op.kind === 'missions' || op.kind === 'inspirations') { it.at = iso(new Date()); arr.unshift(it); }
        else { arr.push(it); arr.sort(function (a, b) { return a.date < b.date ? -1 : 1; }); }
      } else if (op.action === 'update') {
        arr.forEach(function (m) { if (m.id === op.id) m.status = op.status; });
      } else if (op.action === 'edit') {
        arr.forEach(function (x) { if (x.id === op.id) Object.keys(op.item).forEach(function (k) { x[k] = op.item[k]; }); });
        if (op.kind === 'passages') arr.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      } else if (op.action === 'delete') {
        d[op.kind] = arr.filter(function (x) { return x.id !== op.id; });
      }
      try { localStorage.setItem(LOCAL, JSON.stringify(d)); } catch (e) {}
      return Promise.resolve(d);
    }
    // Envoi en formulaire classique : accepté par tous les hébergeurs, sans en-tête personnalisé
    function post(op, c) {
      var body = new URLSearchParams();
      body.set('payload', JSON.stringify(op));
      body.set('code', c);
      return fetch(API + '?t=' + Date.now(), { method: 'POST', body: body, cache: 'no-store', credentials: 'same-origin' });
    }
    function why(r) {
      return r.text().then(function (t) {
        var e = '';
        try { e = JSON.parse(t).error; } catch (x) {}
        if (e === 'code') return 'Code incorrect.';
        if (e === 'storage') return 'Le dossier data n’est pas accessible en écriture sur l’hébergement.';
        if (e === 'too_big') return 'Fichier trop lourd pour l’hébergement' + (JSON.parse(t).max ? ' (maximum ' + JSON.parse(t).max + ')' : '') + '.';
        if (e === 'type') return 'Format non reconnu : photo JPG, PNG ou WebP, vidéo MP4 ou MOV.';
        if (e === 'uploads') return 'Le dossier uploads n’est pas accessible en écriture sur l’hébergement.';
        return 'Erreur serveur (' + r.status + '). Réessayez.';
      });
    }
    function send(op) {
      var p = mode === 'local' ? localOp(op) : post(op, code).then(function (r) {
        if (r.status === 403) { setAdmin(false, true); return Promise.reject('code'); }
        if (!r.ok) return why(r).then(function (m) { return Promise.reject(m); });
        return json(r);
      });
      return p.then(function (d) { if (valid(d)) { state = d; paint(); } return true; })
        .catch(function (e) { if (e !== 'code') toast(typeof e === 'string' ? e : 'La modification n’a pas pu être enregistrée. Réessayez.'); return false; });
    }

    /* Calendrier du mois */
    var PUBS = cfg.passages === false;
    // Mode publications : chaque post (date) et chaque campagne sponsorisée (du début à la fin)
    // Recalculé à chaque modification (date, ajout, retrait, format, titre), depuis le planning et les modifications de l'équipe
    function pubKind(type, e) {
      if (e.format ? e.format === 'reel' : type === 'reel') return 'reel';
      if (e.media && e.media.length) return e.media.length > 1 ? 'carousel' : 'post';
      return type === 'reel' ? 'post' : type || 'post';
    }
    function pubEvents() {
      var E = EDITS || {}, ev = [];
      var base = [];
      if (BASE_MONTHS) BASE_MONTHS.forEach(function (m) { list(m.posts).forEach(function (p) { base.push(p); }); });
      else allPosts.forEach(function (p) { base.push(p._orig || p); });
      base.forEach(function (p) {
        var e = (p.id && E[p.id]) || {};
        if (e.deleted || !p.date) return;
        ev.push({ date: e.date || p.date, kind: pubKind(p.type, e), title: e.title != null ? e.title : p.title, go: p.id ? 'p-' + String(p.id).replace(/[^a-z0-9-]/gi, '') : '' });
      });
      var ads = BASE_ADS ? BASE_ADS.slice() : adCampaigns();
      ads.forEach(function (c) {
        var e = E[c.id] || {};
        if (e.deleted) return;
        var st = e.start || c.start;
        if (st) ev.push({ date: st, end: e.end || c.end || st, kind: 'ad', title: e.title != null ? e.title : c.title, go: 'ad-' + c.id });
      });
      Object.keys(E).forEach(function (k) {
        var e = E[k];
        if (!e || e.deleted) return;
        if (e.added === 'post' && e.date) ev.push({ date: e.date, kind: pubKind('post', e), title: e.title || 'Nouvelle publication', go: 'p-' + k });
        if (e.added === 'ad' && e.start) ev.push({ date: e.start, end: e.end || e.start, kind: 'ad', title: e.title || 'Nouvelle campagne', go: 'ad-' + k });
      });
      return ev.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    }
    function paintPubCalendar() {
      var t = today();
      var ev = pubEvents();
      if (!month) {
        var first = ev.filter(function (x) { return parseDate(x.end || x.date) >= t; })[0] || ev[0];
        var ref = first ? parseDate(first.date) : t;
        if (ref < t && (!first || parseDate(first.end || first.date) >= t)) ref = t;
        month = new Date(ref.getFullYear(), ref.getMonth(), 1);
      }
      monthEl.textContent = MOIS_LONGS[month.getMonth()] + ' ' + month.getFullYear();
      var pubDays = {}, adDays = {};
      ev.forEach(function (x) {
        if (x.kind !== 'ad') { (pubDays[x.date] = pubDays[x.date] || []).push(x); return; }
        for (var d = parseDate(x.date), e = parseDate(x.end || x.date); d <= e; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
          (adDays[iso(d)] = adDays[iso(d)] || []).push(x);
        }
      });
      var start = new Date(month);
      start.setDate(1 - ((month.getDay() + 6) % 7));
      var cells = '';
      for (var i = 0; i < 42; i++) {
        var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        if (i >= 35 && d.getMonth() !== month.getMonth()) break;
        var k = iso(d), p = pubDays[k], a = adDays[k];
        var prev = iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)), next = iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
        var cls = 'cal__day' +
          (d.getMonth() !== month.getMonth() ? ' is-out' : '') +
          (p ? ' is-visit' : '') +
          (a ? ' is-ad' + (adDays[prev] ? '' : ' is-ad-start') + (adDays[next] ? '' : ' is-ad-end') + (a.length > 1 ? ' is-ad-double' : '') : '') +
          (+d === +t ? ' is-today' : '') +
          (d < t ? ' is-past' : '');
        var label = (p || []).concat(a || []).map(function (x) { return (x.kind === 'ad' ? 'Sponsorisé : ' : TYPE_LABEL[x.kind] + ' : ') + (x.title || ''); }).join(', ');
        var go = ((p || [])[0] || (a || [])[0] || {}).go;
        cells += p || a
          ? '<div class="' + cls + '" role="button" tabindex="0" data-day="' + k + '"' + (go ? ' data-cal-go="' + esc(go) + '"' : '') + ' aria-label="' + esc(shortDate(k) + ' · ' + label) + '">' +
            (a ? '<i class="cal__band" aria-hidden="true"></i>' : '') + '<span>' + d.getDate() + '</span></div>'
          : '<div class="' + cls + '"><span>' + d.getDate() + '</span></div>';
      }
      grid.innerHTML = cells;
    }
    // Plus de liste sous le calendrier : seulement la phrase d'en-tête (prochaine publication, nombre de posts et campagnes)
    function paintPubList() {
      var t = today();
      var ev = pubEvents();
      var posts = ev.filter(function (x) { return x.kind !== 'ad'; });
      var ads = ev.filter(function (x) { return x.kind === 'ad'; });
      var next = posts.filter(function (x) { return parseDate(x.date) >= t; })[0];
      var lead = document.querySelector('[data-next]');
      var count = posts.length + ' publication' + (posts.length > 1 ? 's' : '') + ', ' + ads.length + ' campagne' + (ads.length > 1 ? 's' : '');
      if (next) {
        var n = Math.round((parseDate(next.date) - t) / 864e5);
        lead.innerHTML = 'Prochaine publication <em>' + (n === 0 ? 'aujourd’hui' : n === 1 ? 'demain' : 'dans ' + n + ' jours') + '</em> · ' + count;
      } else lead.textContent = count + '.';
    }

    function paintCalendar() {
      if (PUBS) return paintPubCalendar();
      var t = today();
      if (!month) {
        var next = state.passages.filter(function (p) { return parseDate(p.date) >= t; })[0];
        var ref = next ? parseDate(next.date) : t;
        month = new Date(ref.getFullYear(), ref.getMonth(), 1);
      }
      monthEl.textContent = MOIS_LONGS[month.getMonth()] + ' ' + month.getFullYear();
      var byDay = {};
      state.passages.forEach(function (p) { (byDay[p.date] = byDay[p.date] || []).push(p); });
      var posts = {};
      allPosts.forEach(function (p) { posts[p.date] = true; });
      var start = new Date(month);
      start.setDate(1 - ((month.getDay() + 6) % 7)); // lundi de la première semaine
      var cells = '';
      for (var i = 0; i < 42; i++) {
        var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        if (i >= 35 && d.getMonth() !== month.getMonth()) break;
        var k = iso(d);
        var v = byDay[k];
        var cls = 'cal__day' +
          (d.getMonth() !== month.getMonth() ? ' is-out' : '') +
          (v ? ' is-visit' + (v.every(function (x) { return x.kind === 'meeting'; }) ? ' is-meeting' : '') : '') +
          (posts[k] ? ' has-post' : '') +
          (+d === +t ? ' is-today' : '') +
          (d < t ? ' is-past' : '');
        cells += v
          ? '<button type="button" class="' + cls + '" data-day="' + k + '" aria-label="' + esc(shortDate(k) + ' : ' + v.map(function (x) { return KIND[x.kind]; }).join(', ')) + '"><span>' + d.getDate() + '</span></button>'
          : '<span class="' + cls + '"><span>' + d.getDate() + '</span></span>';
      }
      grid.innerHTML = cells;
    }

    function paintVisits() {
      if (PUBS) return paintPubList();
      var t = today();
      var items = state.passages.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      var upcoming = items.filter(function (p) { return parseDate(p.date) >= t; });
      var lead = document.querySelector('[data-next]');
      if (upcoming.length) {
        var n = Math.round((parseDate(upcoming[0].date) - t) / 864e5);
        lead.innerHTML = 'Prochain passage <em>' + (n === 0 ? 'aujourd’hui' : n === 1 ? 'demain' : 'dans ' + n + ' jours') + '</em> · ' + upcoming.length + ' à venir';
      } else lead.textContent = items.length ? 'Tous les passages du mois sont faits.' : 'Les prochains passages arrivent bientôt.';
      visitsEl.innerHTML = items.map(function (p) {
        var d = parseDate(p.date);
        var past = d < t;
        var n = Math.round((d - t) / 864e5);
        return '<li class="visit' + (past ? ' is-past' : '') + '" data-visit="' + esc(p.date) + '">' +
          '<span class="visit__date"><span class="label">' + JOURS[d.getDay()] + '</span><strong>' + pad(d.getDate()) + '</strong><span class="label">' + MOIS[d.getMonth()] + '</span></span>' +
          '<span class="visit__body"><span class="label visit__kind">' + (SICONS[p.kind] || '') + (KIND[p.kind] || '') + '</span>' +
          (p.title ? '<span class="visit__title">' + esc(p.title) + '</span>' : '') +
          (p.time ? '<span class="visit__time">' + esc(p.time) + '</span>' : '') + '</span>' +
          '<span class="label visit__when">' + (past ? 'Fait' : n === 0 ? 'Aujourd’hui' : n === 1 ? 'Demain' : 'J-' + n) + '</span>' +
          '<span class="row-actions"><button type="button" class="del" data-edit="passages" data-id="' + esc(p.id) + '" aria-label="Modifier ce passage">' + SICONS.edit + '</button>' +
          '<button type="button" class="del" data-del="passages" data-id="' + esc(p.id) + '" aria-label="Supprimer ce passage">' + SICONS.close + '</button></span>' +
          '</li>';
      }).join('');
    }

    function paintTasks() {
      var order = { doing: 0, todo: 1, done: 2 };
      var items = state.missions.slice().sort(function (a, b) { return (order[a.status] - order[b.status]) || (a.at < b.at ? 1 : -1); });
      var count = { doing: 0, todo: 0, done: 0 };
      items.forEach(function (m) { count[m.status] = (count[m.status] || 0) + 1; });
      var total = items.length || 1;
      document.querySelector('[data-progress]').innerHTML =
        '<div class="progress__bar">' + ['done', 'doing', 'todo'].map(function (s) {
          return '<span class="progress__seg progress__seg--' + s + '" style="width:' + (count[s] / total * 100) + '%"></span>';
        }).join('') + '</div>' +
        '<p class="label progress__legend">' + ['doing', 'todo', 'done'].map(function (s) {
          return '<span><i class="progress__dot progress__dot--' + s + '"></i>' + count[s] + ' ' + STATUS[s].toLowerCase() + '</span>';
        }).join('') + '</p>';
      tasksEl.innerHTML = items.length ? items.map(function (m) {
        return '<li class="task task--' + esc(m.status) + '">' +
          '<span class="task__icon">' + (SICONS[m.cat] || SICONS.autre) + '</span>' +
          '<span class="task__body"><span class="label task__cat">' + esc(CAT[m.cat] || CAT.autre) + '</span>' +
          '<span class="task__title">' + esc(m.title) + '</span>' +
          '<span class="task__by"><i class="avatar avatar--' + esc(String(m.by).toLowerCase()) + '"' + ((cfg.colors || {})[m.by] ? ' style="background:' + esc(cfg.colors[m.by]) + '"' : '') + '>' + esc(String(m.by).charAt(0)) + '</i>Publié par ' + esc(m.by) + (m.at ? ' · ' + shortDate(m.at) : '') + '</span></span>' +
          '<button type="button" class="label task__status" data-status="' + esc(m.id) + '" data-now="' + esc(m.status) + '" tabindex="' + (admin ? '0' : '-1') + '">' + (STATUS[m.status] || '') + '</button>' +
          '<span class="row-actions"><button type="button" class="del" data-edit="missions" data-id="' + esc(m.id) + '" aria-label="Modifier cette mission">' + SICONS.edit + '</button>' +
          '<button type="button" class="del" data-del="missions" data-id="' + esc(m.id) + '" aria-label="Supprimer cette mission">' + SICONS.close + '</button></span>' +
          '</li>';
      }).join('') : '<li class="tasks__empty">Aucune mission pour le moment.</li>';
    }

    var shown = false;
    function paint() {
      applyEdits(state.edits);
      paintCalendar();
      paintVisits();
      paintTasks();
      paintInspi();
      document.querySelector('[data-suivi-mode]').textContent = admin && mode === 'local'
        ? 'Aperçu : les modifications restent sur cet appareil'
        : '';
      // Apparition en cascade au premier affichage
      if (!shown && gsap && window.ScrollTrigger && !reduce) {
        shown = true;
        window.ScrollTrigger.batch('.visit, .task', {
          start: 'top 94%', once: true,
          onEnter: function (els) { gsap.fromTo(els, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out' }); },
        });
        gsap.set('.visit, .task', { autoAlpha: 0 });
        window.ScrollTrigger.refresh();
      }
    }

    /* Fenêtre intégrée et petit message (remplacent prompt / confirm / alert) */
    var sheetEl = document.querySelector('[data-sheet]');
    var sheetForm = sheetEl.querySelector('[data-sheet-form]');
    var sheetInput = sheetEl.querySelector('[data-sheet-input]');
    var sheetErr = sheetEl.querySelector('[data-sheet-error]');
    var onSheet = null;
    // o : { kicker, title, input, ok, danger, submit(value) → Promise<true | 'message d'erreur'> }
    function sheet(o) {
      sheetEl.querySelector('[data-sheet-kicker]').textContent = o.kicker || '';
      sheetEl.querySelector('[data-sheet-title]').textContent = o.title || '';
      var ok = sheetEl.querySelector('[data-sheet-ok]');
      ok.textContent = o.ok || 'Valider';
      ok.classList.toggle('is-danger', !!o.danger);
      sheetInput.hidden = !o.input;
      sheetInput.value = '';
      sheetErr.textContent = '';
      onSheet = o.submit;
      sheetEl.classList.add('is-open');
      sheetEl.setAttribute('aria-hidden', 'false');
      // Le focus doit être donné pendant le toucher pour que le clavier s'ouvre sur iPhone
      if (o.input) sheetInput.focus({ preventScroll: true });
    }
    function closeSheet() {
      sheetEl.classList.remove('is-open');
      sheetEl.setAttribute('aria-hidden', 'true');
      sheetInput.blur();
      onSheet = null;
    }
    sheetForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!onSheet) return closeSheet();
      var ok = sheetEl.querySelector('[data-sheet-ok]');
      ok.disabled = true;
      Promise.resolve(onSheet(sheetInput.value.trim())).then(function (res) {
        ok.disabled = false;
        if (res === true) return closeSheet();
        sheetErr.textContent = res || '';
        sheetForm.classList.remove('is-shake');
        void sheetForm.offsetWidth;
        sheetForm.classList.add('is-shake');
        if (!sheetInput.hidden) { sheetInput.select(); }
      });
    });
    sheetEl.addEventListener('click', function (e) { if (e.target.closest('[data-sheet-cancel]')) closeSheet(); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (sheetEl.classList.contains('is-open')) closeSheet();
      else if (document.querySelector('[data-editor].is-open')) document.querySelector('[data-editor-close]').click();
      else if (document.querySelector('[data-inspi].is-open')) document.querySelector('[data-inspi-close]').click();
    });

    var toastEl = document.querySelector('[data-toast]'), toastT;
    function toast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add('is-on');
      clearTimeout(toastT);
      toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3200);
    }

    /* Mode équipe : ajouter, faire avancer, supprimer */
    function setAdmin(on, badCode) {
      var before = anchor && anchor.getBoundingClientRect().top;
      admin = on;
      document.body.classList.toggle('is-admin', on);
      if (!on && badCode) {
        code = '';
        try { localStorage.removeItem(CODE); } catch (e) {}
        toast('Code équipe à saisir de nouveau.');
      }
      if (fab) fab.classList.toggle('is-on', on);
      if (!on) {
        document.querySelectorAll('[data-add]').forEach(resetForm);
        document.querySelectorAll('.suivi.is-open').forEach(function (x) { x.classList.remove('is-open'); });
      }
      // Les formulaires apparaissent ou disparaissent : on garde le bouton touché sous le doigt
      paint();
      // Pendant l'ouverture / la fermeture en douceur, le bouton touché reste à sa place
      var a = anchor, t0 = performance.now();
      anchor = null;
      (function keep() {
        if (a) {
          var d = a.getBoundingClientRect().top - before;
          if (Math.abs(d) > 0.5) window.scrollTo({ top: window.pageYOffset + d, behavior: 'instant' });
        }
        if (performance.now() - t0 < 900) requestAnimationFrame(keep);
        else if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      })();
    }
    function askCode(then) {
      then = then || function () {};
      if (admin) { then(); return; }
      // Aperçu sans PHP : code vérifié sur la page seulement si l'aperçu en fournit un (suivi.localCode)
      if (mode === 'local' && !cfg.localCode) { setAdmin(true); then(); return; }
      sheet({
        kicker: 'Espace équipe',
        title: 'Code équipe',
        input: true,
        ok: 'Entrer',
        submit: function (c) {
          if (!c) return 'Saisissez le code.';
          if (mode === 'local') {
            if (c.toUpperCase() !== String(cfg.localCode).toUpperCase()) return 'Code incorrect.';
            setAdmin(true);
            setTimeout(then, 250);
            return true;
          }
          return post({ action: 'check' }, c)
            .then(function (r) {
              if (!r.ok) return why(r);
              code = c;
              try { localStorage.setItem(CODE, c); } catch (e) {}
              setAdmin(true);
              setTimeout(then, 250);
              return true;
            }).catch(function () { return 'Connexion impossible. Réessayez.'; });
        },
      });
    }

    /* Inspiration du mois */
    var inspiEl = document.querySelector('[data-inspi]');
    var inspiBtn = document.querySelector('[data-inspi-open]');
    var inspiTrack = inspiEl.querySelector('[data-inspi-track]');
    var FORMAT = { reel: 'Reel', carousel: 'Carrousel', post: 'Post' };
    function instaParts(u) {
      var m = /instagram\.com\/(?:[A-Za-z0-9._]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/.exec(u || '');
      return m ? { seg: m[1] === 'p' ? 'p' : 'reel', code: m[2] } : null;
    }
    function embed(path) {
      return '<iframe src="https://www.instagram.com/' + esc(path) + '/embed/" loading="lazy" allowtransparency="true" scrolling="no" title="Inspiration Instagram"></iframe>';
    }
    // Contenu Instagram pas encore récupéré (liens ajoutés avant, ou Instagram indisponible) : on le demande en fond
    var refreshed = false;
    function refreshInspi(id) {
      if (mode !== 'api' || !admin) return Promise.resolve();
      var op = { action: 'refresh', kind: 'inspirations' };
      if (id) op.id = id;
      else if (refreshed || !(state.inspirations || []).some(function (x) {
        return (!x.thumb && !x.tried) || (/\/reel\//.test(x.url) && !x.video && !x.vtried);
      })) return Promise.resolve();
      refreshed = true;
      return post(op, code).then(json).then(function (d) { if (valid(d)) { state = d; paint(); } }).catch(function () {});
    }
    var inspiSig = '';
    function paintInspi() {
      var items = state.inspirations || [];
      inspiBtn.hidden = !items.length && !admin;
      // Le mois du planning présenté (sinon le mois en cours)
      var first = list(list(PLAN.months || PLAN.weeks)[0] && list(PLAN.months || PLAN.weeks)[0].posts)[0];
      var ref = first ? parseDate(first.date) : new Date();
      inspiEl.querySelector('[data-inspi-month]').textContent = MOIS_LONGS[ref.getMonth()] + ' ' + ref.getFullYear();
      // On ne recharge les lecteurs Instagram que si la liste a changé
      var sig = JSON.stringify(items) + admin;
      if (sig === inspiSig) return;
      inspiSig = sig;
      INSPI_ITEMS = items;
      inspiTrack.innerHTML = items.length ? items.map(function (it) {
        var ig = instaParts(it.url);
        if (!ig) return '';
        var f = it.format || (ig.seg === 'reel' ? 'reel' : 'carousel');
        return '<article class="inspi__card inspi__card--' + esc(f) + '" id="inspi-' + esc(it.id) + '">' +
          '<div class="inspi__meta"><span class="label inspi__tag">' + (SICONS[f === 'reel' ? 'video' : 'photo']) + esc(FORMAT[f] || '') + '</span>' +
          '<button type="button" class="del" data-del="inspirations" data-id="' + esc(it.id) + '" aria-label="Supprimer cette inspiration">' + SICONS.close + '</button></div>' +
          (it.video
            // Reel copié sur le site : lu directement dans le panneau
            ? '<div class="inspi__frame inspi__frame--video"><video src="' + esc(src(it.video)) + '"' + (it.thumb ? ' poster="' + esc(src(it.thumb)) + '"' : '') +
              ' playsinline controls preload="metadata"></video></div>'
            : it.thumb
            // Contenu récupéré : l'image du post, le lecteur Instagram se charge au toucher
            ? '<button type="button" class="inspi__frame inspi__poster" data-inspi-play="' + ig.seg + '/' + esc(ig.code) + '" aria-label="Lire sur la page">' +
              '<img src="' + esc(src(it.thumb)) + '" alt="" loading="lazy"><span class="inspi__play">' + ICONS.play + '</span></button>'
            : '<div class="inspi__frame">' + embed(ig.seg + '/' + ig.code) + '</div>') +
          (it.author ? '<p class="label inspi__author">@' + esc(it.author) + '</p>' : '') +
          (!it.thumb && admin && mode === 'api' ? '<button type="button" class="label inspi__retry" data-inspi-retry="' + esc(it.id) + '">Récupérer le contenu Instagram</button>' : '') +
          (it.note ? '<p class="inspi__note">' + esc(it.note) + '</p>' : '') +
          '<a class="label inspi__link" href="' + esc(it.url) + '" target="_blank" rel="noopener">Ouvrir sur Instagram</a>' +
          feedbackHtml({ _id: 'inspi-' + it.id }).replace(' data-reveal', '') +
          '</article>';
      }).join('') : '<p class="inspi__empty">Les inspirations du mois arrivent bientôt.</p>';
      fbRefresh(inspiTrack);
      inspiEl.querySelector('[data-inspi-dots]').innerHTML = items.length > 1 ? items.map(function (_, k) { return '<i class="' + (k ? '' : 'is-on') + '"></i>'; }).join('') : '';
    }
    inspiTrack.addEventListener('scroll', function () {
      var cards = inspiTrack.querySelectorAll('.inspi__card');
      if (!cards.length) return;
      var k = Math.round(inspiTrack.scrollLeft / (cards[0].offsetWidth + 14));
      cards.forEach(function (c, j) { var v = c.querySelector('video'); if (v && j !== k && !v.paused) v.pause(); });
      inspiEl.querySelectorAll('[data-inspi-dots] i').forEach(function (d, j) { d.classList.toggle('is-on', j === k); });
    }, { passive: true });
    function inspi(open) {
      if (open) refreshInspi();
      else inspiEl.querySelectorAll('video').forEach(function (v) { v.pause(); });
      inspiEl.classList.toggle('is-open', open);
      inspiEl.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.classList.toggle('is-locked', open);
    }
    inspiEl.querySelector('[data-inspi-form]').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var url = f.elements.url.value.trim();
      if (!instaParts(url)) { toast('Collez un lien Instagram de reel, carrousel ou post.'); return; }
      var go = f.querySelector('.admin-form__go');
      if (go.disabled) return;
      go.disabled = true;
      go.textContent = mode === 'api' ? 'Récupération sur Instagram…' : 'Ajout…';
      send({ action: 'add', kind: 'inspirations', item: { url: url, format: f.elements.format.value, note: f.elements.note.value.trim(), by: who } })
        .then(function () {
          go.disabled = false;
          go.textContent = 'Ajouter';
          f.reset();
          inspiTrack.scrollTo({ left: 0, behavior: 'smooth' });
          var first = (state.inspirations || [])[0];
          if (mode === 'api' && first && !first.thumb) toast('Lien ajouté. Instagram n’a pas donné l’image : le lecteur Instagram est affiché à la place.');
        });
    });

    /* Photos et légendes : chaque post et chaque campagne sponsorisée (espace équipe) */
    var edEl = document.querySelector('[data-editor]');
    var edForm = edEl.querySelector('[data-editor-form]');
    var edFile = edEl.querySelector('[data-ed-file]');
    var edVideo = edEl.querySelector('[data-ed-video]');
    var edBox = edEl.querySelector('[data-ed-media]');
    var ed = null; // { kind: 'post' | 'ad', key, post | camp, slot, index, busy }
    function edPath(m) { return m && typeof m === 'object' ? m.poster : m; }
    function edIsReel() { return ed.kind === 'post' && postView(ed.post).type === 'reel'; }
    // Photos actuelles (plan.js ou déjà modifiées), dans l'ordre
    function edList() {
      if (ed.kind === 'ad') return [adView(ed.camp).media];
      var v = postView(ed.post);
      if (v.type === 'reel') return [v.poster];
      if (list(v.options).length > 1) return [list(v.options)[0]];
      return list(v.media).map(edPath);
    }
    function edTile(path, n, slot, k, removable) {
      return '<figure class="ed-tile">' +
        '<img src="' + esc(src(path)) + '" alt="">' + (n ? '<figcaption class="label">' + n + '</figcaption>' : '') +
        '<div class="ed-tile__acts"><button type="button" class="label" data-ed-pick="' + slot + '" data-k="' + k + '">Remplacer</button>' +
        (removable ? '<button type="button" class="ed-tile__del" data-ed-remove="' + k + '" aria-label="Retirer cette photo">' + SICONS.close + '</button>' : '') +
        '</div></figure>';
    }
    function edPaintMedia() {
      if (!ed) return;
      var label = edEl.querySelector('[data-ed-media-label]');
      var hint = edEl.querySelector('[data-ed-hint]');
      var fmt = edEl.querySelector('[data-ed-format-box]');
      var reelNow = edIsReel();
      fmt.innerHTML = ed.kind === 'post'
        ? '<button type="button" class="label" data-ed-format="photo" aria-pressed="' + !reelNow + '">Photo ou carrousel</button>' +
          '<button type="button" class="label" data-ed-format="reel" aria-pressed="' + reelNow + '">Vidéo (reel)</button>'
        : '';
      var cover = edEl.querySelector('[data-ed-cover]');
      cover.innerHTML = '';
      if (reelNow) {
        var v = postView(ed.post);
        label.textContent = 'Visuel · vidéo et couverture';
        edBox.innerHTML =
          '<figure class="ed-tile ed-tile--video">' +
          (v.video ? '<video src="' + esc(src(v.video)) + '#t=0.5" muted playsinline preload="metadata"></video>' : '<span class="label ed-tile__soon">Pas encore de vidéo</span>') +
          '<figcaption class="label">Vidéo</figcaption>' +
          '<div class="ed-tile__acts"><button type="button" class="label" data-ed-pick="video" data-k="0">' + (v.video ? 'Remplacer' : 'Choisir la vidéo') + '</button></div></figure>' +
          edTile(v.poster, 'Couverture', 'poster', 0, false);
        hint.textContent = 'Vidéo verticale MP4 ou MOV. La couverture est l’image affichée dans le feed.';
        // Couverture choisie dans la vidéo : on fait défiler, puis « Utiliser cette image »
        if (v.video) {
          cover.innerHTML =
            '<p class="label editor__label">Choisir la couverture dans la vidéo</p>' +
            '<div class="ed-cover__frame"><video data-ed-scrub src="' + esc(src(v.video)) + '" muted playsinline preload="auto"></video></div>' +
            '<input type="range" class="ed-cover__range" min="0" max="1000" value="' + (ed.coverT == null ? 20 : ed.coverT) + '" step="1" data-ed-time aria-label="Moment de la vidéo">' +
            '<div class="ed-cover__acts"><button type="button" class="label admin-form__go" data-ed-grab>Utiliser cette image</button>' +
            '<button type="button" class="label admin-form__cancel" data-ed-pick="poster" data-k="0">Importer une photo</button></div>';
          var sv = cover.querySelector('[data-ed-scrub]');
          sv.addEventListener('loadedmetadata', function () {
            try { sv.currentTime = ed && ed.coverT != null ? ed.coverT / 1000 * sv.duration : Math.min(0.5, sv.duration / 2); } catch (er) {}
          });
        }
      } else {
        var imgs = edList();
        label.textContent = ed.kind === 'ad' ? 'Visuel' : imgs.length > 1 ? 'Visuel · carrousel de ' + imgs.length + ' photos' : 'Visuel';
        edBox.innerHTML = imgs.map(function (m, k) { return edTile(m, imgs.length > 1 ? k + 1 : '', 'media', k, imgs.length > 1); }).join('') +
          (ed.kind === 'post' && imgs.length < 10
            ? '<button type="button" class="ed-add" data-ed-pick="media" data-k="-1"><span>+</span><small class="label">Ajouter une photo</small></button>' : '');
        hint.textContent = ed.kind === 'ad'
          ? 'Format conseillé 4:5 (1080 × 1350).'
          : imgs.length > 1 ? 'Remplacez ou retirez une photo ; une photo ajoutée se place à la fin. Format conseillé 4:5.' : 'Format conseillé 4:5 (1080 × 1350). Ajouter une photo en fait un carrousel.';
      }
      if (ed.busy) edBox.insertAdjacentHTML('afterbegin', '<div class="ed-busy label" data-ed-busy>' + ed.busy + '</div>');
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }
    function edOrig() {
      if (ed.kind === 'ad') {
        var c = ed.camp, b = c._base || c, same = adCampaigns().filter(function (x) { return adMonthKey(x) === adMonthKey(c); }).length || 1;
        return { title: c.title || '', caption: list(c.caption).join('\n'), start: b.start || '', end: b.end || '',
          budget: c.budget != null ? +c.budget : (PLAN.ads.budget || 0) / same,
          objective: c.objective || '', audience: c.audience || '', cta: c.cta || '' };
      }
      var o = ed.post._orig, pb = o._base || o;
      return { title: o.title || '', caption: list(o.caption).join('\n'), date: pb.date || '', time: pb.time || '' };
    }
    function edCount() {
      var t = edForm.elements.caption;
      edEl.querySelector('[data-ed-count]').textContent = '· ' + t.value.length + ' / 2200';
    }
    // Nouvelle publication ou campagne : créée dans le mois, puis la page se recharge sur son formulaire
    function addItem(kind, mk) {
      var t = today(), first = parseDate((mk || iso(t).slice(0, 7)) + '-01');
      var lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0);
      var day = t >= first && t <= lastDay ? t : first;
      var id = (kind === 'ad' ? 'ad-' : 'pub-') + Date.now().toString(36);
      var item;
      if (kind === 'ad') {
        var end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 13);
        item = { added: 'ad', start: iso(day), end: iso(end > lastDay ? lastDay : end), title: 'Nouvelle campagne' };
      } else item = { added: 'post', date: iso(day), time: '18h30', title: 'Nouvelle publication' };
      toast(kind === 'ad' ? 'Création de la campagne…' : 'Création de la publication…');
      send({ action: 'edit', kind: 'edits', id: id, item: item }).then(function (ok) {
        if (ok) relaunch({ to: kind === 'ad' ? 'ad-' + id : 'p-' + id, admin: true, open: [kind, id], msg: 'Ajoutée : complétez la date, la photo et la légende.' });
      });
    }
    function openEditor(kind, key) {
      var camp = kind === 'ad' ? adCampaigns().filter(function (c) { return c.id === key; })[0] : null;
      var p = kind === 'post' ? allPosts.filter(function (x) { return x._key === key; })[0] : null;
      if (!camp && !p) return;
      ed = { kind: kind, key: key, camp: camp, post: p };
      var f = edForm.elements;
      var e = EDITS[key] || {};
      if (kind === 'ad') {
        var v = adView(camp);
        edEl.querySelector('[data-ed-kicker]').textContent = 'Campagne sponsorisée · ' + adRange(v);
        edEl.querySelector('[data-ed-heading]').textContent = v.title;
        f.title.value = v.title || '';
        f.caption.value = v.caption.join('\n');
        f.start.value = v.start || '';
        f.end.value = v.end || '';
        f.budget.value = Math.round(v.budget * 100) / 100;
        f.spent.value = e.spent != null ? e.spent : '';
        f.spent.placeholder = v.real ? '' : 'Estimé : ' + v.spent;
        f.status.value = e.status || '';
        f.objective.value = v.objective || '';
        f.audience.value = v.audience || '';
        f.cta.value = e.cta != null ? e.cta : camp.cta || '';
        if (!v.title) edEl.querySelector('[data-ed-heading]').textContent = 'Nouvelle campagne';
      } else {
        var pv = postView(p);
        edEl.querySelector('[data-ed-kicker]').textContent = TYPE_LABEL[pv.type] + ' · ' + JOURS_LONGS[p._date.getDay()] + ' ' + p._date.getDate() + ' ' + MOIS[p._date.getMonth()];
        edEl.querySelector('[data-ed-heading]').textContent = pv.title || 'Publication';
        f.title.value = pv.title || '';
        f.caption.value = list(pv.caption).join('\n');
        f.date.value = p.date || '';
        f.time.value = p.time || '';
      }
      var order = kind === 'ad' ? ['budget', 'dates', 'visual', 'text', 'target'] : ['when', 'visual', 'text'];
      var body = edEl.querySelector('[data-ed-body]');
      edEl.querySelectorAll('[data-sec]').forEach(function (x) { x.hidden = order.indexOf(x.getAttribute('data-sec')) < 0; });
      order.forEach(function (n, k) {
        var sec = body.querySelector('[data-sec="' + n + '"]');
        sec.querySelector('.ed-sec__title i').textContent = k + 1;
        sec.classList.toggle('is-first', !k);
        body.insertBefore(sec, body.querySelector('[data-ed-delete]'));
      });
      var del = edEl.querySelector('[data-ed-delete]');
      del.classList.remove('is-confirm');
      del.textContent = kind === 'ad' ? 'Supprimer cette campagne' : 'Supprimer cette publication';
      var reset = edEl.querySelector('[data-ed-reset]');
      reset.hidden = !EDITS[key] || !!e.added;
      reset.classList.remove('is-confirm');
      reset.textContent = 'Revenir à l’original';
      edCount();
      edPaintMedia();
      edEl.classList.add('is-open');
      edEl.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      edEl.querySelector('.editor__body').scrollTop = 0;
    }
    function closeEditor() {
      if (ed && ed.busy) { toast('Envoi en cours, patientez.'); return; }
      edEl.classList.remove('is-open');
      edEl.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      ed = null;
    }
    function errMsg(e, d) {
      if (e === 'too_big') return 'Fichier trop lourd pour l’hébergement' + (d && d.max ? ' (maximum ' + d.max + ')' : '') + '.';
      if (e === 'type') return 'Format non reconnu : photo JPG, PNG ou WebP, vidéo MP4 ou MOV.';
      if (e === 'uploads') return 'Le dossier uploads n’est pas accessible en écriture sur l’hébergement.';
      if (e === 'storage') return 'Le dossier data n’est pas accessible en écriture sur l’hébergement.';
      return '';
    }
    // Photo réduite sur le téléphone avant l'envoi (2048 px, JPEG) : envoi rapide, même en 4G
    function prepImage(file, max, q) {
      return new Promise(function (res) {
        if (!/^image\/(jpeg|png|webp|heic|heif)/i.test(file.type)) return res(file);
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () {
          var w = img.naturalWidth, h = img.naturalHeight, r = Math.min(1, max / Math.max(w, h));
          if (r === 1 && file.size < 1500000 && /jpeg/i.test(file.type)) { URL.revokeObjectURL(url); return res(file); }
          var c = document.createElement('canvas');
          c.width = Math.round(w * r); c.height = Math.round(h * r);
          var x = c.getContext('2d');
          x.fillStyle = (PLAN.theme && PLAN.theme.bg) || '#f1eee6';
          x.fillRect(0, 0, c.width, c.height);
          x.drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          c.toBlob(function (b) { res(b || file); }, 'image/jpeg', q);
        };
        img.onerror = function () { URL.revokeObjectURL(url); res(file); };
        img.src = url;
      });
    }
    function upload(file) {
      var e = ed, slot = e.slot, k = e.index;
      var base = edList();
      var isVideo = slot === 'video';
      e.busy = isVideo ? 'Envoi de la vidéo…' : 'Envoi de la photo…';
      edPaintMedia();
      var done = function () { e.busy = ''; if (ed === e) edPaintMedia(); };
      var fail = function (m) { done(); if (m !== 'code') toast(m || 'Envoi impossible. Réessayez.'); };
      // Sans PHP (aperçu) : photo gardée sur l'appareil, vidéo seulement le temps de la visite
      if (mode === 'local') {
        var keep = function (url) {
          var item = {};
          if (slot === 'media') { if (k < 0) base.push(url); else base[k] = url; item.media = base; }
          else item[slot] = url;
          return send({ action: 'edit', kind: 'edits', id: e.key, item: item }).then(done);
        };
        if (isVideo) { toast('Aperçu : la vidéo n’est gardée que pendant cette visite.'); return keep(URL.createObjectURL(file)); }
        return prepImage(file, 1280, 0.8).then(function (b) {
          var r = new FileReader();
          r.onload = function () { keep(r.result); };
          r.onerror = function () { fail(); };
          r.readAsDataURL(b);
        });
      }
      var ready = isVideo ? Promise.resolve(file) : prepImage(file, 2048, 0.86);
      return ready.then(function (blob) {
        return new Promise(function (res, rej) {
          var fd = new FormData();
          fd.append('payload', JSON.stringify({ action: 'upload', kind: 'edits', id: e.key, slot: slot, index: k, base: base }));
          fd.append('code', code);
          fd.append('file', blob, isVideo ? (file.name || 'video.mp4') : 'photo.jpg');
          var x = new XMLHttpRequest();
          x.open('POST', API + '?t=' + Date.now());
          x.upload.onprogress = function (ev) {
            if (!ev.lengthComputable) return;
            var b = edBox.querySelector('[data-ed-busy]');
            e.busy = (isVideo ? 'Envoi de la vidéo… ' : 'Envoi de la photo… ') + Math.round(ev.loaded / ev.total * 100) + ' %';
            if (b) b.textContent = e.busy;
          };
          x.onload = function () {
            var d = null;
            try { d = JSON.parse(x.responseText); } catch (er) {}
            if (x.status === 403 && d && d.error === 'code') { setAdmin(false, true); return rej('code'); }
            if (x.status >= 200 && x.status < 300 && valid(d)) return res(d);
            rej(errMsg(d && d.error, d) || 'Envoi impossible (' + x.status + '). Réessayez.');
          };
          x.onerror = function () { rej('Connexion impossible. Réessayez.'); };
          x.send(fd);
        });
      }).then(function (d) {
        state = d;
        paint();
        done();
        var r = edEl.querySelector('[data-ed-reset]');
        if (r) r.hidden = false;
        toast(isVideo ? 'Vidéo enregistrée.' : 'Photo enregistrée.');
      }, fail);
    }
    // Image d'une vidéo → JPEG (couverture du reel)
    function grabFrame(v) {
      return new Promise(function (res, rej) {
        try {
          var w = v.videoWidth, h = v.videoHeight;
          if (!w || !h) return rej();
          var r = Math.min(1, 1600 / Math.max(w, h));
          var c = document.createElement('canvas');
          c.width = Math.round(w * r); c.height = Math.round(h * r);
          c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
          c.toBlob(function (b) { if (b) res(b); else rej(); }, 'image/jpeg', 0.88);
        } catch (er) { rej(er); }
      });
    }
    // Après l'envoi d'une vidéo sans couverture choisie : une image du début sert de couverture
    function autoCover(key) {
      var e = EDITS[key] || {};
      if (!e.video || e.poster || !ed || ed.key !== key) return;
      var v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.preload = 'auto';
      v.src = src(e.video);
      v.addEventListener('loadeddata', function () { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); }, { once: true });
      v.addEventListener('seeked', function () {
        grabFrame(v).then(function (b) {
          if (!ed || ed.key !== key) return;
          ed.slot = 'poster'; ed.index = 0;
          return upload(b).then(function () { toast('Couverture prise au début de la vidéo : changez-la ci-dessous si besoin.'); });
        }).catch(function () {});
      }, { once: true });
      v.load();
    }
    function pickFile(input) {
      return function () {
        var f = input.files && input.files[0];
        input.value = '';
        if (!f || !ed) return;
        if (input === edVideo ? !/^video\//.test(f.type) && !/\.(mp4|mov|m4v)$/i.test(f.name) : !/^image\//.test(f.type)) {
          toast(input === edVideo ? 'Choisissez une vidéo (MP4 ou MOV).' : 'Choisissez une photo.');
          return;
        }
        var key = ed.key, isVid = input === edVideo;
        if (isVid) ed.coverT = null;
        Promise.resolve(upload(f)).then(function () { if (isVid) autoCover(key); });
      };
    }
    edFile.addEventListener('change', pickFile(edFile));
    edVideo.addEventListener('change', pickFile(edVideo));
    edForm.elements.caption.addEventListener('input', edCount);
    edEl.addEventListener('input', function (e) {
      var r = e.target.closest('[data-ed-time]');
      if (!r) return;
      var v = edEl.querySelector('[data-ed-scrub]');
      ed.coverT = +r.value;
      if (v && v.duration) v.currentTime = r.value / 1000 * v.duration;
    });
    edEl.addEventListener('click', function (e) {
      var t;
      if (e.target.closest('[data-editor-close]')) closeEditor();
      else if ((t = e.target.closest('[data-ed-format]'))) {
        if (ed.busy) return;
        var want = t.getAttribute('data-ed-format');
        var orig = (ed.post._orig.type || 'post') === 'reel' ? 'reel' : 'photo';
        send({ action: 'edit', kind: 'edits', id: ed.key, item: { format: want === orig ? null : want } }).then(function () {
          edPaintMedia();
          edEl.querySelector('[data-ed-reset]').hidden = !EDITS[ed.key];
        });
      } else if ((t = e.target.closest('[data-ed-grab]'))) {
        if (ed.busy) return;
        grabFrame(edEl.querySelector('[data-ed-scrub]')).then(function (b) {
          ed.slot = 'poster'; ed.index = 0;
          upload(b);
        }, function () { toast('Image indisponible : laissez la vidéo se charger puis réessayez.'); });
      }
      else if ((t = e.target.closest('[data-ed-pick]'))) {
        if (ed.busy) return;
        ed.slot = t.getAttribute('data-ed-pick');
        ed.index = +t.getAttribute('data-k');
        var input = ed.slot === 'video' ? edVideo : edFile;
        input.click();
      } else if ((t = e.target.closest('[data-ed-remove]'))) {
        if (ed.busy) return;
        var l = edList();
        l.splice(+t.getAttribute('data-ed-remove'), 1);
        send({ action: 'edit', kind: 'edits', id: ed.key, item: { media: l } }).then(function () { edPaintMedia(); edEl.querySelector('[data-ed-reset]').hidden = false; });
      } else if ((t = e.target.closest('[data-ed-delete]'))) {
        if (ed.busy) return;
        if (!t.classList.contains('is-confirm')) {
          t.classList.add('is-confirm');
          t.textContent = 'Toucher encore pour supprimer';
          return;
        }
        var isAdDel = ed.kind === 'ad';
        var back = isAdDel ? 'ads' : 's' + (ed.post._week + 1);
        // Ajoutée par l'équipe : effacée ; prévue au planning : retirée (photos envoyées gardées jusqu'à « Revenir à l'original »)
        var op = (EDITS[ed.key] || {}).added
          ? { action: 'reset', kind: 'edits', id: ed.key }
          : { action: 'edit', kind: 'edits', id: ed.key, item: { deleted: true } };
        send(op).then(function (ok) {
          if (!ok) return;
          ed = null;
          relaunch({ to: back, admin: true, msg: isAdDel ? 'Campagne supprimée.' : 'Publication supprimée.' });
        });
      } else if ((t = e.target.closest('[data-ed-reset]'))) {
        if (!t.classList.contains('is-confirm')) {
          t.classList.add('is-confirm');
          t.textContent = 'Toucher encore pour confirmer';
          return;
        }
        var key = ed.key;
        send({ action: 'reset', kind: 'edits', id: key }).then(function () { closeEditor(); toast('Version d’origine rétablie.'); });
      }
    });
    edForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!ed || ed.busy) return;
      var f = edForm.elements, o = edOrig();
      var caption = f.caption.value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean).join('\n');
      var item = {
        title: f.title.value.trim() === o.title ? null : f.title.value.trim(),
        caption: caption === o.caption ? null : caption,
      };
      if (ed.kind === 'ad') {
        var num = function (v) { v = String(v).replace(',', '.').trim(); return v === '' || isNaN(+v) ? null : Math.max(0, +v); };
        var b = num(f.budget.value);
        item.budget = b == null || Math.abs(b - o.budget) < 0.005 ? null : b;
        item.spent = num(f.spent.value);
        item.start = f.start.value && f.start.value !== o.start ? f.start.value : null;
        item.end = f.end.value && f.end.value !== o.end ? f.end.value : null;
        item.status = f.status.value || null;
        ['objective', 'audience', 'cta'].forEach(function (k) { var v = f[k].value.trim(); item[k] = v === o[k] ? null : v; });
      } else {
        item.date = f.date.value && f.date.value !== o.date ? f.date.value : null;
        var tm = f.time.value.trim();
        item.time = tm && tm !== o.time ? tm : null;
      }
      var added = (EDITS[ed.key] || {}).added;
      if (added) {
        // Publication ou campagne ajoutée : ses dates restent toujours enregistrées
        if (ed.kind === 'ad') { item.start = item.start || ed.camp.start; item.end = item.end || ed.camp.end; }
        else item.date = item.date || ed.post.date;
      }
      if (ed.kind === 'ad' && (item.end || ed.camp.end) < (item.start || ed.camp.start)) { toast('La fin doit être après le début.'); return; }
      // Nouvelle date : la page se recharge pour remettre le planning et le calendrier dans l'ordre
      var moved = ed.kind === 'ad'
        ? (f.start.value || ed.camp.start) !== ed.camp.start || (f.end.value || ed.camp.end) !== ed.camp.end
        : (f.date.value || ed.post.date) !== ed.post.date || tm !== (ed.post.time || '');
      var target = ed.kind === 'ad' ? 'ad-' + ed.key : ed.post._id;
      var go = edEl.querySelector('[data-ed-save]');
      go.disabled = true;
      send({ action: 'edit', kind: 'edits', id: ed.key, item: item }).then(function (ok) {
        go.disabled = false;
        if (!ok) return;
        if (moved) { ed = null; relaunch({ to: target, admin: true, msg: 'Date enregistrée.' }); return; }
        closeEditor();
        toast('Modifications enregistrées.');
      });
    });

    // Dépensé saisi directement sur la carte de la campagne
    document.addEventListener('submit', function (e) {
      var f = e.target.closest && e.target.closest('[data-quick-spent]');
      if (!f) return;
      e.preventDefault();
      if (!admin) return;
      var raw = String(f.elements.spent.value).replace(',', '.').trim();
      var val = raw === '' ? null : Math.max(0, +raw);
      if (raw !== '' && isNaN(+raw)) { toast('Montant non reconnu.'); return; }
      var btn = f.querySelector('button');
      btn.disabled = true;
      send({ action: 'edit', kind: 'edits', id: f.getAttribute('data-quick-spent'), item: { spent: val } }).then(function (ok) {
        btn.disabled = false;
        if (ok) toast(val == null ? 'Dépensé : retour à l’estimation.' : 'Dépensé enregistré : ' + euros(val) + '.');
      });
    });

    // Ouvre le formulaire d'une section (l'autre se referme) et y descend en douceur
    function openSection(kind) {
      document.querySelectorAll('.suivi').forEach(function (x) {
        if (x.id !== kind && x.classList.contains('is-open')) { x.classList.remove('is-open'); resetForm(x.querySelector('[data-add]')); }
      });
      var sec = document.getElementById(kind);
      sec.classList.add('is-open');
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }, 1000);
    }
    function menu(open) {
      if (!fab) return;
      fab.classList.toggle('is-menu', open);
      fab.querySelector('[data-fab-toggle]').setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    var who = list(cfg.team)[0];
    try { who = localStorage.getItem(WHO) || who; } catch (e) {}
    function paintWho() {
      document.querySelectorAll('[data-who]').forEach(function (b) {
        var on = b.getAttribute('data-who') === who;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    paintWho();

    var anchor = null;

    // Modifier une mission ou un passage déjà publié : le formulaire se remplit
    function resetForm(f) {
      if (!f) return;
      f.reset();
      delete f.dataset.editing;
      f.classList.remove('is-editing');
      f.querySelector('[data-form-title]').textContent = f.querySelector('[data-form-title]').getAttribute('data-form-title');
      var go = f.querySelector('[data-go]');
      go.textContent = go.getAttribute('data-go');
    }
    function startEdit(kind, id) {
      var it = state[kind].filter(function (x) { return x.id === id; })[0];
      var f = document.querySelector('[data-add="' + kind + '"]');
      if (!it || !f) return;
      document.getElementById(kind).classList.add('is-open');
      ['title', 'cat', 'status', 'date', 'time', 'kind'].forEach(function (n) {
        if (f.elements[n] && it[n] != null) f.elements[n].value = it[n];
      });
      if (kind === 'missions' && it.by) { who = it.by; paintWho(); }
      f.dataset.editing = id;
      f.classList.add('is-editing');
      f.querySelector('[data-form-title]').textContent = kind === 'missions' ? 'Modifier la mission' : 'Modifier le passage';
      f.querySelector('[data-go]').textContent = 'Enregistrer';
      f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    document.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-cal]'))) {
        month = new Date(month.getFullYear(), month.getMonth() + +t.getAttribute('data-cal'), 1);
        paintCalendar();
      } else if (PUBS && (t = e.target.closest('[data-cal-go]'))) {
        var goEl = document.getElementById(t.getAttribute('data-cal-go'));
        if (goEl) window.scrollTo({ top: goEl.getBoundingClientRect().top + window.pageYOffset - 90, behavior: 'smooth' });
      } else if ((t = e.target.closest('[data-day]'))) {
        var li = visitsEl.querySelector('[data-visit="' + t.getAttribute('data-day') + '"]');
        grid.querySelectorAll('.is-picked').forEach(function (x) { x.classList.remove('is-picked'); });
        t.classList.add('is-picked');
        if (li) {
          li.scrollIntoView({ behavior: 'smooth', block: 'center' });
          li.classList.remove('is-flash');
          void li.offsetWidth;
          li.classList.add('is-flash');
        }
      } else if ((t = e.target.closest('[data-goto-id]'))) {
        var target = document.getElementById(t.getAttribute('data-goto-id'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if ((t = e.target.closest('[data-who]'))) {
        who = t.getAttribute('data-who');
        try { localStorage.setItem(WHO, who); } catch (e2) {}
        paintWho();
      } else if (admin && (t = e.target.closest('[data-status]'))) {
        send({ action: 'update', kind: 'missions', id: t.getAttribute('data-status'), status: NEXT_STATUS[t.getAttribute('data-now')] || 'todo' });
      } else if ((t = e.target.closest('[data-add-post], [data-add-ad]'))) {
        var addAd = t.hasAttribute('data-add-ad');
        var mk = String(t.getAttribute(addAd ? 'data-add-ad' : 'data-add-post') || '').slice(0, 7);
        askCode(function () { addItem(addAd ? 'ad' : 'post', mk); });
      } else if (admin && (t = e.target.closest('[data-restore]'))) {
        var rid = t.getAttribute('data-restore'), rAd = t.getAttribute('data-restore-kind') === 'ad';
        send({ action: 'edit', kind: 'edits', id: rid, item: { deleted: null } }).then(function (ok) {
          if (ok) relaunch({ to: rAd ? 'ad-' + rid : 'p-' + rid.replace(/[^a-z0-9-]/gi, ''), admin: true, msg: rAd ? 'Campagne rétablie.' : 'Publication rétablie.' });
        });
      } else if ((t = e.target.closest('[data-edit-post], [data-edit-ad]'))) {
        var isAd = t.hasAttribute('data-edit-ad');
        var edKey = t.getAttribute(isAd ? 'data-edit-ad' : 'data-edit-post');
        askCode(function () { openEditor(isAd ? 'ad' : 'post', edKey); });
      } else if (admin && (t = e.target.closest('[data-edit]'))) {
        startEdit(t.getAttribute('data-edit'), t.getAttribute('data-id'));
      } else if ((t = e.target.closest('[data-cancel]'))) {
        resetForm(t.closest('[data-add]'));
      } else if (admin && (t = e.target.closest('[data-del]'))) {
        var delKind = t.getAttribute('data-del'), delId = t.getAttribute('data-id');
        var item = state[delKind].filter(function (x) { return x.id === delId; })[0] || {};
        sheet({
          kicker: { missions: 'Supprimer la mission', passages: 'Supprimer le passage', inspirations: 'Supprimer l’inspiration' }[delKind],
          title: item.title || (item.date ? shortDate(item.date) : '') || (item.note || 'Ce lien Instagram'),
          ok: 'Supprimer',
          danger: true,
          submit: function () { send({ action: 'delete', kind: delKind, id: delId }); return true; },
        });
      } else if (e.target.closest('[data-fab-toggle]')) {
        menu(!fab.classList.contains('is-menu'));
      } else if ((t = e.target.closest('[data-goto]'))) {
        var kind = t.getAttribute('data-goto');
        menu(false);
        askCode(function () {
          if (kind === 'inspi') inspi(true);
          else if (kind === 'contenus') {
            var first = document.querySelector('.week');
            if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
            toast('Touchez « Modifier la publication » sous un post.');
          } else if (kind === 'ads') {
            var ads = document.querySelector('.ads .ad');
            if (ads) window.scrollTo({ top: ads.getBoundingClientRect().top + window.pageYOffset - 90, behavior: 'smooth' });
            toast('Saisissez le dépensé sur chaque campagne.');
          } else openSection(kind);
        });
      } else if ((t = e.target.closest('[data-inspi-play]'))) {
        t.outerHTML = '<div class="inspi__frame">' + embed(t.getAttribute('data-inspi-play')) + '</div>';
      } else if (admin && (t = e.target.closest('[data-inspi-retry]'))) {
        t.disabled = true;
        t.textContent = 'Récupération…';
        refreshInspi(t.getAttribute('data-inspi-retry')).then(function () {
          if (t.isConnected) { t.disabled = false; t.textContent = 'Réessayer'; toast('Instagram ne répond pas pour ce lien. Réessayez plus tard.'); }
        });
      } else if (e.target.closest('[data-inspi-open]')) {
        inspi(true);
      } else if (e.target.closest('[data-inspi-close]')) {
        inspi(false);
      } else if (e.target.closest('[data-fab-quit]')) {
        menu(false);
        // On garde sous les yeux ce qui est au centre de l'écran pendant que les formulaires se replient
        var mid = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        anchor = mid && !mid.closest('.admin-form') ? mid.closest('.task, .visit, header, section') : null;
        setAdmin(false);
      }
      if (fab && fab.classList.contains('is-menu') && !e.target.closest('[data-fab]')) menu(false);
    });

    document.addEventListener('submit', function (e) {
      var f = e.target.closest('[data-add]');
      if (!f) return;
      e.preventDefault();
      var kind = f.getAttribute('data-add');
      var v = function (n) { return f.elements[n] ? f.elements[n].value.trim() : ''; };
      var item = kind === 'missions'
        ? { title: v('title'), cat: v('cat'), status: v('status'), by: who }
        : { date: v('date'), time: v('time'), kind: v('kind'), title: v('title') };
      if (kind === 'missions' ? !item.title : !item.date) return;
      var editId = f.dataset.editing;
      send(editId ? { action: 'edit', kind: kind, id: editId, item: item } : { action: 'add', kind: kind, item: item }).then(function () {
        resetForm(f);
        if (kind === 'passages') month = new Date(parseDate(item.date).getFullYear(), parseDate(item.date).getMonth(), 1);
        paint();
      });
    });

    // Les autres ont peut-être modifié entre-temps : on recharge au retour sur la page
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && mode === 'api') load();
    });

    load().then(function () {
      // Hébergement lent : le planning s'est affiché avant les données ; s'il y a des ajouts, retraits ou dates, on recharge une fois
      var E = state.edits || {};
      var moved = Object.keys(E).some(function (k) { var e = E[k] || {}; return e.added || e.deleted || e.date || e.start || e.end; });
      if (!STRUCT_OK && moved && !(QUICK && QUICK.retry)) { relaunch({ retry: true, admin: admin }); return; }
      if (code && mode === 'api') setAdmin(true);
      if (QUICK) {
        if (QUICK.admin && !admin) setAdmin(true);
        if (QUICK.msg) toast(QUICK.msg);
        if (QUICK.open && admin) setTimeout(function () { openEditor(QUICK.open[0], QUICK.open[1]); }, 500);
        return;
      }
      // Lien direct vers le panneau d'inspiration pour l'équipe : ?inspi
      if (new URLSearchParams(location.search).has('inspi')) askCode(function () { inspi(true); });
      else if (!admin && wantsAdmin) menu(true);
    });
  }

  /* ------------------------------------------------------------ carrousel */
  // Liens internes (feed, menu des semaines) : défilement doux
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  }

  // Feed : toucher une vignette ouvre la publication sur place (visuel, légende, retours, modification),
  // sans descendre dans la page. Le post est déplacé dans le panneau puis remis à sa place.
  function initPostSheet() {
    var box = el('<div class="postsheet" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Publication">' +
      '<div class="postsheet__backdrop" data-postsheet-close></div>' +
      '<div class="postsheet__panel"><button type="button" class="postsheet__close" data-postsheet-close aria-label="Fermer">' + SICONS.close + '</button>' +
      '<div class="postsheet__body" data-postsheet-body></div></div></div>');
    document.body.appendChild(box);
    var body = box.querySelector('[data-postsheet-body]');
    var cur = null, mark = null, timer = 0;
    function settle(art) {
      // Les apparitions au défilement de ce post sont jouées tout de suite
      if (window.ScrollTrigger) window.ScrollTrigger.getAll().forEach(function (st) {
        if (st.trigger && art.contains(st.trigger) && st.animation) { st.animation.progress(1); st.kill(); }
      });
    }
    function putBack() {
      clearTimeout(timer);
      if (!cur) return;
      cur.querySelectorAll('video').forEach(function (v) { try { v.pause(); } catch (e) {} });
      mark.parentNode.replaceChild(cur, mark);
      cur = mark = null;
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }
    function open(art) {
      putBack();
      settle(art);
      mark = document.createComment('post');
      art.parentNode.insertBefore(mark, art);
      body.appendChild(art);
      cur = art;
      body.scrollTop = 0;
      box.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      requestAnimationFrame(function () { box.classList.add('is-open'); });
    }
    function close() {
      if (!box.classList.contains('is-open')) return;
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      if (!document.querySelector('.inspi.is-open, .editor.is-open')) document.body.classList.remove('is-locked');
      timer = setTimeout(putBack, 650);
    }
    // En capture : passe avant le défilement doux des liens internes
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-grid][href^="#"]');
      if (!a) return;
      var art = document.getElementById(a.getAttribute('href').slice(1));
      if (!art || !art.classList.contains('post')) return;
      e.preventDefault();
      e.stopPropagation();
      open(art);
    }, true);
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-postsheet-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('is-open') && !document.querySelector('.editor.is-open')) close();
    });
  }

  // Propositions : le choix met à jour le visuel, le badge et la vignette du feed
  function initOptions() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-option]');
      if (!btn) return;
      var k = +btn.getAttribute('data-option');
      var post = btn.closest('.post');
      var media = post.querySelector('[data-options]');
      var imgs = media.querySelectorAll('.option');
      imgs.forEach(function (im, j) { im.classList.toggle('is-on', j === k); });
      media.querySelector('.option__badge b').textContent = LETTRES[k];
      post.querySelectorAll('[data-option]').forEach(function (b, j) {
        b.classList.toggle('is-on', j === k);
        b.setAttribute('aria-pressed', j === k ? 'true' : 'false');
      });
      var thumb = document.querySelector('[data-grid-options="' + post.id + '"] img');
      if (thumb) thumb.src = imgs[k].src;
    });
  }

  function initCarousels() {
    document.querySelectorAll('.carousel').forEach(initCarousel);
  }
  function initCarousel(car) {
    (function () {
      var media = car.closest('.media');
      var count = media.querySelector('.carousel__count b');
      var dots = media.parentNode.querySelectorAll('.dots i');
      var raf;
      car.addEventListener('scroll', function () {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var k = Math.round(car.scrollLeft / car.clientWidth);
          count.textContent = k + 1;
          dots.forEach(function (d, j) { d.classList.toggle('is-on', j === k); });
        });
      }, { passive: true });
    })();
  }

  // Safari iOS refuse une vidéo si le serveur ne gère pas les requêtes partielles (Range),
  // ce qui est le cas de certains hébergeurs. On télécharge donc la vidéo entière puis on la
  // lit depuis la mémoire (blob:), ce qui marche partout. Repli sur l'URL directe si besoin.
  var blobs = {};
  var ready = {};
  function videoUrl(url) {
    if (!blobs[url]) {
      blobs[url] = !window.fetch ? Promise.resolve(url) : fetch(url)
        .then(function (r) { return r.ok ? r.blob() : Promise.reject(r.status); })
        .then(function (b) { return (ready[url] = URL.createObjectURL(new Blob([b], { type: 'video/mp4' }))); })
        .catch(function () { return url; });
    }
    return blobs[url];
  }
  // Lecture avec le son ; si le navigateur refuse, on repasse en muet (bouton pour réactiver)
  function playWithSound(v) {
    var p = v.play();
    if (p && p.catch) p.catch(function (err) {
      if (err && err.name === 'NotAllowedError') {
        v.muted = true;
        if (current && current.video === v) setSound(v);
        var q = v.play();
        if (q && q.catch) q.catch(function () {});
      }
    });
    if (current && current.video === v) setSound(v);
  }

  function attachVideo(v, url) {
    return videoUrl(url).then(function (u) {
      if (v.getAttribute('data-loaded') !== u) {
        v.src = u;
        v.setAttribute('data-loaded', u);
      }
      return v;
    });
  }
  function playVideo(v) {
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  // Vidéos dans les carrousels : lecture muette seulement quand la slide est à l'écran
  function initInlineVideos() {
    var vids = document.querySelectorAll('video[data-autoplay]');
    if (!vids.length) return;
    if (!('IntersectionObserver' in window)) {
      vids.forEach(function (v) { attachVideo(v, v.getAttribute('data-video')).then(playVideo); });
      return;
    }
    // Préchargement un peu avant que la slide arrive
    var pre = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { videoUrl(e.target.getAttribute('data-video')); pre.unobserve(e.target); }
      });
    }, { rootMargin: '600px 600px' });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        v._visible = e.isIntersecting && e.intersectionRatio > 0.5;
        if (v._visible) {
          attachVideo(v, v.getAttribute('data-video')).then(function () { if (v._visible) playVideo(v); });
        } else if (!v.paused) v.pause();
      });
    }, { threshold: [0, 0.5, 1] });
    vids.forEach(function (v) { pre.observe(v); io.observe(v); });

    // Reels : on précharge la vidéo quand la vignette approche
    var reels = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.getAttribute('data-reel');
        var post = allPosts.filter(function (p) { return p._id === id; })[0];
        if (post && post.video) videoUrl(src(post.video));
        reels.unobserve(e.target);
      });
    }, { rootMargin: '800px 0px' });
    document.querySelectorAll('[data-reel]').forEach(function (b) { reels.observe(b); });
  }

  /* ------------------------------------------------------ reel plein écran */
  var viewer = document.getElementById('viewer');
  var vFrame = viewer.querySelector('.viewer__frame');
  var vBackdrop = viewer.querySelector('.viewer__backdrop');
  var vUi = viewer.querySelector('.viewer__ui');
  var vBottom = viewer.querySelector('.viewer__bottom');
  var vBar = viewer.querySelector('.viewer__progress span');
  var vSound = viewer.querySelector('[data-sound]');
  var current = null;

  function targetRect() {
    var vw = window.innerWidth, vh = window.innerHeight;
    if (vw < 720) return { left: 0, top: 0, width: vw, height: vh, radius: 0 };
    var h = Math.min(vh * 0.92, 900), w = h * 9 / 16;
    return { left: (vw - w) / 2, top: (vh - h) / 2, width: w, height: h, radius: 14 };
  }
  function place(r) {
    gsap.set(vFrame, { left: r.left, top: r.top, width: r.width, height: r.height, borderRadius: r.radius || 0, x: 0, y: 0, scale: 1 });
  }

  function setSound(video) {
    vSound.innerHTML = video.muted ? ICONS.muted : ICONS.sound;
    vSound.setAttribute('aria-label', video.muted ? 'Activer le son' : 'Couper le son');
  }

  function openReel(post, trigger) {
    if (current) return;
    var mediaBox = trigger.closest('.media');
    var from = mediaBox.getBoundingClientRect();
    var to = targetRect();
    var d = post._date;

    vFrame.innerHTML =
      '<img src="' + esc(src(post.poster)) + '" alt="">' +
      (post.video
        ? '<video playsinline loop preload="auto" poster="' + esc(src(post.poster)) + '"></video>'
        : '<span class="label viewer__soon">Vidéo à venir</span>');
    vBottom.innerHTML =
      '<div class="viewer__day"><span class="label">' + JOURS_LONGS[d.getDay()] + '</span><strong>' + pad(d.getDate()) + ' ' + MOIS[d.getMonth()] + '</strong>' +
      (post.time ? '<span class="label">' + esc(post.time) + '</span>' : '') + '</div>' +
      '<div class="viewer__caption">' + (post.title ? '<p><em>' + esc(post.title) + '</em></p>' : '') +
      list(post.caption).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      (list(post.hashtags).length ? '<div class="hashtags">' + list(post.hashtags).map(esc).join(' ') + '</div>' : '') +
      '</div>';

    // Sans vidéo (pas encore livrée), un objet factice garde le même parcours
    var video = vFrame.querySelector('video') || { muted: true, paused: true, play: function () {}, pause: function () {} };
    setSound(video);
    vSound.hidden = !post.video;
    current = { post: post, box: mediaBox, video: video, trigger: trigger };

    viewer.classList.add('is-open');
    vFrame.classList.toggle('is-desktop', to.radius > 0);
    document.body.classList.add('is-locked');
    place({ left: from.left, top: from.top, width: from.width, height: from.height, radius: 2 });
    gsap.set(vUi, { opacity: 0 });
    gsap.set(vBar, { scaleX: 0 });
    mediaBox.style.visibility = 'hidden';

    if (post.video) {
      // Le son est activé dès l'ouverture : le toucher sur le reel autorise la lecture sonore,
      // à condition de lancer play() tout de suite, pendant ce même toucher.
      var url = src(post.video);
      video.muted = false;
      if (ready[url]) {
        video.src = ready[url];
        video.setAttribute('data-loaded', ready[url]);
      }
      playWithSound(video);
      attachVideo(video, url).then(function (v) {
        if (current && current.video === v && !current.closing && v.paused) playWithSound(v);
      });
    }

    var dur = reduce ? 0.01 : 0.9;
    var tl = gsap.timeline();
    tl.to(vBackdrop, { opacity: 1, duration: dur * 0.8, ease: 'power2.out' }, 0)
      .to(vFrame, { left: to.left, top: to.top, width: to.width, height: to.height, borderRadius: to.radius, duration: dur, ease: 'expo.inOut' }, 0)
      .to(vUi, { opacity: 1, duration: 0.5, ease: 'power2.out' }, dur * 0.7)
      .fromTo(vBottom.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, dur * 0.75);
    current.tl = tl;
    tick();
    viewer.querySelector('[data-close]').focus({ preventScroll: true });
  }

  function tick() {
    if (!current) return;
    var v = current.video;
    if (v.duration) vBar.style.transform = 'scaleX(' + (v.currentTime / v.duration) + ')';
    current.raf = requestAnimationFrame(tick);
  }

  function closeReel() {
    if (!current || current.closing) return;
    var c = current;
    c.closing = true;
    cancelAnimationFrame(c.raf);
    var r = c.box.getBoundingClientRect();
    var dur = reduce ? 0.01 : 0.75;
    gsap.timeline({
      onComplete: function () {
        c.video.pause();
        c.box.style.visibility = '';
        viewer.classList.remove('is-open');
        document.body.classList.remove('is-locked');
        vFrame.innerHTML = '';
        current = null;
        c.trigger.focus({ preventScroll: true });
      },
    })
      .to(vUi, { opacity: 0, duration: 0.25, ease: 'power1.out' }, 0)
      .to(vFrame, { left: r.left, top: r.top, width: r.width, height: r.height, borderRadius: 2, x: 0, y: 0, scale: 1, duration: dur, ease: 'expo.inOut' }, 0.05)
      .to(vBackdrop, { opacity: 0, duration: dur * 0.9, ease: 'power2.inOut' }, 0.1);
  }

  function initViewer() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-reel]');
      if (!t) return;
      var id = t.getAttribute('data-reel');
      var post = allPosts.filter(function (p) { return p._id === id; })[0];
      if (post) openReel(post, t);
    });
    viewer.querySelector('[data-close]').addEventListener('click', closeReel);
    vSound.addEventListener('click', function () {
      if (!current) return;
      current.video.muted = !current.video.muted;
      setSound(current.video);
    });
    viewer.querySelector('.viewer__tap').addEventListener('click', function () {
      if (!current) return;
      var v = current.video;
      if (!v.currentSrc) return;
      if (v.paused) v.play(); else v.pause();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeReel();
    });

    // Glisser vers le bas pour fermer, comme sur Instagram
    var startY = null, dy = 0;
    vFrame.parentNode.addEventListener('touchstart', function (e) {
      if (!current || e.target.closest('.viewer__bottom, button')) return;
      startY = e.touches[0].clientY; dy = 0;
    }, { passive: true });
    vFrame.parentNode.addEventListener('touchmove', function (e) {
      if (startY == null || !current) return;
      dy = Math.max(0, e.touches[0].clientY - startY);
      var k = Math.min(dy / window.innerHeight, 1);
      gsap.set(vFrame, { y: dy * 0.9, scale: 1 - k * 0.25, borderRadius: 24 * k });
      gsap.set(vBackdrop, { opacity: 1 - k * 1.2 });
      gsap.set(vUi, { opacity: 1 - k * 3 });
    }, { passive: true });
    vFrame.parentNode.addEventListener('touchend', function () {
      if (startY == null || !current) return;
      startY = null;
      if (dy > 110) closeReel();
      else gsap.to([vFrame, vBackdrop, vUi], { y: 0, scale: 1, borderRadius: targetRect().radius, opacity: 1, duration: 0.5, ease: 'power3.out' });
    });

    window.addEventListener('resize', function () {
      if (current && !current.closing) place(targetRect());
    });
  }

  /* -------------------------------------------------------- scroll & menus */
  function initScroll() {
    var bar = document.getElementById('bar');
    var hero = document.querySelector('.hero');
    var links = document.querySelectorAll('.weeknav a');

    if (!gsap || !window.ScrollTrigger) return;
    var ST = window.ScrollTrigger;

    ST.create({
      trigger: hero,
      start: 'bottom 70px',
      onEnter: function () { bar.classList.add('is-solid'); },
      onLeaveBack: function () { bar.classList.remove('is-solid'); },
    });

    // Le lockup du header n'apparaît qu'une fois le grand lockup du hero passé
    gsap.set(bar.querySelector('.lockup'), { autoAlpha: 0, y: -8 });
    ST.create({
      trigger: '.hero__lockup',
      start: 'bottom top+=60',
      onEnter: function () { gsap.to(bar.querySelector('.lockup'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }); },
      onLeaveBack: function () { gsap.to(bar.querySelector('.lockup'), { autoAlpha: 0, y: -8, duration: 0.4, ease: 'power2.in' }); },
    });

    var sections = Array.prototype.slice.call(document.querySelectorAll('.feed, .week, .ads, .suivi'));
    sections.forEach(function (s, k) {
      ST.create({
        trigger: s,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: function (self) {
          if (self.isActive) {
            links.forEach(function (a, j) { a.classList.toggle('is-active', j === k); });
            // Le lien actif reste visible dans le menu qui défile en largeur
            var nav = links[k] && links[k].parentNode;
            if (nav && nav.scrollWidth > nav.clientWidth) {
              nav.scrollTo({ left: links[k].offsetLeft - (nav.clientWidth - links[k].offsetWidth) / 2, behavior: 'smooth' });
            }
          }
          else if (k === 0 && self.direction < 0) links.forEach(function (a) { a.classList.remove('is-active'); });
        },
      });
    });

    // Couleurs : 18H22 pour l'ouverture, puis fondu vers le branding du client
    var brand = document.querySelector('.brand');
    if (PLAN.theme && brand) {
      var root = document.documentElement;
      var from = {}, to = {};
      Object.keys(PLAN.theme).forEach(function (k) {
        from['--' + k] = getComputedStyle(root).getPropertyValue('--' + k).trim();
        to['--' + k] = PLAN.theme[k];
      });
      var meta = document.querySelector('meta[name="theme-color"]');
      gsap.fromTo(root, from, Object.assign({}, to, {
        ease: 'none',
        immediateRender: false,
        scrollTrigger: {
          trigger: brand,
          start: 'top 85%',
          end: 'center 55%',
          scrub: reduce ? false : 0.6,
          onToggle: function () {},
          onUpdate: function (self) {
            if (meta) meta.setAttribute('content', self.progress > 0.5 ? PLAN.theme.bg : from['--bg']);
          },
        },
      }));
      if (!reduce) {
        gsap.from('[data-brand]', {
          y: 40, autoAlpha: 0, scale: 0.96, duration: 1.4, stagger: 0.15, ease: 'expo.out',
          scrollTrigger: { trigger: brand, start: 'top 45%', once: true },
        });
      }
    }

    if (reduce) return;

    // Numéros de semaine en parallaxe
    gsap.utils.toArray('.week__num').forEach(function (n) {
      gsap.fromTo(n, { yPercent: -30 }, {
        yPercent: 30, ease: 'none',
        scrollTrigger: { trigger: n.parentNode, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // Apparitions douces
    gsap.utils.toArray('[data-reveal]').forEach(function (n) {
      gsap.from(n, {
        y: 28, autoAlpha: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: n, start: 'top 90%', once: true },
      });
    });

    // Visuels : rideau + léger dézoom
    gsap.utils.toArray('[data-reveal-media]').forEach(function (m) {
      var inner = m.querySelector('.media__inner');
      var tl = gsap.timeline({ scrollTrigger: { trigger: m, start: 'top 88%', once: true } });
      tl.fromTo(m, { clipPath: 'inset(18% 8% 0% 8%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out' })
        .fromTo(inner, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0);
    });


    // Chiffres clés
    gsap.utils.toArray('[data-count]').forEach(function (n) {
      var o = { v: 0 }, end = +n.getAttribute('data-count');
      gsap.to(o, {
        v: end, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: n, start: 'top 90%', once: true },
        onUpdate: function () { n.textContent = Math.round(o.v); },
      });
    });

    // Grille du feed en cascade
    ST.batch('[data-grid]', {
      start: 'top 92%',
      once: true,
      onEnter: function (els) {
        gsap.fromTo(els, { autoAlpha: 0, y: 30, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.05, ease: 'power3.out' });
      },
    });
    gsap.set('[data-grid]', { autoAlpha: 0 });

    // Trait vertical du hero qui se rétracte au scroll
    gsap.to('.hero__rule', {
      scaleY: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  /* ------------------------------------------------------------ preloader */
  function preload() {
    var loader = document.getElementById('loader');
    var paths = loader.querySelectorAll('.loader__mark path');
    var mm = loader.querySelector('.mm');
    var barFill = loader.querySelector('.loader__bar span');
    var curtain = loader.querySelector('.loader__curtain');
    var inner = loader.querySelector('.loader__inner');

    function done() {
      loader.remove();
      document.body.classList.remove('is-loading');
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }

    var heroChars = document.querySelectorAll('.hero__title .char');
    var heroBits = document.querySelectorAll('[data-hero]');
    var rule = document.querySelector('.hero__rule');

    if (!gsap || reduce || QUICK) {
      done();
      var to = QUICK && QUICK.to && document.getElementById(QUICK.to);
      if (to) setTimeout(function () { window.scrollTo(0, to.getBoundingClientRect().top + window.pageYOffset - 90); }, 60);
      return;
    }

    paths.forEach(function (p) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len + ' ' + len;
      p.style.strokeDashoffset = len;
    });
    gsap.set(heroChars, { yPercent: 110 });
    gsap.set(heroBits, { autoAlpha: 0, y: 16 });
    gsap.set(rule, { scaleY: 0 });

    // Attendre polices + premières images, sans jamais bloquer plus de 4 s
    var ready = Promise.race([
      Promise.all([
        document.fonts ? document.fonts.ready : Promise.resolve(),
        new Promise(function (res) { if (document.readyState === 'complete') res(); else window.addEventListener('load', res); }),
      ]),
      new Promise(function (res) { setTimeout(res, 4000); }),
    ]);

    var clock = { m: 0 };
    var intro = gsap.timeline({ paused: true });
    intro
      .to(paths[0], { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' }, 0.15)
      .to(paths[1], { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 0.75)
      .to(clock, {
        m: 22, duration: 2.1, ease: 'power1.inOut', snap: { m: 1 },
        onUpdate: function () { mm.textContent = pad(Math.round(clock.m)); },
      }, 0.15)
      .to(barFill, { scaleX: 1, duration: 2.1, ease: 'power1.inOut' }, 0.15);
    intro.play();

    Promise.all([ready, new Promise(function (res) { intro.eventCallback('onComplete', res); })]).then(function () {
      gsap.timeline({ onComplete: done })
        .to(inner, { scale: 0.92, autoAlpha: 0, duration: 0.7, ease: 'power3.in' }, 0.2)
        .set(curtain, { transformOrigin: 'bottom' }, 0)
        .to(curtain, { scaleY: 1, duration: 0.8, ease: 'expo.inOut' }, 0.45)
        .set(loader, { backgroundColor: 'transparent' })
        .set(curtain, { transformOrigin: 'top' })
        .to(curtain, { scaleY: 0, duration: 0.9, ease: 'expo.inOut' })
        .to(heroBits[0], { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.45')
        .to(heroChars, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.035 }, '-=0.75')
        .to(Array.prototype.slice.call(heroBits, 1), { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out' }, '-=0.9')
        .to(rule, { scaleY: 1, duration: 1.2, ease: 'expo.inOut' }, '-=0.8');
    });
  }

  /* ----------------------------------------------------------------- init */
  if (!PLAN) {
    document.getElementById('app').innerHTML = '<p style="padding:40px;text-align:center">Plan introuvable pour ce client.</p>';
    document.getElementById('loader').remove();
    document.body.classList.remove('is-loading');
    return;
  }
  function boot() {
  render();
  inlineSvgs();
  initAnchors();
  initCarousels();
  initOptions();
  initPostSheet();
  initFeedback();
  initAds();
  initSuivi();
  initInlineVideos();
  initViewer();
  initScroll();
  preload();
  }
  // Le planning tient compte des ajouts, retraits et dates de l'équipe : données lues avant le rendu (3 s au plus)
  if (PLAN.suivi) {
    FIRST = getSuivi();
    Promise.race([FIRST, new Promise(function (res) { setTimeout(res, 5000); })]).then(function (r) {
      if (r && r.d) { applyStructure(r.d.edits); STRUCT_OK = true; }
      boot();
    });
  } else boot();
})();
