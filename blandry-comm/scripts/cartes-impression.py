"""Carte retenue : fichiers imprimeur 89 × 59 mm (85 × 55 + 2 mm de fonds perdus), sans repères, échelle 1:1."""
import pymupdf as f
mm = 72 / 25.4
D = 'livrables/print/'
both = f.open()
for face in ['recto', 'verso']:
    src = f.open(f'{D}cartes/carte-visite-badigeon-eventail-{face}.pdf')
    out = f.open()
    for doc in (out, both):
        pg = doc.new_page(width=89 * mm, height=59 * mm)
        pg.show_pdf_page(pg.rect, src, 0, clip=f.Rect(mm, mm, 90 * mm, 60 * mm))
    out.save(f'{D}impression/carte-visite-{face}-89x59mm-fonds-perdus-2mm.pdf', garbage=3, deflate=True)
both.save(f'{D}impression/carte-visite-recto-verso-89x59mm-fonds-perdus-2mm.pdf', garbage=3, deflate=True)
print('ok')
