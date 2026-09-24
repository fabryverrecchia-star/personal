# Casa Medici — landing page

Présentation web de l’identité **Casa Medici** (ristorante, Alfortville), nouvelle maison de Daniele Tari après Vita Ristorante.
Branding & direction artistique : Fabrizio Verrecchia × Abysse Lab Paris.

## Effets

- **Loader** : le pictogramme se trace depuis le SVG (stroke → remplissage).
- **Héros WebGL** : ~15 000 particules échantillonnées depuis les SVG de la marque. Elles forment le pictogramme à l’ouverture, puis se transforment en logotype au défilement ; le SVG net prend le relais (révélation par masque).
- **Images WebGL** : révélation par dissolution bruitée avec liseré bronze, courbure selon la vitesse de défilement, ondulation au survol.
- **Construction du signe** et **logotype** : tracés SVG pilotés par le défilement.
- Défilement doux Lenis, galerie horizontale épinglée, remplissage mot à mot.

## Structure

```
casa-medici/
├── src/index.html   # source (marqueurs <!--SVG:…--> pour les logos)
├── build.py         # insère les SVG et produit index.html
├── index.html       # page finale
└── assets/
    ├── svg/         # logos vectoriels extraits du PDF de branding
    └── img/         # visuels extraits du PDF
```

## Lancer

```bash
python3 build.py
python3 -m http.server 8000   # http://localhost:8000
```
