"""Génère les polices web (.woff2, sous-ensemble latin) dans public/fonts/.

Sources : brand/fonts/*.ttf
Usage   : pip install fonttools brotli && python3 scripts/build-fonts.py
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "brand" / "fonts"
OUT = ROOT / "public" / "fonts"

# Latin de base + Latin-1 + ponctuation typographique, €, flèches
LATIN = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
    "U+2000-206F,U+20AC,U+2122,U+2190-2199,U+2212,U+2215,U+FEFF,U+FFFD"
)


# Fonctionnalités OpenType conservées (le reste — hist, dlig, ss0x… — alourdit pour rien)
FEATURES = [
    "kern", "liga", "clig", "calt", "locl", "mark", "mkmk", "ccmp",
    "onum", "lnum", "pnum", "tnum", "frac", "case", "smcp", "c2sc", "swsh",
]


def parse_ranges(spec: str) -> list[int]:
    codes: list[int] = []
    for part in spec.split(","):
        a, _, b = part.removeprefix("U+").partition("-")
        codes.extend(range(int(a, 16), int(b.removeprefix("U+") or a, 16) + 1))
    return codes


def build(src: str, out: str, unicodes: str, repair: bool = False) -> None:
    font = TTFont(SRC / src)
    if repair:
        # Anciennes polices Adobe : tables refusées par les navigateurs (OTS)
        if "kern" in font.reader and len(font.reader["kern"]) < 4:
            del font["kern"]  # table vide
        font["post"].formatType = 3.0
        font["cmap"].tables = [t for t in font["cmap"].tables if t.platformID == 3]
        if "Italic" in src:
            font["OS/2"].fsSelection = (font["OS/2"].fsSelection & ~0b1000000) | 0b1
            font["head"].macStyle |= 0b10

    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = FEATURES
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=parse_ranges(unicodes))
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(OUT / out)
    print(f"{out:45} {(OUT / out).stat().st_size / 1024:7.1f} Ko")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    build("EBGaramond-VariableFont_wght.ttf", "EBGaramond-Roman.woff2", LATIN)
    build("EBGaramond-Italic-VariableFont_wght.ttf", "EBGaramond-Italic.woff2", LATIN)
    build("Adobe Garamond Italic Alternate.ttf", "AGaramond-Swash.woff2", "U+0026,U+0031,U+0041-005A", repair=True)
    build(
        "Adobe Garamond Semibold Italic Oldstyle Figures.ttf",
        "AGaramond-SemiboldItalicOsF.woff2",
        "U+0020,U+0028-0029,U+002B-003A",  # chiffres + ponctuation associée
        repair=True,
    )
