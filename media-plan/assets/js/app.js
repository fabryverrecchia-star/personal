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
      p.setAttribute('stroke-width', '13');
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
    var widest = info.reduce(function (a, c) { return c.b.width > a.b.width ? c : a; });
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

  /* --------------------------------------------------------------- render */
  var allPosts = [];

  function renderPost(post, w, i) {
    var d = parseDate(post.date);
    var type = post.type || 'post';
    var id = 'p-' + post.date + '-' + i;
    post._id = id;
    post._date = d;
    post._week = w;
    allPosts.push(post);

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

    var caption = list(post.caption).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    var tags = list(post.hashtags).length ? '<div class="hashtags">' + list(post.hashtags).map(esc).join(' ') + '</div>' : '';
    var note = post.note ? '<div class="note">' + esc(post.note) + '</div>' : '';

    return (
      '<article class="post" id="' + id + '" data-type="' + type + '">' +
      '<div class="day" data-reveal>' +
      '<span class="label day__name">' + JOURS[d.getDay()] + '</span>' +
      '<span class="day__num">' + pad(d.getDate()) + '</span>' +
      '<span class="label day__month">' + MOIS[d.getMonth()] + '</span>' +
      (post.time ? '<span class="day__time">' + esc(post.time) + '</span>' : '') +
      '</div>' +
      '<div class="post__body">' +
      '<div class="post__meta" data-reveal><span class="label tag tag--' + type + '">' + ICONS[type] + TYPE_LABEL[type] + '</span>' +
      '<span class="label post__index">' + JOURS_LONGS[d.getDay()] + '</span></div>' +
      media +
      '<div class="caption" data-reveal>' +
      (post.title ? '<strong class="caption__title">' + esc(post.title) + '</strong>' : '') +
      caption + tags + note +
      '</div>' + feedbackHtml(post) + '</div></article>'
    );
  }

  // Retours du client : statut + commentaire par post, envoyés en un message récapitulatif
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
    function firstDate(w) { var p = list(w.posts)[0]; return p ? parseDate(p.date) : new Date(); }
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
      (PLAN.suivi ? '<a class="label" href="#passages">Passages</a><a class="label" href="#missions">Missions</a>' : '') +
      '</nav>';

    // Le feed passe en premier (vue d'ensemble), le détail des posts suit
    var weeksHtml = '';

    weeks.forEach(function (w, k) {
      var posts = list(w.posts);
      var first = posts[0] && parseDate(posts[0].date);
      var last = posts.length && parseDate(posts[posts.length - 1].date);
      var range = first
        ? pad(first.getDate()) + (first.getMonth() !== last.getMonth() ? ' ' + MOIS[first.getMonth()] : '') +
          ' — ' + pad(last.getDate()) + ' ' + MOIS[last.getMonth()]
        : '';
      weeksHtml +=
        '<section class="week" id="s' + (k + 1) + '">' +
        '<header class="week__head">' +
        '<span class="week__num" aria-hidden="true">' + pad(monthly ? first.getMonth() + 1 : k + 1) + '</span>' +
        '<p class="label week__kicker" data-reveal>' + (monthly
          ? MOIS_LONGS[first.getMonth()] + ' ' + first.getFullYear() + ' · ' + posts.length + ' publications'
          : 'Semaine ' + pad(k + 1) + ' · ' + range) + '</p>' +
        '<h2 class="week__title" data-reveal>' + (w.title || (monthly ? MOIS_LONGS[first.getMonth()] : 'Semaine ' + (k + 1))) + '</h2>' +
        (w.theme ? '<p class="week__theme" data-reveal>' + esc(w.theme) + '</p>' : '') +
        '</header>' +
        posts.map(function (p, i) { return renderPost(p, k, i); }).join('') +
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
        var img = p.type === 'reel' ? p.poster : list(p.options)[0] || list(p.media)[0];
        if (img && typeof img === 'object') img = img.poster;
        var n = list(p.options).length;
        var icon = n > 1 ? '<span class="label grid__options">' + LETTRES.slice(0, n).split('').join(' / ') + '</span>'
          : p.type === 'post' ? '' : '<span class="grid__icon">' + ICONS[p.type] + '</span>';
        return '<a href="#' + p._id + '" data-grid' + (n > 1 ? ' data-grid-options="' + p._id + '"' : '') + '><img src="' + esc(src(img)) + '" alt="" loading="lazy" decoding="async">' + icon +
          '<span class="label grid__day">' + JOURS[p._date.getDay()] + ' ' + pad(p._date.getDate()) + '</span></a>';
      }).join('') +
      live.map(function (img) {
        return '<a class="is-live" data-grid><img src="' + esc(src(img)) + '" alt="" loading="lazy" decoding="async"><span class="label grid__live">En ligne</span></a>';
      }).join('') +
      '</div>' +
      (live.length ? '<p class="label" style="margin-top:14px;opacity:.7">Voilés : publications déjà en ligne</p>' : '') +
      '</section>' +
      weeksHtml;

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
    }
    function count() {
      var n = allPosts.filter(function (p) { var d = data[p._id]; return d && (d.status || d.note); }).length;
      var el = document.querySelector('[data-fb-count]');
      if (el) el.textContent = n + ' / ' + allPosts.length + ' publications commentées';
    }
    function grow(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
    document.querySelectorAll('[data-fb]').forEach(function (box) {
      var d = data[box.getAttribute('data-fb')] || {};
      var t = box.querySelector('textarea');
      if (d.note) { t.value = d.note; grow(t); }
      paint(box);
    });
    count();
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
  var CAT = { photo: 'Photos', video: 'Vidéo', montage: 'Montage', planning: 'Media planning', redaction: 'Rédaction', autre: 'Autre' };
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
    return (
      '<section class="suivi" id="passages">' +
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
      '</section>' +

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
      '<button type="button" class="team-fab__item" role="menuitem" data-goto="passages">' + SICONS.planning + '<span><b>Rendez-vous</b><small class="label">Calendrier des passages</small></span></button>' +
      '<button type="button" class="team-fab__item" role="menuitem" data-goto="missions">' + SICONS.redaction + '<span><b>Tâche</b><small class="label">Missions en cours</small></span></button>' +
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
      '</div></div>'
    );
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

    function json(r) {
      if (!r.ok) return Promise.reject(r.status);
      return r.text().then(function (t) { return JSON.parse(t); });
    }
    function valid(d) {
      if (!d || !Array.isArray(d.passages) || !Array.isArray(d.missions)) return false;
      if (!Array.isArray(d.inspirations)) d.inspirations = [];
      return true;
    }
    function load() {
      var fromApi = API ? fetch(API + '?t=' + Date.now(), { cache: 'no-store' }).then(json) : Promise.reject();
      return fromApi.then(function (d) {
        if (!valid(d)) throw 0;
        mode = 'api';
        return d;
      }).catch(function () {
        // Sans PHP (aperçu statique) : fichier de départ, puis modifications gardées sur l'appareil
        mode = 'local';
        var saved = null;
        try { saved = JSON.parse(localStorage.getItem(LOCAL)); } catch (e) {}
        // Un appareil qui a déjà des modifications garde les siennes, en récupérant les inspirations ajoutées depuis
        if (saved && Array.isArray(saved.passages) && cfg.seed) {
          var mine = Array.isArray(saved.inspirations) ? saved.inspirations : [];
          var ids = mine.map(function (x) { return x.id; });
          saved.inspirations = (cfg.seed.inspirations || []).filter(function (x) { return ids.indexOf(x.id) < 0; }).concat(mine);
        }
        if (valid(saved)) return saved;
        if (valid(cfg.seed)) return JSON.parse(JSON.stringify(cfg.seed));
        return fetch(src(cfg.data)).then(json).catch(function () { return { passages: [], missions: [] }; });
      }).then(function (d) {
        state = valid(d) ? d : { passages: [], missions: [] };
        paint();
      });
    }

    function localOp(op) {
      var d = JSON.parse(JSON.stringify(state));
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
        return 'Erreur serveur (' + r.status + '). Réessayez.';
      });
    }
    function send(op) {
      var p = mode === 'local' ? localOp(op) : post(op, code).then(function (r) {
        if (r.status === 403) { setAdmin(false, true); return Promise.reject('code'); }
        if (!r.ok) return why(r).then(function (m) { return Promise.reject(m); });
        return json(r);
      });
      return p.then(function (d) { if (valid(d)) { state = d; paint(); } })
        .catch(function (e) { if (e !== 'code') toast(typeof e === 'string' ? e : 'La modification n’a pas pu être enregistrée. Réessayez.'); });
    }

    /* Calendrier du mois */
    function paintCalendar() {
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
          '<span class="task__by"><i class="avatar avatar--' + esc(String(m.by).toLowerCase()) + '">' + esc(String(m.by).charAt(0)) + '</i>Publié par ' + esc(m.by) + (m.at ? ' · ' + shortDate(m.at) : '') + '</span></span>' +
          '<button type="button" class="label task__status" data-status="' + esc(m.id) + '" data-now="' + esc(m.status) + '" tabindex="' + (admin ? '0' : '-1') + '">' + (STATUS[m.status] || '') + '</button>' +
          '<span class="row-actions"><button type="button" class="del" data-edit="missions" data-id="' + esc(m.id) + '" aria-label="Modifier cette mission">' + SICONS.edit + '</button>' +
          '<button type="button" class="del" data-del="missions" data-id="' + esc(m.id) + '" aria-label="Supprimer cette mission">' + SICONS.close + '</button></span>' +
          '</li>';
      }).join('') : '<li class="tasks__empty">Aucune mission pour le moment.</li>';
    }

    var shown = false;
    function paint() {
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
      else if (document.querySelector('[data-inspi].is-open')) document.querySelector('[data-inspi-close]').click();
    });

    var toastEl = document.querySelector('[data-toast]'), toastT;
    function toast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add('is-on');
      clearTimeout(toastT);
      toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3200);
    }

    /* Mode équipe (Fabrizio, Jade) : ajouter, faire avancer, supprimer */
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
      if (mode === 'local') { setAdmin(true); then(); return; }
      sheet({
        kicker: 'Espace équipe',
        title: 'Code équipe',
        input: true,
        ok: 'Entrer',
        submit: function (c) {
          if (!c) return 'Saisissez le code.';
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
      else if (refreshed || !(state.inspirations || []).some(function (x) { return !x.thumb && !x.tried; })) return Promise.resolve();
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
      inspiTrack.innerHTML = items.length ? items.map(function (it) {
        var ig = instaParts(it.url);
        if (!ig) return '';
        var f = it.format || (ig.seg === 'reel' ? 'reel' : 'carousel');
        return '<article class="inspi__card inspi__card--' + esc(f) + '">' +
          '<div class="inspi__meta"><span class="label inspi__tag">' + (SICONS[f === 'reel' ? 'video' : 'photo']) + esc(FORMAT[f] || '') + '</span>' +
          '<button type="button" class="del" data-del="inspirations" data-id="' + esc(it.id) + '" aria-label="Supprimer cette inspiration">' + SICONS.close + '</button></div>' +
          (it.thumb
            // Contenu récupéré : l'image du post, le lecteur Instagram se charge au toucher
            ? '<button type="button" class="inspi__frame inspi__poster" data-inspi-play="' + ig.seg + '/' + esc(ig.code) + '" aria-label="Lire sur la page">' +
              '<img src="' + esc(src(it.thumb)) + '" alt="" loading="lazy"><span class="inspi__play">' + ICONS.play + '</span></button>'
            : '<div class="inspi__frame">' + embed(ig.seg + '/' + ig.code) + '</div>') +
          (it.author ? '<p class="label inspi__author">@' + esc(it.author) + '</p>' : '') +
          (it.caption ? '<p class="inspi__caption">' + esc(it.caption) + '</p>' : '') +
          (!it.thumb && admin && mode === 'api' ? '<button type="button" class="label inspi__retry" data-inspi-retry="' + esc(it.id) + '">Récupérer le contenu Instagram</button>' : '') +
          (it.note ? '<p class="inspi__note">' + esc(it.note) + '</p>' : '') +
          '<a class="label inspi__link" href="' + esc(it.url) + '" target="_blank" rel="noopener">Ouvrir sur Instagram</a>' +
          '</article>';
      }).join('') : '<p class="inspi__empty">Les inspirations du mois arrivent bientôt.</p>';
      inspiEl.querySelector('[data-inspi-dots]').innerHTML = items.length > 1 ? items.map(function (_, k) { return '<i class="' + (k ? '' : 'is-on') + '"></i>'; }).join('') : '';
    }
    inspiTrack.addEventListener('scroll', function () {
      var cards = inspiTrack.querySelectorAll('.inspi__card');
      if (!cards.length) return;
      var k = Math.round(inspiTrack.scrollLeft / (cards[0].offsetWidth + 14));
      inspiEl.querySelectorAll('[data-inspi-dots] i').forEach(function (d, j) { d.classList.toggle('is-on', j === k); });
    }, { passive: true });
    function inspi(open) {
      if (open) refreshInspi();
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
      } else if ((t = e.target.closest('[data-who]'))) {
        who = t.getAttribute('data-who');
        try { localStorage.setItem(WHO, who); } catch (e2) {}
        paintWho();
      } else if (admin && (t = e.target.closest('[data-status]'))) {
        send({ action: 'update', kind: 'missions', id: t.getAttribute('data-status'), status: NEXT_STATUS[t.getAttribute('data-now')] || 'todo' });
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
        askCode(function () { if (kind === 'inspi') inspi(true); else openSection(kind); });
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
      if (code && mode === 'api') setAdmin(true);
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
    document.querySelectorAll('.carousel').forEach(function (car) {
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
    });
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

    var sections = Array.prototype.slice.call(document.querySelectorAll('.week, .feed, .suivi'));
    sections.forEach(function (s, k) {
      ST.create({
        trigger: s,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: function (self) {
          if (self.isActive) links.forEach(function (a, j) { a.classList.toggle('is-active', j === k); });
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

    if (!gsap || reduce) { done(); return; }

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
  render();
  inlineSvgs();
  initAnchors();
  initCarousels();
  initOptions();
  initFeedback();
  initSuivi();
  initInlineVideos();
  initViewer();
  initScroll();
  preload();
})();
