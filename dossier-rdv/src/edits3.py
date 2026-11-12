"""Troisième série : détails animés (preloader, transition, menu, 404), retraits.
Usage : python3 src/edits3.py && python3 src/compose.py"""
import pathlib, re
here = pathlib.Path(__file__).resolve().parent
base = here / 'deck.before-compose.html'
new = here / 'new-slides.html'
b, n = base.read_text(), new.read_text()

# Rush : sans étiquette
b = b.replace('<span class="rush-tag">Rush · Dijon</span>', '')

# La page 404 n'a plus sa diapositive : elle rejoint les détails
n = re.sub(r'<!--@ page-404 -->\s*<section[\s\S]*?</section>\s*', '', n, count=1)

details = '''<!--@ details -->
<section class="slide s-white" aria-label="Les détails : rien n’est laissé au hasard">
  <div class="frame"><div class="in std" style="grid-template-columns: calc(270 * var(--u)) 1px minmax(0, 1fr)">
    <div class="lead">
      {{ar}}
      <p class="k rv">04 · Interface</p>
      <h2 class="h2 rv" style="--dl:.05s">Les détails : rien n’est laissé au hasard</h2>
      <p class="lede rv" style="--dl:.1s">Chaque moment de la visite est dessiné dans la DA, même ceux qu’on remarque à peine.</p>
    </div>
    <div class="vr"></div>
    <div class="body">
      <div class="dets">
        <figure class="rv" style="--dl:.1s"><div class="det det-load"><img class="dl-med" src="{{asset:brand/monogramme/medaillon-dolce-on-giardino.svg}}" alt=""><p class="dl-txt"><span class="dl-dep">Depuis,</span><span class="dl-year"></span></p><i class="dl-bar"></i></div><figcaption><b>Le chargement</b>2026 décompte jusqu’à 2006, l’année de fondation.</figcaption></figure>
        <figure class="rv" style="--dl:.18s"><div class="det det-tr"><img class="dt-a" src="{{img:c_hero}}" alt=""><img class="dt-b" src="{{img:c_restos}}" alt=""><div class="dt-veil"><img src="{{asset:brand/monogramme/medaillon-lisere-dolce.svg}}" alt=""><span>Restaurants</span></div></div><figcaption><b>Entre deux pages</b>Un fondu Giardino, le médaillon, le nom de la page.</figcaption></figure>
        <figure class="rv" style="--dl:.26s"><div class="det det-menu"><ol><li>Découvrir</li><li>Chez vous</li><li>Restaurants</li><li>News &amp; Fidélité</li><li>Recrute</li></ol><div class="dm-arch"><img src="{{img:p_cuisine}}" alt=""><img src="{{img:p_vins}}" alt=""><img src="{{img:p_rlille}}" alt=""><img src="{{img:p_terrasse}}" alt=""></div></div><figcaption><b>Le menu</b>Chaque rubrique change la couleur et l’image.</figcaption></figure>
        <figure class="rv" style="--dl:.34s"><div class="det det-404"><p class="d4-num"><span>4</span><img src="{{img:x_plate}}" alt=""><span>4</span></p><p class="d4-t">Oh no, mamma mia&#8239;!</p></div><figcaption><b>La page introuvable</b>Même une erreur ramène vers une table.</figcaption></figure>
      </div>
    </div>
  {{foot}}</div></div>
</section>

'''
if '<!--@ details -->' not in n:
    n = n.replace('<!--@ parcours-franchise -->', details + '<!--@ parcours-franchise -->', 1)

base.write_text(b); new.write_text(n)

c = here / 'compose.py'; s = c.read_text()
s = s.replace("N['ui-menu'], N['ui-header'], N['page-404'],", "N['ui-menu'], N['ui-header'], N['details'],")
c.write_text(s)

bd = here / 'build.py'; t = bd.read_text()
if "'x_plate'" not in t:
    t = t.replace("'x_404': (root / 'brand/404-actuelle.jpg', 1400)", "'x_404': (root / 'brand/404-actuelle.jpg', 1400), 'x_plate': (root / 'brand/plate.webp', 600)")
bd.write_text(t)
print('rush-tag' in b, 'details' in n, "N['details']" in s, "'x_plate'" in t)
