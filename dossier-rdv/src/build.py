"""Assemble le dossier en un seul fichier HTML autonome (polices, images et données en ligne).
Le PDF est ensuite produit par src/pdf.mjs. Usage : python3 src/build.py <dossier des captures>"""
import base64, io, json, pathlib, sys
from PIL import Image

here = pathlib.Path(__file__).resolve().parent
root = here.parent
site = root.parent / 'il-ristorante'
port = root.parent / 'portfolio'
caps = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'captures'


def b64(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(pathlib.Path(path).read_bytes()).decode()


def img(path, w, q=70):
    im = Image.open(path).convert('RGB')
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=q, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()


html = (here / '_head.html').read_text() + (here / '_body.html').read_text() + (here / '_tail.html').read_text()

fonts = {
    '__F_EBG__': port / 'public/fonts/EBGaramond-Roman.woff2',
    '__F_EBGI__': port / 'public/fonts/EBGaramond-Italic.woff2',
    '__F_CORM__': port / 'public/fonts/CormorantGaramond-Light.woff2',
    '__F_CORMI__': port / 'public/fonts/CormorantGaramond-LightItalic.woff2',
    '__F_SWASH__': port / 'public/fonts/AGaramond-Swash.woff2',
    '__F_FIG__': port / 'public/fonts/AGaramond-SemiboldItalicOsF.woff2',
    '__FONT_SALO__': site / 'public/fonts/SaloPaolo-Regular.woff2',
    '__FONT_INTER_300__': site / 'public/fonts/Inter-Light.woff2',
    '__FONT_INTER_400__': site / 'public/fonts/Inter-Regular.woff2',
    '__FONT_INTER_500__': site / 'public/fonts/Inter-Medium.woff2',
    '__FONT_MEA__': site / 'public/fonts/MeaCulpa-Regular.woff2',
}
for key, path in fonts.items():
    html = html.replace(key, b64(path, 'font/woff2'))

shots = {
    '__IMG_HERO__': 'desktop-01-accueil-hero', '__IMG_VIDEO__': 'desktop-02-accueil-produits-video',
    '__IMG_PILIERS__': 'desktop-03-accueil-piliers', '__IMG_CARTE__': 'desktop-04-accueil-carte',
    '__IMG_PIED__': 'desktop-15-pied-de-page', '__IMG_FRANCHISE__': 'desktop-06-franchise-chiffres',
    '__IMG_RESTAURANTS__': 'desktop-09-restaurants-carte', '__IMG_RESTO__': 'desktop-10-restaurant-lille',
    '__IMG_RESTO_INFOS__': 'desktop-11-restaurant-infos',
}
for key, name in shots.items():
    html = html.replace(key, img(caps / f'{name}.png', 1280))
mobile = {
    '__IMG_M_ACCUEIL__': 'mobile-01-accueil', '__IMG_M_VIDEO__': 'mobile-04-produits-video',
    '__IMG_M_MENU__': 'mobile-05-menu', '__IMG_M_RESTO__': 'mobile-03-restaurant', '__IMG_M_FRANCHISE__': 'mobile-02-franchise',
}
for key, name in mobile.items():
    html = html.replace(key, img(caps / f'{name}.png', 420))
html = html.replace('__IMG_RESTO_PHOTO__', img(site / 'public/img/site/r-lille.webp', 900, 72))

data = json.loads((here / 'data.json').read_text())
html = html.replace('__MAP_W__', str(data['W'])).replace('__MAP_H__', str(data['H'])).replace('__MAP_PATH__', data['path'])
payload = json.dumps({'restaurants': data['restaurants'], 'cities': data['cities']}, ensure_ascii=False).replace('</', '<\\/')
html = html.replace('__DATA__', payload)

out = root / 'dist'
out.mkdir(exist_ok=True)
page = ('<!doctype html>\n<html lang="fr"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + html + '\n</html>\n')
(out / 'index.html').write_text(page)
print('dist/index.html', round((out / 'index.html').stat().st_size / 1024 / 1024, 2), 'Mo')
