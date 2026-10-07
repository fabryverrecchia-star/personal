// Liste des restaurants affichée sur /restaurants.
// À COMPLÉTER avec la liste officielle (23 adresses, dont 8 en franchise) :
// nom, ville, adresse, téléphone et lien de réservation de chaque restaurant.
export type Restaurant = { city: string; address: string; phone?: string; booking?: string; franchise?: boolean; img: string; lat?: number; lng?: number };

const imgs = ['/img/interior-teal.webp', '/img/interior-blue.webp', '/img/facade.webp', '/img/bar.webp', '/img/interior-logo.webp', '/img/hero.webp'];

export const restaurants: Restaurant[] = Array.from({ length: 23 }, (_, i) => ({
  city: `Restaurant ${String(i + 1).padStart(2, '0')}`,
  address: 'Adresse à renseigner',
  booking: '#',
  franchise: i >= 15,
  img: imgs[i % imgs.length],
}));
