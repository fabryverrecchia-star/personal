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
images = {
    'c_hero': (caps / 'desktop-01-accueil-hero.png', D), 'c_video': (caps / 'desktop-02-accueil-produits-video.png', D),
    'c_piliers': (caps / 'desktop-03-accueil-piliers.png', D), 'c_carte': (caps / 'desktop-04-accueil-carte.png', D),
    'c_franchise_hero': (caps / 'desktop-05-franchise-hero.png', D), 'c_franchise_chiffres': (caps / 'desktop-06-franchise-chiffres.png', D),
    'c_etapes': (caps / 'desktop-08-franchise-etapes.png', D), 'c_restos': (caps / 'desktop-09-restaurants-carte.png', D),
    'c_lille': (caps / 'desktop-10-restaurant-lille.png', D), 'c_lille_infos': (caps / 'desktop-11-restaurant-infos.png', D),
    'c_carte_menu': (caps / 'desktop-12-notre-carte.png', D), 'c_produits': (caps / 'desktop-13-produits.png', D),
    'c_pied': (caps / 'desktop-15-pied-de-page.png', D),
    'm_accueil': (caps / 'mobile-01-accueil.png', M), 'm_franchise': (caps / 'mobile-02-franchise.png', M),
    'm_resto': (caps / 'mobile-03-restaurant.png', M), 'm_video': (caps / 'mobile-04-produits-video.png', M),
    'm_menu': (caps / 'mobile-05-menu.png', M),
    'p_plats': (photo / 'plats-partage.webp', 900), 'p_homehero': (photo / 'home-hero.webp', 760),
    'p_showcook': (photo / 'show-cooking.webp', 760), 'p_cuisine': (photo / 'cuisine.webp', 460),
    'p_pizza': (photo / 'pizza.webp', 460), 'p_terrasse': (photo / 'terrasse.webp', 760),
    'p_rlille': (photo / 'r-lille.webp', 760), 'p_team': (photo / 'team-lille.webp', 760),
    'p_serveur': (photo / 'serveur.webp', 760), 'p_chefbar': (photo / 'chef-bar.webp', 760),
    'p_board': (photo / 'board.webp', 760), 'p_resto_photo': (photo / 'r-lille.webp', 900),
    'x_about': (ref / 'p2-000.jpg', 900), 'x_presto': (ref / 'p18-000.jpg', 1300), 'x_merci': (ref / 'p19-000.jpg', 900),
}
cache = {}


def image(key):
    if key not in cache:
        if key == 'head_strip':  # bandeau d'en-tête du site, découpé dans une capture
            cache[key] = webp(Image.open(caps / 'desktop-09-restaurants-carte.png'), 1100, 80, crop=(0, 0, 1440, 68))
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

html = html.replace('{{ar}}', ARROW.format(c='')).replace('{{ar-up}}', ARROW.format(c=' up')).replace('{{ar-s}}', ARROW.format(c=''))
html = re.sub(r'\{\{mbp\|([\w -]*)\|([\w,]+)\}\}', lambda m: mbp(m.group(1), m.group(2).split(',')), html)
html = re.sub(r'\{\{iph\|([\w -]*)\|([\w,]+)\}\}', lambda m: iph(m.group(1), m.group(2).split(',')), html)
html = re.sub(r'\{\{mbp-open\|([\w -]*)\}\}', lambda m: f'<div class="mbp {m.group(1)}"><div class="mbp-lid"><div class="mbp-bezel"><div class="mbp-screen">', html)
html = html.replace('{{mbp-close}}', '</div></div></div><div class="mbp-base"></div></div>')
html = re.sub(r'\{\{img:(\w+)\}\}', lambda m: image(m.group(1)), html)
html = html.replace('{{map_w}}', str(data['W'])).replace('{{map_h}}', str(data['H'])).replace('{{map_path}}', data['path'])

# Pied de slide numéroté
total = html.count('class="slide ')
parts = html.split('class="slide ')
count = 0
out = [parts[0]]
for part in parts[1:]:
    count += 1
    out.append(part.replace('{{foot}}', f'<p class="foot" aria-hidden="true"><span>18H22 × Il Ristorante</span><span>{count:02d} / {total:02d}</span></p>'))
html = 'class="slide '.join(out)
assert '{{' not in html, re.findall(r'\{\{[^}]*\}\}', html)[:5]

payload = json.dumps({'restaurants': data['restaurants'], 'cities': data['cities']}, ensure_ascii=False).replace('</', '<\\/')
page = ('<!doctype html>\n<html lang="fr"><head><meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<title>Proposition Il Ristorante</title>\n'
        '<meta name="description" content="Proposition de refonte du site Il Ristorante par le Studio 18h22.">\n'
        f'<style>\n{css}\n</style>\n</head>\n<body>\n{html}\n'
        f'<script type="application/json" id="loc-data">{payload}</script>\n<script>\n{js}\n</script>\n</body>\n</html>\n')
out_dir = root / 'dist'
out_dir.mkdir(exist_ok=True)
(out_dir / 'index.html').write_text(page)
print('dist/index.html', total, 'slides', round((out_dir / 'index.html').stat().st_size / 1024 / 1024, 2), 'Mo')
