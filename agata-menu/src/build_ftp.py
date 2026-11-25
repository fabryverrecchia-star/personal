# Paquet FTP autonome : index.html + img/ + vignette de partage + icônes.
import json, sys, os, base64, shutil
sys.path.insert(0, '.')
BASE = "http://18h22.com/agata-menu/"
OUT = sys.argv[1] if len(sys.argv) > 1 else "ftp/agata-menu"

exec(open('build.py').read().split("A=json.load(open('assets.json'))")[-2])  # reprend data + imgs filtrées
A = json.load(open('assets.json'))

if os.path.isdir(OUT): shutil.rmtree(OUT)
os.makedirs(OUT + "/img")
paths = {}
for k, uri in imgs.items():
    head, b64 = uri.split(",", 1)
    ext = "jpg" if "jpeg" in head else "webp"
    open(f"{OUT}/img/{k}.{ext}", "wb").write(base64.b64decode(b64))
    paths[k] = f"img/{k}.{ext}"

J = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
app = open('app.js').read().replace('/*ASSETS*/', json.dumps(A, separators=(',', ':')))
t = open('template.html').read()
t = t.replace('/*DATA*/', J(data)).replace('/*APP*/', app).replace('/*IMAGES*/', J(paths))
cut = t.index('</style>') + len('</style>')
head_part, body_part = t[:cut], t[cut:]
head_part = head_part.replace('<title>Agata Smart Menu</title>', '')

TITLE = "Agata Pizzeria · Menu"
DESC = "La carte d'Agata, pizzeria napolitaine Rive Gauche : antipasti, pizze, dolci, cocktails et vins. 168 boulevard Saint-Germain, Paris."
meta = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{TITLE}</title>
<meta name="description" content="{DESC}">
<link rel="canonical" href="{BASE}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Agata Pizzeria">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="{TITLE}">
<meta property="og:description" content="{DESC}">
<meta property="og:url" content="{BASE}">
<meta property="og:image" content="{BASE}og-image.jpg">
<meta property="og:image:secure_url" content="{BASE.replace('http://','https://')}og-image.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Le visage d'Agata et le logo AGATA sur fond pêche">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{TITLE}">
<meta name="twitter:description" content="{DESC}">
<meta name="twitter:image" content="{BASE}og-image.jpg">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<style>:root{{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}html{{scroll-padding-top:env(safe-area-inset-top,0px)}}body{{margin:0;padding:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
'''
html = meta + head_part + "\n</head><body>" + body_part + "\n</body></html>"
open(f"{OUT}/index.html", "w").write(html)

open(f"{OUT}/.htaccess", "w").write('''# Cache long pour les photos, court pour la page
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 30 days"
  ExpiresByType image/png "access plus 30 days"
  ExpiresByType text/html "access plus 5 minutes"
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html
</IfModule>
DirectoryIndex index.html
''')
print("index.html", os.path.getsize(f"{OUT}/index.html") // 1024, "KB ·", len(paths), "photos")
