"""Vectorise le logo signature 2026 (brand/logo-signature-2026.png) en SVG monochrome.
Le SVG utilise currentColor : il prend la couleur du texte (crème sur photo, bordeaux sur fond clair).
Usage : python3 scripts/build-logo.py"""
from pathlib import Path
import numpy as np
import potrace
from PIL import Image

root = Path(__file__).resolve().parent.parent
im = Image.open(root / 'brand' / 'logo-signature-2026.png').convert('RGBA')
alpha = np.array(im)[:, :, 3]
ys, xs = np.where(alpha > 10)
pad = 6
x0, y0, x1, y1 = xs.min() - pad, ys.min() - pad, xs.max() + pad, ys.max() + pad
mask = alpha[y0:y1, x0:x1] > 128
bmp = potrace.Bitmap(~mask)  # potracer trace les pixels « faux »
path = bmp.trace(turdsize=4, alphamax=1.0, opticurve=True, opttolerance=0.2)
parts = []
for curve in path:
    s = curve.start_point
    d = [f'M{s.x:.1f} {s.y:.1f}']
    for seg in curve.segments:
        if seg.is_corner:
            d.append(f'L{seg.c.x:.1f} {seg.c.y:.1f}L{seg.end_point.x:.1f} {seg.end_point.y:.1f}')
        else:
            d.append(f'C{seg.c1.x:.1f} {seg.c1.y:.1f} {seg.c2.x:.1f} {seg.c2.y:.1f} {seg.end_point.x:.1f} {seg.end_point.y:.1f}')
    parts.append(''.join(d) + 'Z')
w, h = x1 - x0, y1 - y0
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" fill="currentColor" fill-rule="evenodd"><path d="{"".join(parts)}"/></svg>\n'
out = root / 'src' / 'components' / 'logo-signature.svg'
out.write_text(svg)
print(f'{w}x{h}, {len(path)} tracés, {len(svg) // 1024} Ko -> {out.relative_to(root)}')
