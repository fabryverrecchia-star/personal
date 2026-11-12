"""Retours de relecture appliqués aux sources de la présentation (avant compose.py).
Usage : python3 src/edits.py && python3 src/compose.py"""
import pathlib, re
here = pathlib.Path(__file__).resolve().parent
base = here / 'deck.before-compose.html'
new = here / 'new-slides.html'
b, n = base.read_text(), new.read_text()

def rep(s, a, c, count=1):
    if a not in s:
        return s
    return s.replace(a, c, count)

# 1. Points de vigilance et relevés : rassurer sans écrire « Notre réponse »
b = re.sub(r'<p><(?:strong|b)[^>]*>Notre réponse</(?:strong|b)>[\u202f ]?:\s*([^<]*)</p>', lambda m: '<p class="reassure">' + m.group(1)[0].upper() + m.group(1)[1:] + '</p>', b)

# 2. SEO naturel : nous ne sommes pas une agence SEO
b = rep(b, '<span>SEO et GEO</span>', '<span>SEO naturel</span>')
b = rep(b, '<li>SEO, GEO et accessibilité<small>Migration, pages locales, RGAA</small></li>', '<li>SEO naturel et accessibilité<small>Bonnes pratiques intégrées, RGAA</small></li>')
b = rep(b, '<h3>Prise en compte de l’audit SEO</h3>', '<h3>Prise en compte de l’audit SEO, en SEO naturel</h3>')
b = rep(b, 'SEO : migration sans perte de trafic', 'SEO naturel : migration sans perte de trafic')
b = rep(b, 'SEO : migration sans perte de trafic', 'SEO naturel : migration sans perte de trafic')
b = rep(b, 'SEO local : les pages restaurant dans Google', 'SEO naturel : les pages restaurant dans Google')
b = rep(b, 'SEO local : les pages restaurant dans Google', 'SEO naturel : les pages restaurant dans Google')
b = b.replace('class="k rv">08 · SEO</p>', 'class="k rv">08 · SEO naturel</p>')
b = rep(b, 'Un changement de site est le moment où l’on perd le plus de trafic. Notre plan protège votre capital avant de chercher à le faire grandir.',
        'Le site est construit selon les bonnes pratiques du référencement naturel : pas d’outils ni de démarche agressive, mais une base saine qui protège votre trafic.')
b = rep(b, 'C’est là que se joue le &lt; 1 % de clics relevé par l’audit. Chaque page restaurant est écrite pour la recherche de proximité.',
        'Un référencement naturel, sans artifice : chaque page restaurant est claire, rapide et bien décrite pour la recherche de proximité.')
b = rep(b, '<li>Performance, SEO, accessibilité</li>', '<li>Performance, référencement naturel, accessibilité</li>')
b = rep(b, '<span class="lbl" role="rowheader">SEO, accessibilité, RGPD</span>', '<span class="lbl" role="rowheader">SEO naturel, accessibilité, RGPD</span>')

# 3. Back-office : rôles par pôle, chacun ne gère que son périmètre
i = re.search(r'<section class="slide s-white" aria-label="Back-office[\u202f ]: rôles et validation">', b).start()
j = b.index('</section>', i) + len('</section>')
b = b[:i] + '''<section class="slide s-white" aria-label="Back-office : rôles et validation">
  <div class="frame"><div class="in std">
    <div class="lead">
      {{ar}}
      <p class="k rv">07 · Back-office</p>
      <h2 class="h2 rv" style="--dl:.05s">Back-office : un rôle par pôle</h2>
      <p class="lede rv" style="--dl:.1s">Chaque équipe accède seulement à ce qu’elle gère. Les rôles seront définis avec vous au cadrage.</p>
    </div>
    <div class="vr"></div>
    <div class="body">
      <div class="roles rv" style="--dl:.1s">
        <div><p class="k">Pôle marketing</p><h3>La marque</h3><p>Accueil, actualités, opérations nationales, validation des contenus.</p></div>
        <div><p class="k">Pôle financier</p><h3>Les chiffres</h3><p>Chiffres franchise, conditions, statistiques de réservation.</p></div>
        <div><p class="k">Pôle franchise</p><h3>Le réseau</h3><p>Création des restaurants, candidatures, carte des opportunités.</p></div>
        <div class="role-r"><p class="k">Franchisé · directeur</p><h3>Sa fiche, seulement</h3><p>Horaires, plat du moment, événements, recrutement de son restaurant.</p></div>
      </div>
      <p class="note rv" style="--dl:.2s">{{ar-s}}Chaque modification est tracée et peut être annulée. Le marketing valide avant publication.</p>
    </div>
  {{foot}}</div></div>
</section>''' + b[j:]

# 4. Estimation budgétaire : intitulés des lots
b = rep(b, '<b>Développement du site et WebGL</b><span>52 pages, mêmes URL, responsive, animations</span>',
        '<b>Développement du site, technologie moderne et responsive</b><span>WebGL, optimisation des vidéos et des images, animations, mêmes URL</span>')
b = rep(b, '<b>Back-office des restaurants</b><span>Pages gérables, rôles, validation, ouverture en un clic</span>',
        '<b>Back-office et contrôle autonome</b><span>Rôles par pôle, validation, ouverture en un clic, formation des équipes</span>')
b = rep(b, '<b>Cartes interactives</b><span>Italie des produits, réseau, carte franchise</span>',
        '<b>Fonctionnalités et contenus premium</b><span>Cartes interactives, géolocalisation, origine des produits</span>')
b = rep(b, '<b>SEO, accessibilité, RGPD, recette</b>', '<b>SEO naturel, accessibilité, RGPD, recette</b>')
b = rep(b, '<li>Back-office des restaurants<small>Pages gérables, ouverture en un clic</small></li>', '<li>Back-office et contrôle autonome<small>Rôles par pôle, ouverture en un clic</small></li>')

# 5. Hébergement et maintenance : mis en avant
b = rep(b, '''      <div class="cols rv" style="--dl:.35s">
        <div class="col"><p class="k">Abonnement mensuel</p><h3>Hébergement et maintenance</h3><p><b style="color:var(--fg)">600 à 900 € HT par mois</b>, engagement de 12 mois. Hébergement européen, sauvegardes, surveillance, mises à jour, rapport mensuel.</p></div>''',
'''      <div class="sub-box rv" style="--dl:.3s"><div><p class="k">Abonnement mensuel · hébergement et maintenance</p><p class="sub-price">600 à 900 € HT <small>par mois</small></p></div><ul class="sub-l"><li>Engagement de 12 mois</li><li>Hébergement européen et sauvegardes</li><li>Surveillance, mises à jour, rapport mensuel</li></ul></div>
      <div class="cols rv" style="--n:2; --dl:.35s">''')

# 6. Hors périmètre : cinq points seulement
n = re.sub(r'<ul class="excl[^"]*"[^>]*>[\s\S]*?</ul>', '''<ul class="excl rv" style="--dl:.1s">
        <li>Licences et abonnements des outils tiers</li>
        <li>Hébergement des e-mails</li>
        <li>Rédaction des contenus éditoriaux</li>
        <li>Traductions du site</li>
        <li>Nouveaux shootings photo et tournages vidéo</li>
      </ul>''', n, count=1)
n = n.replace('Boutique actuelle conservée et reliée. Sa refonte est hors périmètre.', 'Boutique actuelle conservée et reliée depuis le site.')

base.write_text(b); new.write_text(n)
print('Notre réponse restants :', b.count('Notre réponse'), '| SEO naturel :', b.count('SEO naturel'), '| sub-box :', 'sub-box' in b, '| rôles :', 'role-r' in b)
