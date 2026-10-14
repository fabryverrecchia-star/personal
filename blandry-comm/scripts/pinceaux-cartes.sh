#!/bin/sh
# Génère les coups de pinceau des cartes (91 × 61 mm, fonds perdus compris)
cd "$(dirname "$0")/.." && O=livrables/print/pinceau
python3 scripts/pinceau.py $O/p1-recto.png 91 61 '#A8773D' 5 '[{"path":[[-3,34],[28,31],[58,36],[84,32]],"width":13.5,"bristles":800}]' &
python3 scripts/pinceau.py $O/p2-recto.png 91 61 '#ECE6DA' 8 '[{"path":[[-3,27],[24,24],[50,29],[74,25]],"width":21,"bristles":1100}]' &
python3 scripts/pinceau.py $O/p3-recto.png 91 61 '#2A2724' 12 '[{"path":[[-3,42],[30,39],[60,44],[90,39]],"width":17,"bristles":1000}]' &
python3 scripts/pinceau.py $O/verso.png 91 61 '#A8773D' 21 '[{"path":[[5,31],[22,29.6],[42,31.8],[61,30]],"width":9.5,"bristles":600}]' &
wait
