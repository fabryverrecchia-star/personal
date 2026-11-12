"""Deuxième série de retours : motivations, À propos plus professionnel, animations DA et photo, page 404.
Usage : python3 src/edits2.py && python3 src/compose.py"""
import pathlib, re
here = pathlib.Path(__file__).resolve().parent
base = here / 'deck.before-compose.html'
new = here / 'new-slides.html'
b, n = base.read_text(), new.read_text()

def swap(s, start_re, html):
    m = re.search(start_re, s)
    assert m, start_re
    j = s.index('</section>', m.start()) + len('</section>')
    return s[:m.start()] + html + s[j:]

# 1. Motivations (la mention « exemple » passe en petit)
b = swap(b, r'<section class="slide s-navy" id="avertissement"', '''<section class="slide s-navy" id="avertissement" aria-label="Avertissement">
  <div class="frame"><div class="in warn">
    <div class="lead">{{ar}}<p class="k rv">Nos motivations</p><p class="small push rv" style="--dl:.3s">Les maquettes, textes et visuels de ce document sont des exemples réalisés pour ce rendez-vous. Aucun n’est une version officielle ou finale : tout sera revu et validé avec vous avant le début des travaux.</p></div>
    <div class="vr"></div>
    <div class="warn-big">
      <p class="hx rv" style="--dl:.1s">Raconter l’Italie vraie, sans carte postale.</p>
      <p class="lede rv" style="--dl:.2s">Ce projet réunit ce que nous aimons : le design, l’Italie et la table. Nous voulons faire vivre vos valeurs et votre tradition à l’écran, avec une interface d’aujourd’hui, sans tomber dans le cliché.</p>
      <div class="cols rv" style="--dl:.3s">
        <div class="col"><p class="k">Tradition</p><h3>Respecter l’héritage</h3><p>Le produit, les gestes, la convivialité de la table, depuis 2006.</p></div>
        <div class="col"><p class="k">Modernité</p><h3>Un regard actuel</h3><p>Une interface premium et vivante, jamais folklorique.</p></div>
        <div class="col"><p class="k">Équipe</p><h3>Passionnés de design et d’Italie</h3><p>Une même équipe, de l’idée à la mise en ligne.</p></div>
      </div>
    </div>
  {{foot}}</div></div>
</section>''')

# 2. À propos : un ton plus professionnel
b = re.sub(r'(<div class="about-p rv" style="--dl:\.15s">)[\s\S]*?(<div class="tags">)', r'''\1
      <p>18H22 est un studio de création parisien, spécialisé dans les marques de l’hospitalité et de la gastronomie. Nous réunissons direction artistique, design d’interface et développement au sein d’une même équipe.</p>
      <p>Notre méthode : comprendre la marque avant de la dessiner, prototyper tôt, livrer exactement ce qui a été validé. Un interlocuteur unique, du cadrage à la maintenance.</p>
      <p>Pour Il Ristorante, nous avons étudié votre charte 2026, votre brand kit, l’audit d’avril 2026 et votre site actuel, puis construit une maquette fonctionnelle de la direction proposée.</p>
      \2''', b, count=1)

# 3. Direction photo : un des carrés devient un « rush » photo en boucle
rush = '<div class="rush" data-flip="140" aria-label="Série de photos en rafale">' + ''.join(f'<img src="{{{{img:r_{k:02d}}}}}" alt=""{" class=\"is-on\"" if k == 0 else ""}>' for k in range(12)) + '<span class="rush-tag">Rush · Dijon</span></div>'
b = b.replace('<img src="{{img:p_plats2}}" alt=""><img src="{{img:p_pizza}}" alt="">', '<img src="{{img:p_plats2}}" alt="">' + rush, 1)

# 4. Logo : une quatrième vignette animée, le logo dans toutes les couleurs de la charte
b = b.replace('<figcaption class="cap"><b>Dolce sur photo</b>En-tête des heros, sur zone calme</figcaption></figure>',
              '<figcaption class="cap"><b>Dolce sur photo</b>En-tête des heros, sur zone calme</figcaption></figure>\n        <figure class="rv" style="--dl:.4s"><div class="logo-t logo-anim">{{logo}}</div><figcaption class="cap"><b>En mouvement</b>Le logo dans les cinq thèmes de la charte</figcaption></figure>', 1)
b = b.replace('Nous avons testé ses trois emplois principaux sur le site.', 'Nous avons testé ses emplois principaux sur le site.')

# 5. Page 404 : l’actuelle et la nouvelle
p404 = '''<!--@ page-404 -->
<section class="slide s-grey" aria-label="Page 404 : avant et après">
  <div class="frame"><div class="in std" style="grid-template-columns: calc(280 * var(--u)) 1px minmax(0, 1fr)">
    <div class="lead">
      {{ar}}
      <p class="k rv">04 · Interface</p>
      <h2 class="h2 rv" style="--dl:.05s">Page 404 : avant et après</h2>
      <p class="lede rv" style="--dl:.1s">Même une erreur peut faire sourire, et ramener vers une table.</p>
    </div>
    <div class="vr"></div>
    <div class="body">
      <div class="duo404">
        <figure class="rv" style="--dl:.1s">{{mbp||x_404}}<figcaption><b>Aujourd’hui</b>Une page générique, sans lien avec la marque.</figcaption></figure>
        <figure class="rv" style="--dl:.2s">{{mbp-open|}}<div class="vp" data-fit><div class="vp-body e404">
          <img class="e404-logo" src="{{img:logo_med}}" alt="">
          <div class="e404-num" aria-label="404"><span>4</span><span class="e404-o"><img src="{{img:p_pizza}}" alt=""></span><span>4</span></div>
          <p class="e404-t"><span class="e404-oh">Oh no,</span> mamma mia&#8239;!</p>
          <p class="e404-p">Cette page s’est perdue quelque part entre Parme et Lille.</p>
          <div class="e404-btns"><span class="ir-btn">Retour à l’accueil</span><span class="ir-btn e404-red">Réserver une table</span></div>
          <span class="e404-st">Mamma<br>mia</span>
        </div></div>{{mbp-close}}<figcaption><b>Demain</b>Une page animée en boucle, dans la DA, qui renvoie vers l’accueil et la réservation.</figcaption></figure>
      </div>
    </div>
  {{foot}}</div></div>
</section>
'''
if 'page-404' not in n:
    n = n.replace('<!--@ parcours-franchise -->', p404 + '\n<!--@ parcours-franchise -->', 1)

base.write_text(b); new.write_text(n)
print('rush' in b, 'logo-anim' in b, 'page-404' in n, 'Nos motivations' in b)
