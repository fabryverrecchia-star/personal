(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var slides = $$('.slide');
  var printing = false;

  // Empilement des slides au défilement (grand écran seulement)
  var wide = matchMedia('(min-width: 900px) and (min-aspect-ratio: 1/1)');
  function setMode() { root.classList.toggle('stack', wide.matches && !reduced); }
  setMode();
  if (wide.addEventListener) wide.addEventListener('change', setMode);

  // Échelle des écrans interactifs (fenêtre de 1100 px de large)
  function fit() {
    $$('[data-fit]').forEach(function (vp) {
      var w = vp.parentElement.clientWidth;
      if (w) vp.style.setProperty('--fit', (w / 1100).toFixed(4));
    });
    $$('[data-live-w]').forEach(function (vp) {
      var w = vp.parentElement.clientWidth;
      if (w) vp.style.setProperty('--fit', (w / +vp.dataset.liveW).toFixed(4));
    });
  }
  window.__fit = fit;
  fit();
  addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(document.body);

  // Progression, compteur, recul de la slide recouverte
  var bar = $('.chrome-bar'), cur = $('[data-cur]'), tot = $('[data-tot]');
  if (tot) tot.textContent = String(slides.length).padStart(2, '0');
  var ticking = false;
  // Position d'une slide dans le flux (une slide collante renvoie sa position collée, pas celle du flux)
  function pos(i) {
    if (!root.classList.contains('stack')) return slides[i].offsetTop;
    return slides[0].parentElement.offsetTop + i * slides[0].offsetHeight;
  }
  function frame() {
    ticking = false;
    var h = root.scrollHeight - innerHeight;
    if (bar) bar.style.setProperty('--p', h > 0 ? (scrollY / h).toFixed(4) : 0);
    var vh = innerHeight, idx = 0;
    var stacked = root.classList.contains('stack');
    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      var next = slides[i + 1];
      var top = next ? pos(i + 1) - scrollY : Infinity;
      if (top <= vh * 0.5) idx = i + 1;
      if (!stacked || !next) { s.firstElementChild.style.removeProperty('--k'); s.style.visibility = ''; continue; }
      var k = Math.min(1, Math.max(0, 1 - top / vh));
      s.firstElementChild.style.setProperty('--k', k.toFixed(3));
      var after = slides[i + 2];
      s.style.visibility = after && pos(i + 2) - scrollY <= 0 ? 'hidden' : '';
    }
    if (cur) cur.textContent = String(Math.min(idx, slides.length - 1) + 1).padStart(2, '0');
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame);
  frame();

  // Liens du sommaire : aller à la position de la slide dans le flux
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (!t || !t.classList.contains('slide')) return;
      e.preventDefault();
      scrollTo({ top: pos(slides.indexOf(t)), behavior: reduced ? 'auto' : 'smooth' });
      history.replaceState(null, '', '#' + t.id);
    });
  });

  // Apparitions : une slide s'anime quand elle entre
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('seen'); e.target.dataset.vis = '1'; }
      else e.target.dataset.vis = '';
    });
  }, { threshold: 0.35 });
  slides.forEach(function (s) { if (reduced) s.classList.add('seen'); io.observe(s); });

  // Écrans qui défilent seuls, synchronisés avec les notes de la slide
  $$('[data-cycle-group]').forEach(function (g) {
    var slide = g.closest('.slide');
    var screens = $$('[data-cycle]', g);
    var notes = $$('[data-sync="' + g.getAttribute('data-cycle-group') + '"] li', slide);
    var n = Math.max.apply(null, screens.map(function (sc) { return sc.children.length; }));
    var i = 0;
    function show(k) {
      screens.forEach(function (sc) { $$('img', sc).forEach(function (im, j) { im.classList.toggle('is-on', j === k % sc.children.length); }); });
      notes.forEach(function (li, j) { li.classList.toggle('is-on', j === k % notes.length); });
    }
    show(0);
    notes.forEach(function (li, j) { li.addEventListener('mouseenter', function () { i = j; show(i); }); });
    if (reduced) return;
    setInterval(function () { if (printing || !slide.dataset.vis || document.hidden) return; i = (i + 1) % n; show(i); }, 3200);
  });
  $$('[data-cycle]').forEach(function (sc) {
    if (sc.closest('[data-cycle-group]')) return;
    var imgs = $$('img', sc); if (imgs.length < 2) return;
    var slide = sc.closest('.slide'), i = 0;
    imgs[0].classList.add('is-on');
    if (reduced) return;
    setInterval(function () { if (printing || !slide.dataset.vis || document.hidden) return; i = (i + 1) % imgs.length; imgs.forEach(function (im, j) { im.classList.toggle('is-on', j === i); }); }, 3000);
  });

  // Site en direct : les deux écrans se chargent quand la diapositive approche
  var liveIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      $$('iframe[data-src]', e.target).forEach(function (f) { f.src = f.getAttribute('data-src'); f.removeAttribute('data-src'); f.addEventListener('load', function () { f.parentElement.classList.add('is-live'); }); });
      liveIO.unobserve(e.target);
    });
  }, { rootMargin: '100% 0px' });
  $$('#live').forEach(function (s) { liveIO.observe(s); });

  // Pour l'impression : premier visuel de chaque écran
  window.__print = function () {
    printing = true;
    $$('[data-cycle]').forEach(function (sc) { $$('img', sc).forEach(function (im, j) { im.classList.toggle('is-on', j === 0); }); });
    $$('[data-sync] li').forEach(function (li, j, all) { li.classList.toggle('is-on', li === li.parentElement.firstElementChild); });
    slides.forEach(function (s) { s.classList.add('seen'); });
    fit();
  };

  // Démo store locator
  var data = JSON.parse($('#loc-data').textContent);
  var sel = $('[data-loc-city]'), list = $('[data-loc-list]'), dots = $('[data-loc-dots]'), me = $('[data-loc-me]'), links = $('[data-loc-links]');
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
  function km(a, b) {
    var R = 6371, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  $('[data-loc-n]').textContent = data.restaurants.length;
  data.cities.forEach(function (c, i) {
    var o = document.createElement('option'); o.value = i; o.textContent = c.name;
    if (c.name === 'Lille') o.selected = true;
    sel.appendChild(o);
  });
  var dotEls = data.restaurants.map(function (r, i) {
    var c = el('circle', { cx: r.xy[0], cy: r.xy[1], r: 6, class: 'r' });
    var t = el('title', {}); t.textContent = r.name; c.appendChild(t);
    c.addEventListener('click', function () { focus(i); });
    dots.appendChild(c);
    return c;
  });
  function focus(i) {
    dotEls.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
    $$('.loc-item', list).forEach(function (b) { b.classList.toggle('is-on', +b.getAttribute('data-i') === i); });
  }
  function render() {
    var c = data.cities[+sel.value];
    var sorted = data.restaurants.map(function (r, i) { return { r: r, i: i, d: km(c, r) }; }).sort(function (a, b) { return a.d - b.d; });
    list.innerHTML = '';
    sorted.slice(0, 5).forEach(function (o, k) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'loc-item'; b.setAttribute('data-i', o.i);
      b.innerHTML = '<strong></strong><span class="km"></span><small></small><span class="loc-actions"><span>Réserver</span><span>Click &amp; Collect</span><span>Itinéraire</span><span>Appeler</span></span>';
      b.querySelector('strong').textContent = o.r.name;
      b.querySelector('.km').textContent = Math.round(o.d) + ' km';
      b.querySelector('small').textContent = o.r.street + ', ' + o.r.cp + ' ' + o.r.city + (o.r.hours[0] ? ' · ' + o.r.hours[0] : '');
      b.addEventListener('mouseenter', function () { focus(o.i); });
      b.addEventListener('focus', function () { focus(o.i); });
      li.appendChild(b); list.appendChild(li);
      if (k === 0) focus(o.i);
    });
    me.innerHTML = ''; links.innerHTML = '';
    sorted.slice(0, 3).forEach(function (o) { links.appendChild(el('line', { x1: c.xy[0], y1: c.xy[1], x2: o.r.xy[0], y2: o.r.xy[1], class: 'link' })); });
    if (!reduced) me.appendChild(el('circle', { cx: c.xy[0], cy: c.xy[1], r: 7, class: 'ring' }));
    me.appendChild(el('circle', { cx: c.xy[0], cy: c.xy[1], r: 7, class: 'me' }));
    var t = el('text', { x: c.xy[0] + 12, y: c.xy[1] - 10 }); t.textContent = c.name; me.appendChild(t);
  }
  sel.addEventListener('change', render);
  // « Me localiser » : la ville de la liste la plus proche de la position du visiteur, s'il l'accepte
  $('[data-loc-geo]').addEventListener('click', function () {
    var btn = this;
    if (!navigator.geolocation) { btn.textContent = 'Indisponible'; return; }
    btn.textContent = '…';
    navigator.geolocation.getCurrentPosition(function (pos) {
      var p = { lat: pos.coords.latitude, lng: pos.coords.longitude }, best = 0, bd = Infinity;
      data.cities.forEach(function (c, i) { var d = km(p, c); if (d < bd) { bd = d; best = i; } });
      sel.value = best; render(); btn.textContent = 'Me localiser';
    }, function () { btn.textContent = 'Choisissez une ville'; }, { timeout: 6000 });
  });
  render();

  // Démo back-office
  var form = $('[data-cms-form]');
  var mois = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  function cms(e) {
    var f = form.elements;
    $('[data-pv-plat]').textContent = f.plat.value || '—';
    $('[data-pv-ev]').textContent = f.ev.value || '—';
    $('[data-pv-actu]').textContent = f.actu.value || '—';
    var d = f.date.value ? new Date(f.date.value + 'T12:00:00') : null;
    $('[data-pv-date]').innerHTML = d ? d.getDate() + '<br>' + mois[d.getMonth()] : '—';
    $('[data-pv-recrute]').classList.toggle('pv-hidden', !f.recrute.checked);
    if (e && e.target && e.target.name) {
      var key = e.target.name === 'date' ? 'ev' : e.target.name;
      var blk = $('[data-pv="' + key + '"]');
      if (blk) { blk.classList.add('flash'); setTimeout(function () { blk.classList.remove('flash'); }, 600); }
    }
  }
  form.addEventListener('input', cms);
  form.addEventListener('change', cms);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = { valid: 'Envoyé au siège pour validation.', live: 'Publié : la page de Lille est à jour.', plan: 'Programmé pour jeudi 18 h.' };
    $('[data-cms-status]').textContent = msg[form.elements.wf.value] + ' (démonstration)';
  });
  cms();

  // Démo nouveau restaurant
  var gform = $('[data-gen-form]');
  var gsteps = $$('[data-gen-steps] li');
  var timer = null;
  function slug(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function gen(animate) {
    var f = gform.elements;
    var city = f.ville.value.trim() || 'Votre ville';
    $('[data-gen-city]').textContent = city;
    $('[data-gen-addr]').textContent = f.adresse.value + ' · ' + (f.type.value === 'Franchise' ? 'Restaurant franchisé' : 'Restaurant Il Ristorante');
    var d = f.date.value ? new Date(f.date.value + 'T11:30:00') : null;
    $('[data-gen-kicker]').textContent = d ? 'Ouverture le ' + d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Ouverture prochaine';
    var diff = d ? Math.max(0, d - new Date()) : 0;
    var j = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60;
    $('[data-gen-count]').innerHTML = '<div><b>' + j + '</b><span>jours</span></div><div><b>' + h + '</b><span>heures</span></div><div><b>' + m + '</b><span>minutes</span></div>';
    $('[data-gen-url]').innerHTML = 'ilristorante.fr/<b>il-ristorante-le-restaurant-italien-de-' + slug(city) + '</b>';
    if (timer) clearInterval(timer);
    if (!animate || reduced) { gsteps.forEach(function (s) { s.classList.add('done'); }); return; }
    gsteps.forEach(function (s) { s.classList.remove('done'); });
    var k = 0;
    timer = setInterval(function () { if (k < gsteps.length) gsteps[k++].classList.add('done'); else clearInterval(timer); }, 420);
  }
  gform.addEventListener('submit', function (e) { e.preventDefault(); gen(true); });
  gform.addEventListener('input', function () { gen(false); });
  gen(false);
})();
