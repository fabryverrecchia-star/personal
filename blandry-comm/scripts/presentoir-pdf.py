"""Assemble le présentoir : fichier imprimeur (visuel + ligne verte du fond perdu, comme demandé par le gabarit),
contrôle avec toutes les lignes du gabarit, et aperçus."""
import pymupdf as f
O = 'livrables/print/presentoir/'
art = f.open(O + 'presentoir-art.pdf')
gab = f.open('templates/gabarit-pocket-display-a5.pdf')
W, H = gab[1].rect.width, gab[1].rect.height

# 1. Fichier imprimeur : visuel 1:1 + ligne verte seule
imp = f.open(); pg = imp.new_page(width=W, height=H)
pg.show_pdf_page(pg.rect, art, 0)
for d in gab[1].get_drawings():
    if tuple(round(v, 2) for v in (d.get('color') or ())) == (0.0, 0.65, 0.32):
        sh = pg.new_shape()
        for it in d['items']:
            if it[0] == 'l': sh.draw_line(it[1], it[2])
            elif it[0] == 'c': sh.draw_bezier(it[1], it[2], it[3], it[4])
            elif it[0] == 're': sh.draw_rect(it[1])
        sh.finish(color=d['color'], width=d.get('width') or 1, closePath=False); sh.commit()
imp.save(O + 'presentoir-pocket-display-A5-impression.pdf', garbage=3, deflate=True)

# 2. Contrôle : visuel + toutes les lignes du gabarit (coupe, plis, zones de sécurité)
ctl = f.open(); pc = ctl.new_page(width=W, height=H)
pc.show_pdf_page(pc.rect, art, 0)
pc.show_pdf_page(pc.rect, gab, 1, overlay=True)
ctl.save(O + 'presentoir-controle-avec-gabarit.pdf', garbage=3, deflate=True)
pc.get_pixmap(dpi=40).save(O + 'presentoir-controle-apercu.png')
pg.get_pixmap(dpi=40).save(O + 'presentoir-impression-apercu.png')
print('ok', round(W / 72 * 25.4, 1), 'x', round(H / 72 * 25.4, 1), 'mm')
