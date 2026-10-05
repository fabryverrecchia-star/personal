import ar from './ar';
import en from './en';
import fr from './fr';
import ru from './ru';
import { DEFAULT_LANG, type Dict, type Lang } from './types';

export * from './types';

export const dicts: Record<Lang, Dict> = { fr, en, ru, ar };

export const isRtl = (lang: Lang) => lang === 'ar';

/** Chemin d'une page de langue, base comprise (ex. /newsl/en/) */
export function langPath(lang: Lang): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return lang === DEFAULT_LANG ? `${base}/` : `${base}/${lang}/`;
}

/** URL d'un fichier de public/, base comprise */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
