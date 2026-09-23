# Polices web (générées)

Ne pas modifier à la main : ces fichiers sont produits par `scripts/build-fonts.py`
à partir des sources de `brand/fonts/`.

| Fichier | Source | Rôle | Poids |
|---|---|---|---|
| `CormorantGaramond-Light.woff2` / `-LightItalic.woff2` | Cormorant Garamond Light 300 (OFL, Fontsource) | Grands titres | ~22 Ko chacune |
| `EBGaramond-Roman.woff2` | EB Garamond (variable 400–800) | Texte courant | ~61 Ko |
| `EBGaramond-Italic.woff2` | EB Garamond Italic (variable 400–800) | Mots mis en valeur (`<em>`, `*texte*`) | ~69 Ko |
| `AGaramond-Swash.woff2` | Adobe Garamond Italic Alternate | Capitales ornées A–Z et &, fleuron (« 1 ») | ~12 Ko |
| `AGaramond-SemiboldItalicOsF.woff2` | Adobe Garamond Semibold Italic OsF | Chiffres elzéviriens (compteur, index, années) | ~5 Ko |

Sources : 1,8 Mo → polices web : ~150 Ko. Chaque fichier ne se charge que si la page en a besoin (`unicode-range`).
