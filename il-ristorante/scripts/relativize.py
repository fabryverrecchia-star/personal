"""Copie dist/ vers dist-relatif/ en rendant tous les chemins relatifs :
le site fonctionne alors dans n'importe quel dossier du FTP (racine ou sous-dossier)."""
import pathlib, re, shutil, sys
root = pathlib.Path(__file__).resolve().parent.parent
src, out = root / 'dist', root / 'dist-relatif'
if out.exists(): shutil.rmtree(out)
shutil.copytree(src, out)
ATTR = re.compile(r'((?:href|src|poster|action|content|data-[\w-]+)=")/(?!/)([^"]*)"')
SRCSET = re.compile(r'(srcset=")([^"]*)"')
CSSURL = re.compile(r'url\((["\']?)/(?!/)([^)"\']*)\1\)')
def rel_html(text, prefix):
    def fix(m):
        path = m.group(2)
        if m.group(1).startswith('content=') and not re.match(r'(img|brand|fonts|_astro|videos)/', path): return m.group(0)
        if path == '': return f'{m.group(1)}./"'
        # Liens de page : dossier explicite pour fonctionner sur tout serveur
        if '.' not in path.split('/')[-1] and not path.endswith('/') and '#' not in path and '?' not in path: path += '/'
        return f'{m.group(1)}{prefix}{path}"'
    text = ATTR.sub(fix, text)
    text = SRCSET.sub(lambda m: m.group(1) + re.sub(r'(^|,\s*)/(?!/)', lambda x: x.group(1) + prefix, m.group(2)) + '"', text)
    text = CSSURL.sub(lambda m: f'url({m.group(1)}{prefix}{m.group(2)}{m.group(1)})', text)
    return text
for f in out.rglob('*.html'):
    depth = len(f.relative_to(out).parts) - 1
    # Racine du site calculée au chargement : tous les chemins partent de là, même après une transition de page
    base = ('<script>document.write(\'<base data-astro-transition-persist="ilr-base" href="\'+new URL(\''
            + ('../' * depth or './') + '\', location.href).href+\'">\')</script>')
    t = rel_html(f.read_text(), '')
    # Sous-dossier : navigation classique entre les pages (la transition animée suppose la racine du domaine)
    t = t.replace('<a ', '<a data-astro-reload ')
    t = t.replace('<head>', '<head>' + base, 1) if '<head>' in t else base + t
    f.write_text(t)
for f in (out / '_astro').glob('*.css'):
    f.write_text(CSSURL.sub(lambda m: f'url({m.group(1)}../{m.group(2)}{m.group(1)})', f.read_text()))
left = [str(f.relative_to(out)) for f in out.rglob('*') if f.suffix in ('.html', '.css') and re.search(r'(?:href|src)="/(?!/)|url\(["\']?/(?!/)', f.read_text())]
print('fichiers avec chemins absolus restants :', left[:5] or 'aucun')
