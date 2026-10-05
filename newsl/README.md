# Soundslike — nouveau site

Site immersif pour Soundslike, maison de création musicale parisienne, repositionnée sur les **événements privés très haut de gamme**.
Publication prévue sur **https://18h22.com/newsl** (le chemin `/newsl` est configuré dans `astro.config.mjs`).

Astro (site statique) + **three.js** (shaders GLSL sur mesure) + **GSAP** (ScrollTrigger, SplitText) + **Lenis** + Web Audio API.

## Démarrer

```bash
npm install
npm run dev       # http://localhost:4321/newsl/
npm run build     # site statique dans dist/
npm run preview   # sert dist/ sur http://localhost:4321/newsl/
```

Déploiement : copier le contenu de `dist/` dans le dossier `/newsl/` du serveur de 18h22.com.

## Langues

| Langue | URL | Sens |
| --- | --- | --- |
| Français | `/newsl/` | ltr |
| English | `/newsl/en/` | ltr |
| Русский | `/newsl/ru/` | ltr |
| العربية | `/newsl/ar/` | **rtl** |

Les textes sont dans `src/i18n/{fr,en,ru,ar}.ts` (même structure, typée par `src/i18n/types.ts`).
⚠️ Le russe et l'arabe doivent être relus par un locuteur natif avant la mise en ligne.

## Expérience

1. **Entrée** — logo révélé au rythme du chargement, choix « avec le son » / « en silence ».
2. **Ouverture** — la vidéo est rendue dans un shader : ouverture circulaire, étalonnage vert sapin / bordeaux / or, ondes sous la souris, respiration pilotée par la musique (analyse Web Audio en direct).
3. **Fond « velours »** — fbm à domaine déformé, plis de rideau, poussière dorée ; la teinte suit la section affichée.
4. **Manifeste** — les mots s'allument au défilement.
5. **Expériences** — défilement horizontal épinglé ; les images se courbent selon la vitesse et se révèlent par un bord bruité doré.
6. **Casting** — liste typographique, vignette WebGL qui suit le curseur et s'étire selon sa vitesse.
7. **La Maison** — lieux partenaires (Crillon, Maxim's, Mondaine…) et marques (défilement continu).
8. **Méthode** puis **Demande privée** (le formulaire prépare un e-mail vers `contact@soundslike.fr`, pas de serveur).

Sans WebGL ou avec « réduire les animations », le site reste complet (images et vidéo DOM, pas de lissage).

## Structure

```
newsl/
├── brand/                 # sources : photos, logos, polices
├── scripts/build-assets.py# génère public/fonts et public/media depuis brand/
├── public/                # polices web, médias optimisés, vidéo (webm + mp4)
└── src/
    ├── i18n/              # textes des 4 langues
    ├── site.ts            # e-mail, téléphone, réseaux, crédits
    ├── styles/            # global.css (polices, tokens), sections.css
    ├── components/        # Home.astro (page), Logo.astro (logo vectorisé)
    ├── layouts/Base.astro # <head>, hreflang, Open Graph
    └── scripts/
        ├── app.ts         # entrée, Lenis, révélations, horizontal, curseur, formulaire
        ├── audio.ts       # son d'ambiance + analyse
        └── gl/            # world.ts (scène three.js), shaders.ts (GLSL)
```

Régénérer les assets après modification de `brand/` :

```bash
pip install fonttools brotli pillow
npm run assets
```

## Polices

- **Agrandir** (Pangram Pangram) et **Apoc** : polices du client, sous licence commerciale. À vérifier : la licence web couvre-t-elle ce nouveau site ?
- Compléments libres (OFL) : **Unbounded** (cyrillique, sans), **IBM Plex Sans Arabic** (arabe, sans), **Amiri** (arabe, serif).

## À fournir par le client

- Logo **SVG d'origine** (l'actuel est une vectorisation du PNG).
- Photos HD **sans filtre**, et photos des lieux (Crillon, Maxim's, Mondaine, Gigi…).
- Rushes vidéo supplémentaires (Grenade, Watermeloon, Jazz, Timothée…).
- Validation des textes et des références clients citées.
