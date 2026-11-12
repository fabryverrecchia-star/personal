"""Recompose la présentation : parcours visiteur, parcours franchisé, fonctionnalités.
Lit deck.html (diapositives existantes) et new-slides.html (ajouts), écrit deck.html.
Usage : python3 src/compose.py"""
import pathlib, re

here = pathlib.Path(__file__).resolve().parent
base = here / 'deck.before-compose.html'
if not base.exists(): base.write_text((here / 'deck.html').read_text())
src = base.read_text()
new = (here / 'new-slides.html').read_text()

head = src[:src.index('<main>') + len('<main>')]
tail = src[src.index('</main>'):]
body = src[src.index('<main>') + len('<main>'):src.index('</main>')]
sections = re.findall(r'<section class="slide[\s\S]*?</section>', body)
S = {re.search(r'aria-label="([^"]*)"', s).group(1).replace('\u202f', ' '): s for s in sections}
N = {m.group(1): m.group(2) for m in re.finditer(r'<!--@ ([\w-]+) -->\s*(<section[\s\S]*?</section>)', new)}

def take(label):
    assert label in S, label
    return S[label]

def divider(id_, title, num, items, theme='s-navy'):
    li = '\n'.join(f'      <li><span class="n-num">{i+1:02d}</span><span class="n-t">{a}</span>{b}</li>' for i, (a, b) in enumerate(items))
    return f'''<section class="slide {theme}" id="{id_}" aria-label="Chapitre {num} : {re.sub('<[^>]+>', ' ', title)}">
  <div class="frame"><div class="in div">
    <div class="div-l">
      <div class="div-t rv"><span class="num">{num}</span><h2 class="hx">{title}</h2></div>
    </div>
    <div class="vr"></div>
    <div class="div-r rv" style="--dl:.3s"><p class="k">Dans ce chapitre</p><ol class="notes">
{li}
    </ol></div>
  </div></div>
</section>'''

