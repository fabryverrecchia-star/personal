// Contenus partagés : navigation (même arborescence que le site actuel), chiffres, contacts.
// Chiffres et conditions : brochure franchise 2026 (données 2025).

export type NavItem = { label: string; href: string; children?: NavItem[]; highlight?: boolean };

export const nav: NavItem[] = [
  { label: 'Découvrir', href: '/decouvrir' },
  { label: 'Il Ristorante chez vous', href: '/il-ristorante-chez-vous' },
  { label: 'Restaurants', href: '/restaurants' },
  {
    label: 'News & Fidélité',
    href: '/news-fidelite',
    children: [
      { label: 'Nos engagements', href: '/news-fidelite/nos-engagements' },
      { label: 'Blog', href: '/news-fidelite/blog' },
      { label: 'Fidélité UNICA', href: '/news-fidelite/fidelite-unica' },
    ],
  },
  {
    label: 'Il Ristorante recrute',
    href: '/recrute',
    children: [
      { label: 'Nos métiers', href: '/recrute/nos-metiers' },
      { label: 'Grandir ensemble', href: '/recrute/grandir-ensemble' },
      { label: 'S’épanouir', href: '/recrute/s-epanouir' },
    ],
  },
  { label: 'Devenir franchisé', href: '/devenir-franchise', highlight: true },
];

export const brochure = '/docs/brochure-franchise-il-ristorante-2026.pdf';

export const contact = {
  name: 'Yves Gaspard',
  role: 'Directeur Développement',
  email: 'Yves.gaspard@ilristorante.fr',
  phone: '06 26 17 33 08',
  phoneHref: '+33626173308',
};

export const socials = [
  { label: 'Facebook', href: 'https://www.facebook.com/' },
  { label: 'Instagram', href: 'https://www.instagram.com/' },
  { label: 'Pinterest', href: 'https://www.pinterest.fr/' },
];

/** Chiffres clés 2025. value = nombre animé, format = rendu final. */
export const stats = [
  { value: 2006, decimals: 0, group: false, suffix: '', label: 'Création de l’enseigne' },
  { value: 55.9, decimals: 1, suffix: ' M€', label: 'Chiffre d’affaires 2025' },
  { value: 23, decimals: 0, suffix: '', label: 'Restaurants, dont 8 en franchise' },
  { value: 28.58, decimals: 2, suffix: ' €', label: 'Ticket moyen' },
  { value: 610, decimals: 0, suffix: '', label: 'Collaborateurs' },
  { value: 2.2, decimals: 1, suffix: ' M', label: 'Clients chaque année' },
  { value: 2.2, decimals: 1, suffix: ' M€ HT', label: 'CA moyen par restaurant' },
];

export const conditions = [
  { value: '45 K€', label: 'Droit d’entrée' },
  { value: '9 ans', label: 'Durée du contrat' },
  { value: '5 %', label: 'Redevance de marque', note: 'de 0 à 2,3 M€ de CA, puis 2,5 % au-delà' },
  { value: '350 K€', label: 'Apport personnel' },
];

export const pillars = [
  { n: '01', title: 'Cuisine & produit', text: 'Sourcing direct auprès des producteurs italiens. Parmigiano Reggiano affiné 36 mois, jambon de Parme coupé à la minute.', img: '/img/pasta.webp' },
  { n: '02', title: 'Architecture & décor', text: 'Marbre blanc, velours bleu canard, laiton et plantes. Un cadre pensé pour qu’on s’y sente bien, du déjeuner au dîner.', img: '/img/interior-teal.webp' },
  { n: '03', title: 'Nos collaborateurs', text: 'Des chefs et des brigades formés chez nous. En cuisine, on transmet les bons gestes depuis 2006.', img: '/img/team.webp' },
  { n: '04', title: 'L’art de vivre à l’italienne', text: 'Des plats pensés pour être partagés, un service attentif, et le plaisir simple de passer à table ensemble.', img: '/img/table.webp' },
];
