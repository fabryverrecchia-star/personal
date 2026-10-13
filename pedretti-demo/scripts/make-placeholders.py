"""Génère 8 visuels de remplacement (style « plan de film ») dans ../images.
À remplacer par les vraies images des projets (mêmes noms de fichiers)."""
import math, random, pathlib
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = pathlib.Path(__file__).resolve().parent.parent / "images"
OUT.mkdir(exist_ok=True)
W, H = 1200, 750

PALETTES = [
    ("#1b1f3b", "#f26b38", "#ffd29d"),
    ("#0f2f2f", "#5fb49c", "#f2e8cf"),
    ("#2b0f1e", "#e63946", "#f1c0b9"),
    ("#10213a", "#3a86ff", "#ffbe0b"),
    ("#2a1a0f", "#d4a373", "#fefae0"),
    ("#1a1a1a", "#8d99ae", "#edf2f4"),
    ("#301934", "#ff70a6", "#ffd670"),
    ("#0b3d2e", "#ffb703", "#fb8500"),
]

def hex2rgb(h):
    h = h.lstrip("#"); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

try:
    FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
except OSError:
    FONT = ImageFont.load_default()

for n, (c0, c1, c2) in enumerate(PALETTES, 1):
    rnd = random.Random(n * 97)
    a, b, c = hex2rgb(c0), hex2rgb(c1), hex2rgb(c2)
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=lerp(a, b, min(1, t * 1.4)))
    # soleil / projecteur
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy, r = rnd.randint(250, 950), rnd.randint(220, 380), rnd.randint(90, 160)
    for k in range(40, 0, -1):
        rr = r * (1 + k / 12)
        col = lerp((0, 0, 0), c, 0.5 * (1 - k / 40) ** 2)
        gd.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=col)
    img = Image.blend(img, Image.composite(glow, img, glow.convert("L")), 0.6)
    d = ImageDraw.Draw(img)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)
    # collines en silhouettes
    for layer in range(4):
        base = 430 + layer * 70
        col = lerp(b, a, 0.35 + layer * 0.2)
        pts = [(0, H)]
        ph, amp, fr = rnd.random() * 6, 30 + rnd.random() * 50, 0.004 + rnd.random() * 0.006
        for x in range(0, W + 20, 20):
            pts.append((x, base + math.sin(x * fr + ph) * amp + math.sin(x * fr * 3.1) * amp * 0.3))
        pts.append((W, H))
        d.polygon(pts, fill=col)
    # grain
    noise = Image.effect_noise((W, H), 40).convert("RGB")
    img = Image.blend(img, noise, 0.06).filter(ImageFilter.GaussianBlur(0.6))
    d = ImageDraw.Draw(img)
    d.text((40, H - 50), f"PLACEHOLDER · PROJET {n:02d}", fill=c, font=FONT)
    img.save(OUT / f"projet-{n:02d}.jpg", quality=82, optimize=True)
    print("ok", n)