order = [
    take('Couverture'), take('Avertissement'), '{{TOC}}',
    divider('projet', 'Votre projet', '01', [('Votre brief', 'Enjeux, objectifs, besoins.'), ('L’audit SEO', 'Ce que disent les chiffres.'), ('Nos objectifs', 'Des cibles mesurées après la refonte.')]),
    take('Votre brief'), take('Vos deux priorités'), take('Vos demandes complémentaires'), take('Audit SEO : chiffres clés'), N['objectifs'], take('Site actuel : relevés techniques'),
    divider('studio', 'Le studio', '02', [('Qui nous sommes', 'Un studio de création parisien.'), ('Votre équipe', 'Les personnes qui feront le site.'), ('Références', 'Des projets comparables.')]),
    take('À propos'), N['equipe'], take('Nos services'), N['references'],
    divider('da', 'Direction artistique', '03', [('Notre lecture', 'Votre identité 2026, comprise et testée.'), ('Les éléments', 'Logo, couleurs, typographies, photo.'), ('L’évolution', 'Ce que nous gardons, adaptons, ajoutons.')]),
    take('Direction artistique : notre lecture de la charte 2026'), take('Logo signature 2026'), take('Palette de couleurs'), take('Palette : thèmes de section'), take('Typographies'),
    take('Médaillon et monogrammes'), take('Direction photo'), take('Composants d’interface'), take('De la charte au site : ce qui évolue'),
    divider('visiteur', 'Parcours visiteur', '04', [('Le parcours', 'De la recherche à la table.'), ('L’interface', 'Accueil, menu, store locator, pages restaurant.'), ('L’origine des produits', 'Des producteurs aux restaurants.')]),
    N['parcours-visiteur'], N['ui-slider'], N['ui-slider-detail'], N['ui-menu'], N['ui-header'],
    take('Landing page : vidéos producteurs'), take('Landing page : version mobile'),
    take('Store locator : démo'), take('Page restaurant : haut de page'), take('Page restaurant : infos pratiques'), take('Page restaurant : structure'),
    take('Carte d’Italie dans votre site : aperçu interactif'), take('De l’Italie à vos tables'),
    divider('franchise', 'Parcours franchisé', '05', [('Le parcours', 'De la curiosité à l’ouverture.'), ('L’interface', 'Page franchise et carte des opportunités.'), ('L’ouverture', 'Un restaurant en ligne dès la signature.')]),
    N['parcours-franchise'], take('Page Devenir franchisé'), N['franchise-ui'], take('Carte franchise dans votre site : aperçu interactif'),
    take('Nouveau restaurant en un clic : démo'), take('Nouveau restaurant : calendrier d’ouverture'),
    divider('fonctions', 'Fonctionnalités', '06', [('Le back-office', 'L’outil, les rôles, votre indépendance.'), ('Les intégrations', 'Vos outils actuels, reliés.'), ('Visibilité et socle', 'SEO naturel, GEO, accessibilité, performance.')]),
    N['backoffice'], take('Pages restaurant gérables : démo'), take('Back-office : rôles et validation'), N['integrations'],
    take('Carte du réseau dans votre site : aperçu interactif'), take('Store locator : fonctionnalités'),
    take('SEO : migration sans perte'), take('SEO local'), take('GEO'), take('Accessibilité RGAA'), take('RGPD et mesure d’audience'), take('Performance et robustesse'),
    divider('projet-oeuvre', 'Mise en œuvre', '07', [('Reprise et exploitation', 'Le contrat actuel, l’hébergement, la maintenance.'), ('Le calendrier', 'Des dates, calées sur votre préavis.'), ('Le cadre', 'Ce que nous attendons, ce qui est exclu.')]),
    take('Reprise technique : points de vigilance'), take('Hébergement et maintenance'), take('Méthode et planning'), N['calendrier'], N['attentes'], N['exclusions'],
    divider('demo', 'Le site en main', '08', [('La maquette', 'Ce qui existe déjà.'), ('Naviguez', 'Le site complet, dans un ordinateur et un téléphone.')]),
    take('Maquette réalisée'), N['live'],
    divider('budget', 'Estimation budgétaire', '09', [('Création du site', 'Le détail par lot.'), ('Échéancier et suivi', 'Paiement, hébergement, options.'), ('Prochaines étapes', 'Pour démarrer en janvier.')]),
    take('Estimation budgétaire : création du site'), take('Estimation budgétaire : échéancier et suivi'), take('Prochaines étapes'),
    take('Contact'), take('Merci'),
]

toc = take('Sommaire')
toc_nav = '''<nav class="toc-list rv" style="--dl:.2s; gap:calc(14 * var(--u))" aria-label="Chapitres">
      <a href="#projet"><span>01</span><span>Votre projet</span></a>
      <a href="#studio"><span>02</span><span>Le studio</span></a>
      <a href="#da"><span>03</span><span>Direction artistique</span></a>
      <a href="#visiteur"><span>04</span><span>Parcours visiteur</span></a>
      <a href="#franchise"><span>05</span><span>Parcours franchisé</span></a>
      <a href="#fonctions"><span>06</span><span>Fonctionnalités</span></a>
      <a href="#projet-oeuvre"><span>07</span><span>Mise en œuvre</span></a>
      <a href="#demo"><span>08</span><span>Le site en main</span></a>
      <a href="#budget"><span>09</span><span>Estimation budgétaire</span></a>
    </nav>'''
toc = re.sub(r'<nav class="toc-list[\s\S]*?</nav>', toc_nav, toc)
order[order.index('{{TOC}}')] = toc

# Numéros de chapitre des intitulés : renumérotés d'après le chapitre courant
out, chap = [], None
for s in order:
    m = re.search(r'class="slide [^"]*" id="[^"]*" aria-label="Chapitre (\d\d)', s)
    if m: chap = m.group(1)
    elif chap:
        s = re.sub(r'(<p class="k rv"[^>]*>)\d\d( ?\s?·)', lambda x: x.group(1) + chap + x.group(2), s)
    out.append(s)
order = out

html = '\n\n'.join(order)

