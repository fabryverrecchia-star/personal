"""Badigeons du présentoir (gabarit Pocket Display A5, 358,4 × 412,6 mm + 5 mm de fond perdu), 203 ppi."""
import sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
import pinceau
from multiprocessing import Process
O = 'livrables/print/presentoir/'
jobs = [
    # panneau A5 et son fond perdu : badigeon basalte
    (O + 'badigeon-basalte.png', 370, 226, '#24211E', 6, 300, 0.03, 8, 0.012, 1.6),
    # poche, flancs et bandes : badigeon de chaux
    (O + 'badigeon-chaux.png', 370, 208, '#EDE7DC', 15, 290, 0.03, 8, 0.012, 1.6),
]
ps = [Process(target=pinceau.wash, args=j[:8], kwargs={'relief': j[8], 'scale': j[9]}) for j in jobs]
[p.start() for p in ps]; [p.join() for p in ps]
