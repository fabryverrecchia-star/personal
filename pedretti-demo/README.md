# Demo WebGL · Stefano Pedretti

Pagina unica in Three.js. Scorrendo, migliaia di particelle luminose arrivano a
vortice dal buio e compongono il logo (volto pixel art, « STEFANO PEDRETTI »,
« COMEDY DIRECTOR & MORE »). Poi il logo esplode attorno alla camera e si vola
in un tunnel 3D con i 17 progetti di stefanopedretti.com: le immagini si
accendono avvicinandosi e si dissolvono in particelle quando le si supera.
Alla fine il logo si ricompone.

## Avviare

Le immagini sono caricate in WebGL, serve un piccolo server locale:

```sh
cd pedretti-demo
python3 -m http.server 8000
# poi http://localhost:8000
```

## Sostituire le immagini

Le immagini in `images/` sono visual d'attesa generati da
`scripts/make-placeholders.py`, uno per progetto e con lo stesso nome del file
atteso. Per mettere le vere:

1. Sostituire ogni file di `images/` con l'immagine del progetto (16:10, ~1200 px).
2. Titoli e sottotitoli si modificano nella tabella `PROJECTS` in cima allo script di `index.html`.

## Regolazioni

- `T` in `index.html`: cronologia dello scroll (composizione, esplosione,
  tunnel, ricomposizione), in frazione della pagina.
- `#scroll { height: 1600vh }`: lunghezza totale dello scroll.
- In verticale (mobile) il logo si riorganizza: volto in alto, nome e mestiere sotto.
- Il mouse respinge le particelle del logo e illumina il progetto sorvolato;
  la velocità dello scroll allarga il campo visivo e allunga le scie.