# Moins de contenu par bloc : deux puces au plus par colonne, trois notes au plus
html = re.sub(r'(<ul>(?:\s*<li>[\s\S]*?</li>){2})(?:\s*<li>[\s\S]*?</li>)+(\s*</ul>)', r'\1\2', html)
def cut_notes(m):
    items = re.findall(r'<li[\s\S]*?</li>', m.group(2))
    return m.group(1) + '\n'.join(items[:3]) + m.group(3)
html = re.sub(r'(<ol class="notes"[^>]*>)([\s\S]*?)(</ol>)', cut_notes, html)

# Vocabulaire : on parle de fonctionnalités, pas de « la carte d’Italie »
R = [
    ('Carte d’Italie dans votre site : aperçu interactif', 'Origine des produits : aperçu interactif'),
    ('Carte d’Italie dans votre site : aperçu interactif', 'Origine des produits : aperçu interactif'),
    ('De l’Italie à vos tables : le trajet des produits', 'Origine des produits : de l’Italie à vos tables'),
    ('Carte du réseau dans votre site : aperçu interactif', 'Carte du réseau : aperçu interactif'),
    ('Carte franchise dans votre site : aperçu interactif', 'Carte des opportunités : aperçu interactif'),
    ('Page « Devenir franchisé »', 'Page franchise : l’accroche'),
    ('· Carte d’Italie', '· Origine des produits'), ('· Italie et France', '· Origine des produits'),
    ('· Carte franchise', '· Carte des opportunités'), ('· Carte de France', '· Carte du réseau'),
    ('Typographies : Salo Paolo, Inter, Mea Culpa', 'Typographies : Salo Paolo et Inter'),
    ('color:var(--ir-peonia)', 'color:var(--ir-cielo)'),
]
for a, b in R:
    pat = re.escape(a.replace('\u202f', ' ')).replace('\\ ', '[\u202f ]').replace(' ', '[\u202f ]')
    html = re.sub(pat, b, html)
# Typographies : Mea Culpa retirée du site, on présente les deux voix
html = re.sub(r'<div class="spec" style="background:var\(--ir-giardino\); color:var\(--ir-dolce\)"><p class="ey" style="color:var\(--ir-cielo\)">Mea Culpa[\s\S]*?</div>\s*</div>',
              '<div class="spec" style="background:var(--ir-giardino); color:var(--ir-dolce)"><p class="ey" style="color:var(--ir-cielo)">L’accent · Salo Paolo en couleur</p><p class="ir-d" style="font-size:calc(52 * var(--u)); line-height:.9">Le vrai dans l’assiette, <span style="color:var(--ir-cielo)">l’Italie dans le cœur</span></p><p class="ir" style="font-size:calc(13 * var(--u)); opacity:.85">La seconde voix du titre reste en Salo Paolo, dans la couleur d’accent de la section. La manuscrite n’est plus utilisée.</p></div>\n      </div>', html, count=1)
html = html.replace('Les trois voix de la marque, chacune avec un rôle précis.', 'Deux voix de la marque, et un accent de couleur.')

(here / 'deck.html').write_text(head + '\n\n' + html + '\n\n' + tail)
print('diapositives :', html.count('class="slide '))

# Titres renommés (tolère espaces fines et espaces normales)
T = [
    (r'Carte d’Italie dans votre site\s?\W?\s?: aperçu interactif', 'Origine des produits : aperçu interactif'),
    (r'De l’Italie à vos tables\s?\W?\s?: le trajet des produits', 'Origine des produits : de l’Italie à vos tables'),
    (r'Page «\s?\W?Devenir franchisé\s?\W?»', 'Page franchise : l’accroche'),
    (r'Carte franchise dans votre site\s?\W?\s?: aperçu interactif', 'Carte des opportunités : aperçu interactif'),
    (r'Carte du réseau dans votre site\s?\W?\s?: aperçu interactif', 'Carte du réseau : aperçu interactif'),
]
d = (here / 'deck.html').read_text()
for a, b in T:
    d = re.sub(a.replace(' ', r'[  ]?'), b.replace(' :', ' :'), d)
(here / 'deck.html').write_text(d)
