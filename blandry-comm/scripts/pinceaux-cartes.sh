#!/bin/sh
# Textures et gestes des cartes (91 × 61 mm, fonds perdus compris)
cd "$(dirname "$0")/.." && O=livrables/print/pinceau && mkdir -p $O
python3 scripts/pinceau.py badigeon $O/badigeon-basalte.png 91 61 '#24211E' 6 55 0.03 0.012 &
python3 scripts/pinceau.py badigeon $O/badigeon-chaux.png 91 61 '#EDE7DC' 15 55 0.03 0.012 &
python3 scripts/pinceau.py badigeon $O/badigeon-verso.png 91 61 '#F1ECE3' 23 50 0.016 0.007 &
python3 scripts/pinceau.py $O/geste-ocre.png 91 61 '#A8773D' 9 '[{"path":[[-4,57],[24,55],[54,46],[89,32]],"width":8.5,"bristles":700,"taper":0.6,"dry":0.7}]' &
wait
