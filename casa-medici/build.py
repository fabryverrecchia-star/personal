"""Assemble index.html : insère les SVG de la marque dans src/index.html."""
import re, pathlib
here = pathlib.Path(__file__).parent
svgdir = here / "assets/svg"
raw = {n: (svgdir / f"{n}.svg").read_text() for n in ["emblem", "horizontal", "horizontal_flower", "stacked"]}

def paths(svg): return re.findall(r'<path d="[^"]*"/>', svg)
def wrap(vb, body, extra=""):
    return f'<svg viewBox="{vb}" fill="currentColor" aria-hidden="true" focusable="false"{extra}>{body}</svg>'
def inline(svg):
    vb = re.search(r'viewBox="([^"]+)"', svg).group(1)
    return wrap(vb, "".join(paths(svg)))

emb = paths(raw["emblem"])
stk = paths(raw["stacked"])
svgs = {
    "emblem": inline(raw["emblem"]),
    "horizontal": inline(raw["horizontal"]),
    "horizontal_raw": inline(raw["horizontal"]),
    "horizontal_flower": inline(raw["horizontal_flower"]),
    "stacked": wrap("0 0 452.28 250", "".join(stk[:-2])),
    "flower": wrap("234 249.3 63.6 69.5", "".join(stk[-2:])),
    "emblem_free": wrap("37.5 39.2 116.5 180", emb[1]),
    "emblem_ring": wrap("0 0 191.39 251.6", emb[0].replace("<path ", '<path fill="#dccfc9" ') + emb[1]),
}
src = (here / "src/index.html").read_text()
src = re.sub(r"<!--SVG:(\w+)-->", lambda m: svgs[m.group(1)], src)
src = re.sub(r"<!--PATHS:(\w+)-->", lambda m: "".join(paths(raw[m.group(1)])), src)
src = re.sub(r"<!--RAW:(\w+)-->", lambda m: raw[m.group(1)], src)
assert "<!--SVG" not in src and "<!--RAW" not in src
(here / "index.html").write_text(src)
print("index.html", len(src) // 1024, "KB")
