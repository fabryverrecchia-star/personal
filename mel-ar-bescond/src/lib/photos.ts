// Photos du site : un fichier déposé dans src/assets/photos/ sous le nom attendu remplace automatiquement
// le recadrage provisoire tiré du brand kit (ex. ruche.jpg, duo.jpg, recolte.jpg, fleur.jpg).
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/*.{jpg,jpeg,png,webp,avif}', { eager: true });
const byName = new Map(
  Object.entries(files).map(([path, mod]) => [path.split('/').pop()!.replace(/\.\w+$/, ''), mod.default]),
);

/** Renvoie la photo `name` si elle existe, sinon la première solution de repli disponible. */
export function photo(name: string, ...fallbacks: string[]): ImageMetadata {
  for (const n of [name, ...fallbacks]) {
    const img = byName.get(n);
    if (img) return img;
  }
  throw new Error(`Photo introuvable : ${[name, ...fallbacks].join(', ')}`);
}

/** Photo du shooting si elle a été déposée, sinon undefined (pour les grands formats). */
export function maybe(...names: string[]): ImageMetadata | undefined {
  for (const n of names) {
    const img = byName.get(n);
    if (img) return img;
  }
}
