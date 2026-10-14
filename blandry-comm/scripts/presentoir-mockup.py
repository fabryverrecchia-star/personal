"""Vue de face du présentoir monté (panneau, cartes dans la poche, façade)."""
import pymupdf as f
from PIL import Image, ImageDraw, ImageFilter
O = 'livrables/print/presentoir/'
PX = 6  # px par mm
mm = 72 / 25.4
art = f.open(O + 'presentoir-art.pdf')[0]
def crop(x0, y0, x1, y1):
    pm = art.get_pixmap(dpi=round(PX * 25.4), clip=f.Rect(x0 * mm, y0 * mm, x1 * mm, y1 * mm))
    return Image.frombytes('RGB', (pm.width, pm.height), pm.samples)
def rounded(im, r, corners=(1, 1, 1, 1)):
    m = Image.new('L', im.size, 0); d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255, corners=corners)
    im = im.convert('RGBA'); im.putalpha(m); return im
def shadow(im, off, blur, op):
    s = Image.new('RGBA', (im.width + blur * 4, im.height + blur * 4), (0, 0, 0, 0))
    a = im.split()[3].point(lambda v: v * op)
    s.paste(Image.new('RGBA', im.size, (40, 32, 24, 255)), (blur * 2, blur * 2), a)
    return s.filter(ImageFilter.GaussianBlur(blur)), (off[0] - blur * 2, off[1] - blur * 2)

W, H = 1500, 1700
scene = Image.new('RGBA', (W, H))
g = ImageDraw.Draw(scene)
for y in range(H):  # mur clair et plan de comptoir
    t = y / H
    c = (int(236 - 22 * t), int(231 - 22 * t), int(223 - 24 * t)) if y < 1450 else (int(206 - 30 * (y - 1450) / 250), int(198 - 30 * (y - 1450) / 250), int(186 - 30 * (y - 1450) / 250))
    g.line([(0, y), (W, y)], fill=c + (255,))
floor = 1480
pan = rounded(crop(103.7, 5.4, 254.2, 215.3), 8 * PX, (1, 1, 0, 0))
px0 = (W - pan.width) // 2; py0 = floor - pan.height
sh, so = shadow(pan, (px0 + 26, py0 + 10), 28, .45); scene.alpha_composite(sh, so)
scene.alpha_composite(pan, (px0, py0))

# cartes de visite dans la poche (rognées au format fini)
carte = f.open('livrables/print/impression/carte-visite-recto-89x59mm-fonds-perdus-2mm.pdf')[0]
pm = carte.get_pixmap(dpi=round(PX * 25.4), clip=f.Rect(2 * mm, 2 * mm, 87 * mm, 57 * mm))
c = rounded(Image.frombytes('RGB', (pm.width, pm.height), pm.samples), 2)
cx = (W - c.width) // 2
for k, (dx, dy) in enumerate([(-14, 30), (10, 15), (0, 0)]):
    y = floor - int(96 * PX) + dy
    s2, o2 = shadow(c, (cx + dx + 6, y + 8), 10, .35); scene.alpha_composite(s2, o2)
    scene.alpha_composite(c, (cx + dx, y))

# flancs : liseré de carton visible de chaque côté de la façade
fac = crop(125, 339.3, 233.2, 407.3)
fx0 = (W - fac.width) // 2; fy0 = floor - fac.height + 14
s3, o3 = shadow(fac.convert('RGBA'), (fx0, fy0 + 16), 22, .5); scene.alpha_composite(s3, o3)
scene.alpha_composite(fac.convert('RGBA'), (fx0, fy0))
scene.convert('RGB').save(O + 'mockup-presentoir-face.jpg', quality=90)
print('ok')
