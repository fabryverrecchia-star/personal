# Branding

- `fonts/` : polices sources (.ttf). Après une modification, relancer :
  `pip install fonttools brotli && python3 scripts/build-fonts.py`
- `sadik.svg` : logo SADIK vectoriel (1662 × 442, couleurs d'origine). Généré depuis
  `src/brand/sadik.ts` (source unique : tracés, arcs, palette) ; aussi servi sur `/brand/sadik.svg`.
  Composition WebGL au défilement : page `/sadik` (`src/components/SadikLogo.astro`, `src/scripts/sadik.ts`).
- À ajouter : textes (bio, projets).

> ⚠️ Adobe Garamond est une police commerciale : son usage sur le web demande une licence
> web (par exemple via Adobe Fonts). EB Garamond est libre (SIL OFL).
