import pathlib
here = pathlib.Path(__file__).resolve().parent
c = here / 'compose.py'; s = c.read_text()
if "N['page-404']" not in s:
    s = s.replace("N['ui-menu'], N['ui-header'],", "N['ui-menu'], N['ui-header'], N['page-404'],")
c.write_text(s)
b = here / 'build.py'; t = b.read_text()
if "'x_404'" not in t:
    t = t.replace("'k_espresso': (root / 'brand/espresso.jpg', 1300)", "'k_espresso': (root / 'brand/espresso.jpg', 1300), 'x_404': (root / 'brand/404-actuelle.jpg', 1400)")
    t = t.replace("V = site / 'public/videos'", "images.update({f'r_{k:02d}': (root / f'brand/rush/{k:02d}.jpg', 520) for k in range(12)})\nV = site / 'public/videos'")
b.write_text(t)
j = here / 'deck.js'; u = j.read_text()
if 'data-flip' not in u:
    u = u.replace("  // Pour l'impression : premier visuel de chaque écran", """  // Rafales d'images en boucle (rush photo)
  $$('[data-flip]').forEach(function (el) {
    var imgs = $$('img', el), i = 0, ms = +el.getAttribute('data-flip') || 150;
    if (reduced || imgs.length < 2) return;
    setInterval(function () { if (printing || document.hidden) return; imgs[i].classList.remove('is-on'); i = (i + 1) % imgs.length; imgs[i].classList.add('is-on'); }, ms);
  });

  // Pour l'impression : premier visuel de chaque écran""")
j.write_text(u)
css = here / 'deck.css'; v = css.read_text()
add = (here / 'add2.css').read_text()
if '.rush {' not in v:
    css.write_text(v + add)
print("N['page-404']" in s, "'x_404'" in t, 'data-flip' in u)
