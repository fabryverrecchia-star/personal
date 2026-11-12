// Repère flottant : chapitre en cours, page en cours, sommaire en panneau.
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  if (!slides.length) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var chapters = [];
  slides.forEach(function (s, i) {
    var m = (s.getAttribute('aria-label') || '').match(/^Chapitre (\d+)\s*:\s*(.+)$/);
    if (m) chapters.push({ n: m[1], name: m[2].replace(/\s+/g, ' ').trim(), i: i });
  });
  var root = document.documentElement;
  function stacked() { return root.classList.contains('stack'); }
  function top(i) { return stacked() ? slides[0].parentElement.offsetTop + i * slides[0].offsetHeight : slides[i].offsetTop; }
  function go(i) { scrollTo({ top: top(i), behavior: reduced ? 'auto' : 'smooth' }); }

  var nav = document.createElement('nav');
  nav.className = 'pnav';
  nav.setAttribute('aria-label', 'Repère dans la présentation');
  nav.innerHTML =
    '<button type="button" class="pnav-btn" aria-expanded="false" aria-controls="pnav-panel">' +
      '<span class="pnav-n" data-pn>00</span><span class="pnav-t"><b data-pt>Introduction</b><small data-pp>Page 1 / ' + slides.length + '</small></span>' +
      '<span class="pnav-i" aria-hidden="true"><i></i><i></i><i></i></span>' +
    '</button>' +
    '<i class="pnav-bar" aria-hidden="true"><i data-pb></i></i>' +
    '<div class="pnav-panel" id="pnav-panel" hidden><p class="pnav-h">Sommaire</p><ol>' +
      chapters.map(function (c) { return '<li><button type="button" data-go="' + c.i + '"><span>' + c.n + '</span>' + c.name + '<em>p. ' + (c.i + 1) + '</em></button></li>'; }).join('') +
    '</ol><p class="pnav-keys">Flèches ← → du clavier : page précédente ou suivante</p></div>';
  document.body.appendChild(nav);
  var btn = nav.querySelector('.pnav-btn'), panel = nav.querySelector('.pnav-panel');
  var pn = nav.querySelector('[data-pn]'), pt = nav.querySelector('[data-pt]'), pp = nav.querySelector('[data-pp]'), pb = nav.querySelector('[data-pb]');
  var items = Array.prototype.slice.call(nav.querySelectorAll('[data-go]'));
  function open(v) { panel.hidden = !v; btn.setAttribute('aria-expanded', String(v)); nav.classList.toggle('is-open', v); }
  btn.addEventListener('click', function () { open(panel.hidden); });
  items.forEach(function (b) { b.addEventListener('click', function () { open(false); go(+b.getAttribute('data-go')); }); });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) open(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') open(false);
    if (/input|select|textarea/i.test((e.target.tagName || ''))) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(Math.min(slides.length - 1, cur + 1)); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(Math.max(0, cur - 1)); }
  });

  var cur = 0;
  function update() {
    var y = scrollY + innerHeight * 0.45, k = 0;
    for (var i = 0; i < slides.length; i++) if (top(i) <= y) k = i;
    cur = k;
    var c = null;
    chapters.forEach(function (ch) { if (ch.i <= k) c = ch; });
    pn.textContent = c ? c.n : '00';
    pt.textContent = c ? c.name : 'Introduction';
    pp.textContent = 'Page ' + (k + 1) + ' / ' + slides.length;
    pb.style.transform = 'scaleX(' + ((k + 1) / slides.length).toFixed(3) + ')';
    items.forEach(function (b) { b.classList.toggle('is-on', c && +b.getAttribute('data-go') === c.i); });
    var dark = slides[k].classList.contains('s-navy');
    nav.classList.toggle('on-dark', dark);
  }
  var tick = false;
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; update(); }); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();
