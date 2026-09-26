// Préfixe les liens internes avec le chemin de base (ex. /blandry)
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const u = (path: string) => `${base}${path}`;
