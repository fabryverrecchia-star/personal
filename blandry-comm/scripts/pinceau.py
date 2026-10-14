"""Coup de pinceau réaliste (raster haute définition, fond transparent).
Chaque poil dépose la peinture le long du trajet ; sa charge s'épuise, ce qui
donne la brosse sèche en fin de trait. Un relief (empâtement) est éclairé en rasant.
Usage : python3 scripts/pinceau.py sortie.png largeur_mm hauteur_mm couleur graine [options json]
"""
import sys, json, math
import numpy as np
from PIL import Image, ImageFilter

PX = 24  # pixels par mm (≈ 610 dpi)

def smooth_noise(n, scale, rng):
    # bruit lissé (sans angles) : bruit blanc filtré par une gaussienne
    sig = max(1.0, scale / 2.5)
    r = int(sig * 3)
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sig) ** 2)
    v = np.convolve(rng.standard_normal(n + 2 * r), k / np.sqrt((k ** 2).sum()), 'valid')
    return v[:n]

def bezier(p, t):
    p0, p1, p2, p3 = [np.array(q, float) for q in p]
    mt = 1 - t
    pos = (mt**3)[:, None] * p0 + (3 * mt**2 * t)[:, None] * p1 + (3 * mt * t**2)[:, None] * p2 + (t**3)[:, None] * p3
    d = (3 * mt**2)[:, None] * (p1 - p0) + (6 * mt * t)[:, None] * (p2 - p1) + (3 * t**2)[:, None] * (p3 - p2)
    return pos, d

def stroke(canvas, h, path, width, rng, bristles=520, load=(0.75, 1.35), dry=0.55, taper=0.45):
    H, W = canvas.shape
    steps = int(np.linalg.norm(np.array(path[3]) - np.array(path[0])) * PX * 1.6)
    t = np.linspace(0, 1, steps)
    pos, d = bezier([(x * PX, y * PX) for x, y in path], t)
    d /= np.linalg.norm(d, axis=1)[:, None]
    nrm = np.stack([-d[:, 1], d[:, 0]], 1)
    # largeur : attaque arrondie, léger gonflement, fin effilée
    # brosse plate : attaque nette, largeur presque constante, légère ouverture à la fin
    lift = np.clip((t - 0.82) / 0.18, 0, 1) ** 2
    prof = np.clip(t / 0.025, 0.55, 1) * (1 + 0.05 * smooth_noise(steps, steps / 3, rng)) * (1 + 0.1 * t) * (1 - taper * lift)
    wob_all = smooth_noise(steps, steps / 2.5, rng) * 0.012
    # bords irréguliers, différents en haut et en bas
    edge_a = 1 + 0.035 * smooth_noise(steps, steps / 4, rng) + 0.008 * smooth_noise(steps, steps / 40, rng)
    edge_b = 1 + 0.035 * smooth_noise(steps, steps / 4, rng) + 0.008 * smooth_noise(steps, steps / 40, rng)
    for b in range(bristles):
        u = rng.uniform(-1, 1)
        u_eff = u
        wob = smooth_noise(steps, steps / rng.uniform(4, 10), rng) * 0.006
        off = (u_eff * 0.5 * (edge_a if u < 0 else edge_b) + wob + wob_all) * width * PX * prof
        L0 = rng.uniform(*load) * (1 - 0.35 * abs(u) ** 3)
        start = 0.008 * u ** 2 + abs(rng.normal(0, 0.006))  # attaque légèrement arrondie  # chaque poil touche le mur à un instant légèrement différent
        # épuisement de la charge + accrocs aléatoires (brosse sèche)
        decay = (np.cumsum(rng.uniform(0.6, 1.4, steps)) / steps) ** 1.25
        charge = L0 - decay * rng.uniform(0.7, 1.2) * (1 + dry * abs(u))
        skip = smooth_noise(steps, steps / rng.uniform(15, 50), rng) > (1.55 - dry * t * 2.2 - 0.9 * abs(u) ** 5)
        t_end = 1 - abs(rng.normal(0, 0.09)) * (0.6 + abs(u))
        on = (charge > 0) & ~skip & (t > start) & (t < t_end)
        if not on.any():
            continue
        x = pos[:, 0] + nrm[:, 0] * off
        y = pos[:, 1] + nrm[:, 1] * off
        th = rng.uniform(0.8, 2.2)  # épaisseur du poil en px
        amt = np.clip(charge, 0, 1) ** 0.6 * rng.uniform(0.55, 1.0)
        ridge = rng.uniform(0.05, 0.9) ** 2  # certains poils laissent un sillon plus épais
        xi = np.round(x[on]).astype(int); yi = np.round(y[on]).astype(int); a = amt[on]
        for dx in range(-int(th), int(th) + 1):
            for dy in range(-int(th), int(th) + 1):
                xx, yy = xi + dx, yi + dy
                m = (xx >= 0) & (xx < W) & (yy >= 0) & (yy < H)
                np.add.at(canvas, (yy[m], xx[m]), a[m] * 0.35)
                np.add.at(h, (yy[m], xx[m]), a[m] * ridge)

