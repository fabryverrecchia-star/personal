"""Convertit les polices de brand/fonts (.ttf) en .woff2 allégées dans public/fonts.
Usage : python3 scripts/build-fonts.py"""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
src, out = root / 'brand' / 'fonts', root / 'public' / 'fonts'
out.mkdir(parents=True, exist_ok=True)
# Latin + latin étendu (accents français et italiens), ponctuation, symboles monétaires
unicodes = '*U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212,U+2215'.lstrip('*')
for ttf in sorted(src.glob('*.ttf')):
    font = TTFont(ttf)
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=subset.parse_unicodes(unicodes))
    sub.subset(font)
    dest = out / (ttf.stem + '.woff2')
    font.flavor = 'woff2'
    font.save(dest)
    print(f'{dest.name}: {ttf.stat().st_size // 1024} Ko -> {dest.stat().st_size // 1024} Ko')
