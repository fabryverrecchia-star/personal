"""Génère les assets web dans public/ à partir des sources de brand/.

- brand/fonts/*      -> public/fonts/*.woff2 (sous-ensembles latin / cyrillique)
- brand/photos/*     -> public/media/photos/*.webp (1600 px max)
- brand/logos/*.png  -> public/media/logos/*.png (rognés, blancs)
- brand/logos/soundslike.svg -> public/media/logos/soundslike.svg

Usage : pip install fonttools brotli pillow && python3 scripts/build-assets.py
"""
import shutil
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "brand"
PUBLIC = ROOT / "public"

LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-2199,U+2212"
CYRILLIC = "U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116"

FONTS = [
    # source, sortie, plages
    ("Agrandir-Variable.ttf", "agrandir.woff2", LATIN),
    ("Apoc-Light.ttf", "apoc-light.woff2", LATIN + "," + CYRILLIC),
    ("Apoc-Hairline.ttf", "apoc-hairline.woff2", LATIN + "," + CYRILLIC),
    ("Apoc-HairlineItalic.ttf", "apoc-hairline-italic.woff2", LATIN + "," + CYRILLIC),
    ("Apoc-LightItalic.otf", "apoc-light-italic.woff2", LATIN + "," + CYRILLIC),
]


def parse_ranges(spec: str) -> list[int]:
    codes: list[int] = []
    for part in spec.split(","):
        a, _, b = part.removeprefix("U+").partition("-")
        codes.extend(range(int(a, 16), int(b.removeprefix("U+") or a, 16) + 1))
    return codes


def build_fonts() -> None:
    out = PUBLIC / "fonts"
    out.mkdir(parents=True, exist_ok=True)
    for src, dst, ranges in FONTS:
        font = TTFont(BRAND / "fonts" / src)
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["kern", "liga", "calt", "locl", "mark", "mkmk", "ccmp", "case", "ss01"]
        options.name_IDs = ["*"]
        options.notdef_outline = True
        sub = subset.Subsetter(options)
        sub.populate(unicodes=parse_ranges(ranges))
        sub.subset(font)
        font.flavor = "woff2"
        font.save(out / dst)
        print(f"{dst:32} {(out / dst).stat().st_size / 1024:7.1f} Ko")


def build_images(folder: str, max_size: int, quality: int) -> None:
    out = PUBLIC / "media" / folder
    out.mkdir(parents=True, exist_ok=True)
    for src in sorted((BRAND / folder).iterdir()):
        im = Image.open(src).convert("RGB")
        im.thumbnail((max_size, max_size), Image.LANCZOS)
        dst = out / (src.stem + ".webp")
        im.save(dst, "WEBP", quality=quality, method=6)
        print(f"{folder}/{dst.name:30} {im.size[0]}x{im.size[1]}  {dst.stat().st_size / 1024:6.1f} Ko")


def build_logos() -> None:
    out = PUBLIC / "media" / "logos"
    out.mkdir(parents=True, exist_ok=True)
    for src in sorted((BRAND / "logos").glob("*.png")):
        if src.stem == "soundslike":
            continue
        im = Image.open(src).convert("RGBA")
        im = im.crop(im.getbbox())
        # Force le blanc pur : seul l'alpha porte la forme
        white = Image.new("RGBA", im.size, (255, 255, 255, 0))
        white.putalpha(im.getchannel("A"))
        white.save(out / src.name, optimize=True)
        print(f"logos/{src.name:30} {im.size[0]}x{im.size[1]}")
    shutil.copy(BRAND / "logos" / "soundslike.svg", out / "soundslike.svg")


if __name__ == "__main__":
    build_fonts()
    build_images("photos", 1600, 78)
    build_logos()
