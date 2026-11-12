"""Assemble le dossier 18h22 en un seul fichier HTML autonome (polices, images, données en ligne).
Usage : python3 src/build.py <dossier des captures> <dossier des photos 18h22>
Le PDF est ensuite produit par src/pdf.mjs."""
import base64, io, json, pathlib, re, sys
from PIL import Image

here = pathlib.Path(__file__).resolve().parent
root = here.parent
site = root.parent / 'il-ristorante'
caps = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'captures'
ref = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else root / 'ref'
photo = site / 'public/img/site'


def b64(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(pathlib.Path(path).read_bytes()).decode()


def webp(im, w, q=72, crop=None):
    im = im.convert('RGB')
    if crop:
        im = im.crop(crop)
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=q, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()


D, M = 1280, 400  # largeur des captures bureau et mobile
C = {
    'c_hero': 'desktop-01-accueil-hero', 'c_video': 'desktop-02-accueil-produits-video', 'c_piliers': 'desktop-03-accueil-piliers',
    'c_carte': 'desktop-04-accueil-carte', 'c_franchise_hero': 'desktop-05-franchise-hero', 'c_franchise_chiffres': 'desktop-06-franchise-chiffres',
    'c_conditions': 'desktop-07-franchise-conditions', 'c_etapes': 'desktop-08-franchise-etapes', 'c_restos': 'desktop-09-restaurants-carte',
    'c_lille': 'desktop-10-restaurant-lille', 'c_lille_infos': 'desktop-11-restaurant-infos', 'c_carte_menu': 'desktop-12-notre-carte',
    'c_produits': 'desktop-13-produits', 'c_recrute': 'desktop-14-recrute', 'c_pied': 'desktop-15-pied-de-page',
    'c_intro': 'desktop-16-accueil-intro', 'c_slide2': 'desktop-25-slide-2', 'c_slide3': 'desktop-26-slide-3',
    'c_menu1': 'desktop-22-menu-decouvrir', 'c_menu2': 'desktop-23-menu-chez-vous', 'c_menu3': 'desktop-24-menu-restaurants', 'c_actu': 'desktop-18-actualite', 'c_signature': 'desktop-19-signature', 'c_unica': 'desktop-20-unica',
}
Mo = {
    'm_accueil': 'mobile-01-accueil', 'm_franchise': 'mobile-02-franchise', 'm_resto': 'mobile-03-restaurant', 'm_video': 'mobile-04-produits-video',
    'm_menu': 'mobile-05-menu', 'm_resto_infos': 'mobile-06-restaurant-infos', 'm_restaurants': 'mobile-07-restaurants', 'm_piliers': 'mobile-08-piliers',
}
P = {
    'p_plats': ('plats-partage', 900), 'p_homehero': ('home-hero', 760), 'p_showcook': ('show-cooking', 760), 'p_cuisine': ('cuisine', 520),
    'p_pizza': ('pizza', 520), 'p_terrasse': ('terrasse', 760), 'p_rlille': ('r-lille', 760), 'p_team': ('team-lille', 760),
    'p_serveur': ('serveur', 760), 'p_chefbar': ('chef-bar', 760), 'p_board': ('board', 760), 'p_resto_photo': ('r-lille', 900),
    'p_plats2': ('plats-selection', 760), 'p_cave': ('cave', 520), 'p_salle': ('franchise-salle', 760), 'p_spritz': ('franchise-spritz', 520),
    'p_gelato': ('gelato', 760), 'p_homebar': ('home-bar', 760), 'p_facade': ('franchise-facade', 760), 'p_fcuisine': ('franchise-cuisine', 760),
    'p_desserts': ('desserts', 520), 'p_interieur': ('interieur-plan-de-campagne', 760), 'p_teamrouen': ('team-rouen', 760), 'p_seminaire': ('seminaire', 760), 'p_salle2': ('franchise-salle-2', 760), 'p_teamfun': ('team-fun', 520), 'p_vins': ('vins-roses', 520),
}
images = {k: (caps / f'{v}.png', D) for k, v in C.items()}
images.update({k: (caps / f'{v}.png', M) for k, v in Mo.items()})
images.update({k: (photo / f'{n}.webp', w) for k, (n, w) in P.items()})
images.update({'k_lumiere': (root / 'brand/lumiere-portrait.webp', 1100), 'k_strategie': (root / 'brand/service-strategie.webp', 900), 'k_branding': (root / 'brand/service-branding.webp', 900), 'k_social': (root / 'brand/service-social.webp', 900), 'k_paris': (root / 'brand/showreel-paris.jpg', 1300), 'k_espresso': (root / 'brand/espresso.jpg', 1300), 'x_404': (root / 'brand/404-actuelle.jpg', 1400)})
images.update({f'r_{k:02d}': (root / f'brand/rush/{k:02d}.jpg', 520) for k in range(12)})
V = site / 'public/videos'
images.update({'v_teasing': (V / '01-ambiance-teasing-poster.webp', 420), 'v_parm': (V / '05b-parmesan-fabrication-edit-poster.webp', 760), 'v_jambon': (V / '03-jambon-de-parme-fabrication-poster.webp', 760), 'v_romeo': (V / '07-producteur-jambon-question-1-poster.webp', 420)})
images.update({'x_about': (ref / 'p2-000.jpg', 900), 'x_presto': (ref / 'p18-000.jpg', 1300), 'x_merci': (ref / 'p19-000.jpg', 900)})
cache = {}


def image(key):
    if key not in cache:
        if key == 'head_strip':  # bandeau d'en-tête du site, découpé dans une capture
            cache[key] = webp(Image.open(caps / 'desktop-09-restaurants-carte.png'), 1100, 80, crop=(0, 0, 1440, 86))
        elif key == 'z_bar':  # zoom sur la barre du slider
            cache[key] = webp(Image.open(caps / 'desktop-01-accueil-hero.png'), 1400, 82, crop=(0, 760, 1440, 900))
        elif key == 'z_header':  # zoom sur l'en-tête et les boutons flottants
            im = Image.open(caps / 'desktop-01-accueil-hero.png').convert('RGB')
            a, z = im.crop((760, 0, 1440, 90)), im.crop((1100, 800, 1440, 900))
            out = Image.new('RGB', (680, 200), (17, 87, 59)); out.paste(a, (0, 0)); out.paste(z, (340, 100))
            cache[key] = webp(out, 1360, 82)
        elif key == 'logo_med':
            cache[key] = b64(site / 'public/brand/monogramme/medaillon-chianti-on-dolce.svg', 'image/svg+xml')
        else:
            path, w = images[key]
            cache[key] = webp(Image.open(path), w)
    return cache[key]


ARROW = '<svg class="ar{c}" viewBox="0 0 32 32" aria-hidden="true"><path d="M7 7l18 18M25 11v14H11" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>'


def screens(keys):
    on = ' class="is-on"'
    return ''.join('<img src="' + image(k) + '" alt=""' + (on if i == 0 else '') + '>' for i, k in enumerate(keys))


def mbp(cls, keys):
    return (f'<div class="mbp {cls}"><div class="mbp-lid"><div class="mbp-bezel"><div class="mbp-screen" data-cycle>'
            f'{screens(keys)}</div></div></div><div class="mbp-base"></div></div>')


def iph(cls, keys):
    return f'<div class="iph {cls}"><div class="iph-in"><div class="iph-screen" data-cycle>{screens(keys)}</div></div></div>'


html = (here / 'deck.html').read_text()
css = (here / 'deck.css').read_text()
js = (here / 'deck.js').read_text()
js += '\n' + (here / 'maps.js').read_text()
maps = json.loads((here / 'maps.json').read_text())

data = json.loads((here / 'data.json').read_text())
fonts = {
    'sans': ('/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf', 'font/otf'),
    'sans-bold': ('/usr/share/fonts/opentype/urw-base35/NimbusSans-Bold.otf', 'font/otf'),
    'sans-italic': ('/usr/share/fonts/opentype/urw-base35/NimbusSans-Italic.otf', 'font/otf'),
    'salo': (site / 'public/fonts/SaloPaolo-Regular.woff2', 'font/woff2'),
    'inter300': (site / 'public/fonts/Inter-Light.woff2', 'font/woff2'),
    'inter400': (site / 'public/fonts/Inter-Regular.woff2', 'font/woff2'),
    'inter500': (site / 'public/fonts/Inter-Medium.woff2', 'font/woff2'),
    'mea': (site / 'public/fonts/MeaCulpa-Regular.woff2', 'font/woff2'),
}
css = re.sub(r'\{\{font:([\w-]+)\}\}', lambda m: b64(*fonts[m.group(1)]), css)

logo = (site / 'src/components/logo-signature.svg').read_text().replace('<svg ', '<svg role="img" aria-label="Il Ristorante, la cucina italiana" ', 1)
html = html.replace('{{logo}}', logo)
html = html.replace('{{ar-flow}}', '<svg class="arr" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 16h24M20 8l8 8-8 8" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>')
html = re.sub(r'\{\{asset:([\w/.-]+)\}\}', lambda m: b64(site / 'public' / m.group(1), 'image/svg+xml'), html)
html = html.replace('{{ar}}', ARROW.format(c='')).replace('{{ar-up}}', ARROW.format(c=' up')).replace('{{ar-s}}', ARROW.format(c=''))
html = re.sub(r'\{\{mbp\|([\w -]*)\|([\w,]+)\}\}', lambda m: mbp(m.group(1), m.group(2).split(',')), html)
html = re.sub(r'\{\{iph\|([\w -]*)\|([\w,]+)\}\}', lambda m: iph(m.group(1), m.group(2).split(',')), html)
html = re.sub(r'\{\{mbp-open\|([\w -]*)\}\}', lambda m: f'<div class="mbp {m.group(1)}"><div class="mbp-lid"><div class="mbp-bezel"><div class="mbp-screen">', html)
html = html.replace('{{mbp-close}}', '</div></div></div><div class="mbp-base"></div></div>')
html = re.sub(r'\{\{img:(\w+)\}\}', lambda m: image(m.group(1)), html)
html = html.replace('{{km_min}}', f"{maps['stats']['minKm']:,}".replace(',', '\u00a0')).replace('{{km_max}}', f"{maps['stats']['maxKm']:,}".replace(',', '\u00a0')).replace('{{opps}}', str(maps['stats']['opps']))
html = html.replace('{{map_w}}', str(data['W'])).replace('{{map_h}}', str(data['H'])).replace('{{map_path}}', data['path'])

# Pied de slide numéroté
total = html.count('class="slide ')
parts = html.split('class="slide ')
count = 0
out = [parts[0]]
for part in parts[1:]:
    count += 1
    out.append(part.replace('{{foot}}', f'<p class="foot" aria-hidden="true"><span>18H22 × Il Ristorante · Document de travail</span><span>{count:02d} / {total:02d}</span></p>'))
html = 'class="slide '.join(out)
assert '{{' not in html, re.findall(r'\{\{[^}]*\}\}', html)[:5]

payload = json.dumps({'restaurants': data['restaurants'], 'cities': data['cities']}, ensure_ascii=False).replace('</', '<\\/')
page = ('<!doctype html>\n<html lang="fr"><head><meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<title>Proposition Il Ristorante</title>\n'
        '<meta name="description" content="Proposition de refonte du site Il Ristorante par le Studio 18h22.">\n'
        f'<style>\n{css}\n</style>\n</head>\n<body>\n{html}\n'
        f'<script type="application/json" id="maps-data">{json.dumps(maps, ensure_ascii=False)}</script>\n'
        f'<script type="application/json" id="loc-data">{payload}</script>\n<script>\n{js}\n</script>\n</body>\n</html>\n')
out_dir = root / 'dist'
out_dir.mkdir(exist_ok=True)
(out_dir / 'index.html').write_text(page)
print('dist/index.html', total, 'slides', round((out_dir / 'index.html').stat().st_size / 1024 / 1024, 2), 'Mo')
