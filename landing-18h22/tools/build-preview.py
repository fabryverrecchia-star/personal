"""Construit un aperçu autonome (un seul fichier HTML, tout inclus) pour l'Artifact.
Usage : python3 tools/build-preview.py <sortie.html>"""
import base64, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'preview.html')

def data_uri(path, mime):
    with open(os.path.join(ROOT, path), 'rb') as f:
        return 'data:%s;base64,%s' % (mime, base64.b64encode(f.read()).decode())

def read(p):
    return open(os.path.join(ROOT, p), encoding='utf-8').read()

html = read('index.html')
css = read('assets/css/style.css') + '\n' + read('assets/css/site.css') + '\n' + read('assets/css/case.css')
css = re.sub(r"url\('\.\./fonts/([^']+)'\)", lambda m: "url('%s')" % data_uri('assets/fonts/' + m.group(1), 'font/woff2'), css)
projects = re.sub(r"src: '([^']+)'", lambda m: "src: '%s', file: '%s'" % (data_uri(m.group(1), 'image/webp'), m.group(1)), read('assets/js/projects.js'))
app = read('assets/js/app.js')
site = read('assets/js/site.js')
site = re.sub(r"'(assets/services/[a-z]+\.webp)'", lambda m: "'%s'" % data_uri(m.group(1), 'image/webp'), site)
cases = re.sub(r"'(assets/(?:cases|projects)/[^']+\.(webp|svg))'", lambda m: "'%s'" % data_uri(m.group(1), 'image/svg+xml' if m.group(2) == 'svg' else 'image/webp'), read('assets/js/cases.js'))
casejs = read('assets/js/case.js')
import glob
vectors = '\n'.join(read(os.path.relpath(f, ROOT)) for f in sorted(glob.glob(os.path.join(ROOT, 'assets/cases/*/vectors.js'))))
three = read('assets/vendor/three.min.js')
lenis = read('assets/vendor/lenis.min.js')

html = re.sub(r'src="(assets/team/[a-z]+\.webp)"', lambda m: 'src="%s"' % data_uri(m.group(1), 'image/webp'), html)
html = html.replace('src="assets/reel/reel.mp4"', 'src="%s"' % data_uri('assets/reel/reel.mp4', 'video/mp4'))
html = html.replace('poster="assets/reel/reel-poster.jpg"', 'poster="%s"' % data_uri('assets/reel/reel-poster.jpg', 'image/jpeg'))
head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
body = re.search(r'<body[^>]*>(.*?)</body>', html, re.S).group(1)
# pas de fichiers externes : on retire liens locaux et scripts, on les remet inline
head = re.sub(r'\s*<link rel="(icon|preload|stylesheet)" href="assets/[^>]*>', '', head)
head = re.sub(r'\s*<meta (charset|name="viewport")[^>]*>', '', head)
body = re.sub(r'\s*<script( defer)? src="assets/[^"]+"></script>', '', body)

page = (head.strip() + '\n<style>\n' + css + '\n</style>\n' + body.strip() +
        '\n<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>\n'
        '<script>document.body.classList.add("is-intro"); window.PREVIEW = true;</script>\n'
        '<script>\n' + projects + '\n</script>\n<script>\n' + three + '\n</script>\n<script>\n' + lenis + '\n</script>\n<script>\n' + cases + '\n</script>\n<script>\n' + vectors + '\n</script>\n<script>\n' + site + '\n</script>\n<script>\n' + casejs + '\n</script>\n<script>\n' + app + '\n</script>\n')
open(out, 'w', encoding='utf-8').write(page)
print(out, round(len(page) / 1024), 'Ko')
