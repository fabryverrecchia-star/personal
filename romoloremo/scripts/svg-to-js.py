"""Génère js/paths.js à partir des SVG extraits du PDF (assets/*.svg)."""
import json, re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
out = {}
for name in ["pictogram", "logotype", "monogram", "key"]:
    svg = (root / "assets" / f"{name}.svg").read_text()
    vb = re.search(r'viewBox="([^"]+)"', svg).group(1).split()
    paths = [{"d": d, "rule": r} for r, d in re.findall(r'fill-rule="(\w+)" d="([^"]+)"', svg)]
    out[name] = {"w": float(vb[2]), "h": float(vb[3]), "paths": paths}
(root / "js" / "paths.js").write_text(
    "/* Généré par scripts/svg-to-js.py — tracés vectoriels issus du brandbook */\n"
    "window.RR_PATHS = " + json.dumps(out, separators=(",", ":")) + ";\n")
print({k: len(v["paths"]) for k, v in out.items()})
