// Catalogue de la récolte. price: null = épuisé.
export type Size = '250g' | '500g' | '1kg';
export interface Product {
  id: string;
  name: string;
  season: string;
  year: number;
  notes: string;
  description: string;
  // teintes du miel dans le pot (clair → profond)
  honey: [string, string];
  crystal: number; // 0 = liquide, 1 = très crémeux
  prices: Record<Size, number | null>;
}

export const sizes: Size[] = ['250g', '500g', '1kg'];

export const products: Product[] = [
  {
    id: 'ete-2026',
    name: 'Été',
    season: 'Été',
    year: 2026,
    notes: 'Ambré · floral · généreux',
    description:
      'Récolté au cœur de l’été, quand le bocage est en pleine floraison. Un miel à la robe dorée, rond et chaleureux.',
    honey: ['#E0A23C', '#A9611A'],
    crystal: 0.35,
    prices: { '250g': 5, '500g': 9, '1kg': 15 },
  },
  {
    id: 'printemps-2026',
    name: 'Printemps',
    season: 'Printemps',
    year: 2026,
    notes: 'Clair · doux · crémeux',
    description:
      'Le premier miel de l’année, né des floraisons printanières. Clair et délicat, il se cristallise en une texture fondante.',
    honey: ['#F2DC9E', '#D9AE57'],
    crystal: 0.85,
    prices: { '250g': null, '500g': 10, '1kg': null },
  },
];
