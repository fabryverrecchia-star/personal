"""Assemble la page du kit : remplace {{img:fichier}} par l'image en data URI."""
import base64, re, pathlib
here = pathlib.Path(__file__).parent
src = (here / 'kit.src.html').read_text()
def uri(m):
    p = here / 'img' / m.group(1)
    mime = 'image/png' if p.suffix == '.png' else 'image/jpeg'
    return f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode()
out = re.sub(r'\{\{img:([^}]+)\}\}', uri, src)
(here / 'kit-benjamin-landry.html').write_text(out)
print(round(len(out) / 1e6, 2), 'Mo', 'reste:', re.findall(r'\{\{img:', out))
