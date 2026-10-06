# Agata Pizzeria · Smart menu

Menu QR code mobile-first, en 7 langues (FR, EN, IT, ES, DE, RU, AR), publié en artefact :
https://claude.ai/artifact/Qd8f17T17fLAgei45hMd9T

- `index.html` : la page publiée (images intégrées en WebP).
- `src/` : sources. `python3 build.py` (depuis `src/`) régénère `agata-menu.html` à partir de
  `template.html`, `app.js`, `data_food.py`, `data_bar.py`, `assets.json` (tracés SVG de la DA) et `images.json`.

Les modifications courantes se font directement dans la page : mode édition via `#admin` à la fin
du lien, ou cinq tapotements rapides sur le sceau rond en pied de page.