def render(out, w_mm, h_mm, color, seed, strokes, light=(-0.6, -0.8)):
    rng = np.random.default_rng(seed)
    H, W = int(h_mm * PX), int(w_mm * PX)
    canvas = np.zeros((H, W), np.float32); hgt = np.zeros((H, W), np.float32)
    for s in strokes:
        stroke(canvas, hgt, s['path'], s['width'], rng, s.get('bristles', 520), tuple(s.get('load', (0.75, 1.35))), s.get('dry', 0.55), s.get('taper', 0.45))
    a = Image.fromarray(np.clip(canvas * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.9))
    alpha = np.asarray(a, np.float32) / 255
    alpha = np.clip((alpha - 0.08) / 0.55, 0, 1) ** 0.8
    # relief : la peinture accrochée par la lumière rasante
    hm = np.asarray(Image.fromarray(np.clip(hgt * 60, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.3)), np.float32) / 255
    gy, gx = np.gradient(hm)
    shade = np.clip(-(gx * light[0] + gy * light[1]) * 5, -0.14, 0.14)
    # variations de teinte le long des poils
    streak = np.asarray(Image.fromarray(np.clip(canvas * 90, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255
    base = np.array([int(color[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255
    m = alpha > 0.5
    tone = 1 + shade + (streak - (streak[m].mean() if m.any() else 0)) * 0.35
    tone = tone - (tone[m].mean() - 1 if m.any() else 0)
    rgb = np.clip(base[None, None, :] * tone[..., None] + np.clip(shade, 0, None)[..., None] * 0.12, 0, 1)
    img = np.dstack([rgb, alpha[..., None]])
    Image.fromarray((img * 255).astype(np.uint8), 'RGBA').save(out, dpi=(PX * 25.4, PX * 25.4))

def hexrgb(c):
    return np.array([int(c[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255

def wash(out, w_mm, h_mm, base, seed, n=70, spread=0.06, px=20, relief=0.014, scale=1.0):
    """Badigeon à la chaux : passes croisées, chacune un peu plus claire ou plus foncée."""
    global PX
    PX = px
    rng = np.random.default_rng(seed)
    H, W = int(h_mm * PX), int(w_mm * PX)
    b = hexrgb(base)
    img = np.ones((H, W, 3), np.float32) * b
    hsum = np.zeros((H, W), np.float32)
    for i in range(n):
        ang = rng.choice([-1, 1]) * rng.uniform(25, 55) * math.pi / 180  # geste en X du badigeon
        L = rng.uniform(25, 60) * scale; cx, cy = rng.uniform(-5, w_mm + 5), rng.uniform(-5, h_mm + 5)
        dx, dy = math.cos(ang) * L / 2, math.sin(ang) * L / 2
        bend = rng.normal(0, 4) * scale
        path = [(cx - dx, cy - dy), (cx - dx / 3 - dy * bend / L, cy - dy / 3 + dx * bend / L), (cx + dx / 3 - dy * bend / L, cy + dy / 3 + dx * bend / L), (cx + dx, cy + dy)]
        wd = rng.uniform(9, 16) * scale
        # toile locale autour du trait (rapide même sur un grand format)
        m = wd + 6
        x0 = max(0, int((min(q[0] for q in path) - m) * PX)); x1 = min(W, int((max(q[0] for q in path) + m) * PX))
        y0 = max(0, int((min(q[1] for q in path) - m) * PX)); y1 = min(H, int((max(q[1] for q in path) + m) * PX))
        if x1 <= x0 or y1 <= y0:
            continue
        c = np.zeros((y1 - y0, x1 - x0), np.float32); hh = np.zeros_like(c)
        stroke(c, hh, [(q[0] - x0 / PX, q[1] - y0 / PX) for q in path], wd, rng, 260, (0.5, 1.1), 0.9, 0.5)
        a = np.asarray(Image.fromarray(np.clip(c * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3.5 * PX / 20)), np.float32) / 255
        a = np.clip(a * 1.3, 0, 1) ** 1.2 * rng.uniform(0.3, 0.6)
        tint = b + rng.normal(0, spread) + rng.normal(0, spread * 0.08, 3)  # écart absolu : marche aussi sur fond sombre
        reg = img[y0:y1, x0:x1]
        img[y0:y1, x0:x1] = reg * (1 - a[..., None]) + np.clip(tint, 0, 1)[None, None, :] * a[..., None]
        hsum[y0:y1, x0:x1] += hh
    hm = np.asarray(Image.fromarray(np.clip(hsum * 25, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6)), np.float32) / 255
    gy, gx = np.gradient(hm)
    shade = np.clip(-(gx * -0.6 + gy * -0.8) * 2, -relief, relief)
    grain = rng.normal(0, 0.01, (H, W)).astype(np.float32)
    # nuages du badigeon : variations douces à grande échelle
    lo = rng.normal(0, 1, (H // 40 + 2, W // 40 + 2)).astype(np.float32)
    cloud = np.asarray(Image.fromarray(((lo - lo.min()) / (np.ptp(lo) + 1e-6) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(PX * 2)), np.float32) / 255
    grain += (cloud - cloud.mean()) * spread * 1.2 / max(b.mean(), 0.2)
    img = np.clip(img * (1 + grain)[..., None] + shade[..., None], 0, 1)  # relief en valeur absolue : visible aussi sur le sombre
    Image.fromarray((img * 255).astype(np.uint8), 'RGB').save(out, dpi=(PX * 25.4, PX * 25.4))

if __name__ == '__main__':
    if sys.argv[1] == 'badigeon':
        wash(sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5], int(sys.argv[6]), int(sys.argv[7]) if len(sys.argv) > 7 else 70, float(sys.argv[8]) if len(sys.argv) > 8 else 0.06, relief=float(sys.argv[9]) if len(sys.argv) > 9 else 0.014)
        sys.exit()
    out, w, h, col, seed = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4], int(sys.argv[5])
    strokes = json.loads(sys.argv[6])
    render(out, w, h, col, seed, strokes)
