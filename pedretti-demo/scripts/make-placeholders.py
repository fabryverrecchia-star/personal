"""Génère un visuel d'attente (style « plan de film ») pour chaque projet du
tableau PROJECTS de ../index.html. Remplacez ensuite chaque fichier de images/
par la vraie image du projet, sous le même nom."""
import math, random, re, pathlib
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "images"
OUT.mkdir(exist_ok=True)
W, H = 1200, 750

src = (ROOT / "index.html").read_text(encoding="utf-8")
PROJECTS = re.findall(r'img: "images/([^"]+)",\s*title: "([^"]+)"', src)

PALETTES = [
    ("#1b1f3b", "#f26b38", "#ffd29d"), ("#0f2f2f", "#5fb49c", "#f2e8cf"),
    ("#2b0f1e", "#e63946", "#f1c0b9"), ("#10213a", "#3a86ff", "#ffbe0b"),
    ("#2a1a0f", "#d4a373", "#fefae0"), ("#1a1a1a", "#8d99ae", "#edf2f4"),
    ("#301934", "#ff70a6", "#ffd670"), ("#0b3d2e", "#ffb703", "#fb8500"),
]

def hex2rgb(h):
    h = h.lstrip("#"); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def font(size):
    try:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size)
    except OSError:
        return ImageFont.load_default()

for n, (fname, title) in enumerate(PROJECTS):
    rnd = random.Random(n * 97 + 5)
    a, b, c = (hex2rgb(x) for x in PALETTES[n % len(PALETTES)])
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=lerp(a, b, min(1, y / H * 1.4)))
    glow = Image.new("RGB", (W, H))
    gd = ImageDraw.Draw(glow)
    cx, cy, r = rnd.randint(250, 950), rnd.randint(200, 360), rnd.randint(80, 150)
    for k in range(40, 0, -1):
        rr = r * (1 + k / 12)
        gd.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=lerp((0, 0, 0), c, 0.5 * (1 - k / 40) ** 2))
    img = Image.blend(img, Image.composite(glow, img, glow.convert("L")), 0.6)
    d = ImageDraw.Draw(img)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)
    for layer in range(4):
        base = 430 + layer * 70
        pts = [(0, H)]
        ph, amp, fr = rnd.random() * 6, 30 + rnd.random() * 50, 0.004 + rnd.random() * 0.006
        for x in range(0, W + 20, 20):
            pts.append((x, base + math.sin(x * fr + ph) * amp + math.sin(x * fr * 3.1) * amp * 0.3))
        pts.append((W, H))
        d.polygon(pts, fill=lerp(b, a, 0.35 + layer * 0.2))
    noise = Image.effect_noise((W, H), 40).convert("RGB")
    img = Image.blend(img, noise, 0.06).filter(ImageFilter.GaussianBlur(0.6))
    d = ImageDraw.Draw(img)
    d.text((40, H - 92), title.upper(), fill=c, font=font(34))
    d.text((40, H - 46), "VISUEL À VENIR", fill=c, font=font(18))
    img.save(OUT / fname, quality=80, optimize=True)
    print("ok", fname)
