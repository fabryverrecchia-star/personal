# Polices du site ilristorante.fr

Le site n'est **pas sur Wix** : c'est un WordPress (thème « Bazaar » de Qode, avec un thème enfant `bazaar-child`, plus WPBakery et Slider Revolution). Il n'y a donc rien sur static.parastorage.com ni sur static.wixstatic.com. Les polices personnalisées sont hébergées sur le site lui-même (`/wp-content/uploads/…` et `/wp-content/themes/bazaar/assets/fonts/`).

## Police des titres : **Salo Paolo**

C'est la serif condensée à empattements évasés de « DEVENIR FRANCHISÉ », « UNE RÉUSSITE QUI PARLE D'ELLE-MÊME », « LE RESTAURANT ITALIEN DE LILLE », etc.

- **Nom interne du fichier** (table `name`) : famille `Salo Paolo`, style `Regular`, PostScript `Salo-Paolo`, version 1.000, créée avec Glyphs 3.1.2.
- **Nom CSS** : `'Salo'`. Elle est aussi déclarée sous les noms `'salon'` et `SAlon` par le plugin Fonts Plugin et par `theme.json`.
- **Source** : https://www.ilristorante.fr/wp-content/uploads/2026/06/salo-paolo.ttf
- **Fichier local** : `fonts/salo-paolo.ttf`
- **Éléments concernés** : `h1, .titre-restaurant { font-family: 'Salo', serif !important; }`. La règle se trouve dans `<style id="wp-custom-css">` (CSS additionnel WordPress), sur toutes les pages. Sur la page franchise, les titres de section sont des `<h1 class="qodef-st-title">`. Sur les pages restaurants, c'est le `<h1>` « LE RESTAURANT ITALIEN DE … ».
- Les deux déclarations de cette police sur le site ont des défauts :
  - Dans le `@font-face` du CSS additionnel, la première URL a un guillemet mal fermé (`url(https://…/salo-paolo.ttf') format('woff2')`). C'est la deuxième URL, `format('woff')`, qui est réellement chargée.
  - Le format annoncé est faux dans les deux déclarations : le fichier est un TTF, mais il est déclaré en `woff2` et `woff` dans le CSS additionnel, et en `woff` dans la déclaration `'salon'` du Fonts Plugin.

```css
@font-face {
    font-family: 'Salo';
    src: url(https://www.ilristorante.fr/wp-content/uploads/2026/06/salo-paolo.ttf') format('woff2'),
         url(https://www.ilristorante.fr/wp-content/uploads/2026/06/salo-paolo.ttf) format('woff');
}
h1, .titre-restaurant { font-family: 'Salo', serif !important; }
```

## Autres polices personnalisées (toutes téléchargées dans `fonts/`)

| Famille CSS | Fichier(s) | URL source | Éléments concernés |
|---|---|---|---|
| `Quentin` (police script du thème Bazaar) | `quentin.ttf` | https://www.ilristorante.fr/wp-content/themes/bazaar/assets/fonts/quentin.ttf | `h2 { font-family: Quentin,serif !important; }` (CSS du thème enfant, inline), `.qodef-st-subtitle` (sous-titres de section, 40px), `.qodef-iwt-text`, le bouton « avis » du pied de page (`#btnavis`), titre de la page 404 |
| `inter` | `inter-regular.ttf`, `inter-medium.ttf`, `inter-semibold.ttf`, `inter-italic.ttf` (Inter 4.001, The Inter Project Authors) | https://www.ilristorante.fr/wp-content/uploads/2026/06/inter-regular.ttf (et `-medium`, `-semibold`, `-italic`) | Classe `.has-inter-font-family` (Fonts Plugin / éditeur de blocs). Les 4 fichiers sont déclarés dans un seul `@font-face`, avec de faux formats |
| `mea-culpa` / `Mea culpa` | `meaculpa-regular.ttf` | https://www.ilristorante.fr/wp-content/uploads/2026/06/meaculpa-regular.ttf | Classe `.has-mea-culpa-font-family` |

## Polices non téléchargées (pas personnalisées)

- **Roboto** (Google Fonts, `fonts.googleapis.com/css?family=Roboto…`) : chargée par WPBakery et Slider Revolution, utilisée dans le slider.
- **Poppins** : référencée dans le CSS (`#floatReservation`, flèches du slider). Aucun `@font-face` ne la charge, donc le navigateur se rabat sur une autre police.
- **Open Sans Condensed** (h1, h3) et **Alex Brush** (h2) : déclarées dans `style_dynamic.css` du thème. Aucun `@font-face` ne les charge. Pour h1 et h2, elles sont écrasées par les règles `!important` ci-dessus (Salo pour h1, Quentin pour h2). Pour h3, le navigateur se rabat sur une autre police.
- Polices d'icônes du thème et des plugins : FontAwesome, ElegantIcons, Ionicons, dripicons, linea, linear-icons, simple-line-icons, fontello, vc icons.
