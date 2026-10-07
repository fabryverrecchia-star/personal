// Contenus partagés : navigation (même arborescence que le site actuel), chiffres, contacts.
// Chiffres et conditions : brochure franchise 2026 (données 2025).

import restaurantsData from './restaurants.json';

export type NavItem = { label: string; href: string; children?: NavItem[]; highlight?: boolean; mega?: boolean };

export type Restaurant = (typeof restaurantsData)[number];
export const restaurants: Restaurant[] = restaurantsData;
export const regions = ['Nord', 'Centre & Île-de-France', 'Est', 'Ouest', 'Sud', 'Sud-Ouest'];
export const restaurantHref = (r: Restaurant) => `/${r.slug}`;

// Même arborescence et mêmes URL que www.ilristorante.fr
export const nav: NavItem[] = [
  {
    label: 'Découvrir',
    href: '/notre-cuisine-italienne',
    children: [
      { label: 'Idées cadeaux', href: '/idees-cadeaux' },
      { label: 'Notre signature', href: '/notre-cuisine-italienne/notre-signature' },
      { label: 'Notre carte', href: '/notre-cuisine-italienne/notre-carte' },
      { label: 'Notre cave', href: '/notre-cuisine-italienne/notre-cave' },
      { label: 'Nos produits italiens', href: '/notre-cuisine-italienne/nos-produits-italiens' },
    ],
  },
  {
    label: 'Il Ristorante chez vous',
    href: '/il-ristorante-chez-vous',
    children: [
      { label: 'Click and Collect', href: '/notre-cuisine-italienne/vente-a-emporter' },
      { label: 'Ecommerce vins italiens', href: '/oenoteca' },
      { label: 'Épicerie fine', href: '/notre-cuisine-italienne/notre-boutique' },
      { label: 'Traiteur italien', href: '/notre-cuisine-italienne/notre-offre-traiteur-italien' },
    ],
  },
  { label: 'Restaurants', href: '/restaurants', mega: true },
  {
    label: 'News & Fidélité',
    href: '/nos-engagements',
    children: [
      { label: 'Nos engagements', href: '/nos-engagements' },
      { label: 'Blog', href: '/actualite' },
      { label: 'Fidélité UNICA', href: '/la-carte-de-fidelite-unica' },
    ],
  },
  {
    label: 'Il Ristorante recrute',
    href: '/il-ristorante-recrute',
    children: [
      { label: 'Nos métiers', href: '/il-ristorante-recrute/nos-metiers' },
      { label: 'Grandir ensemble', href: '/il-ristorante-recrute/grandir-ensemble' },
      { label: 'S’épanouir', href: '/il-ristorante-recrute/sepanouir' },
    ],
  },
  { label: 'Devenir franchisé', href: '/devenir-franchise-il-ristorante', highlight: true },
];

export const footerLinks = [
  { label: 'Contact', href: '/contact' },
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'Conditions générales de vente', href: '/oenoteca/cgv' },
];

// Services externes réels du site actuel
export const ext = {
  reserver: '/reserver',
  commander: 'https://commandes.ilristorante.fr/home/places',
  offres: 'https://ilristoranterecrutement.softy.pro/offres/',
  candidature: 'https://recrute.ilristorante.fr/fr/candidature-spontanee',
  unicaActiver: 'https://asp.adelya.com/Adelyaview/webtostore/components/aggregate/qualification/?cg=ilristorante',
  unicaEspace: 'https://asp.adelya.com/Adelyaview/ilristorante/aggregate/loyalty/Il-Ristorante.html',
  avis: 'https://monavis.io/experience_ilristorante_site.html?source=website',
  rapport: 'https://www.ilristorante.fr/wp-content/uploads/2026/06/rapport.pdf',
  menus: 'https://www.ilristorante.fr/wp-content/uploads/2026/06/menus-sp.pdf',
  carteVins: 'https://www.ilristorante.fr/wp-content/uploads/2026/06/carte-boisson-no-price.pdf',
  allergenes: 'https://www.ilristorante.fr/wp-content/uploads/2026/06/allergenes-carte-ete-26-2.pdf',
  vegetarien: 'https://www.ilristorante.fr/wp-content/uploads/2026/06/selections-vegetarienne-sans-gluten-1.pdf',
  englishMenu: 'https://www.ilristorante.fr/wp-content/uploads/2026/06/no-price.pdf',
  carteFood: 'https://www.ilristorante.fr/wp-content/uploads/2026/06/carte-food-master-sc.pdf',
  epicerie: 'https://www.ilristorante.fr/wp-content/uploads/2026/06/traiteur-epicerie-vae-premium.pdf',
  vae: 'https://www.ilristorante.fr/wp-content/uploads/2026/06/vae-premium-a4.pdf',
  unicaCgu: 'https://www.ilristorante.fr/wp-content/uploads/2026/05/cgu-programme-de-fidelite-unica-il-ristorante-2026-d.pdf',
};

export const brochure = '/docs/brochure-franchise-il-ristorante-2026.pdf';

export const contact = {
  name: 'Yves Gaspard',
  role: 'Directeur Développement',
  email: 'Yves.gaspard@ilristorante.fr',
  phone: '06 26 17 33 08',
  phoneHref: '+33626173308',
};

export const socials = [
  { label: 'Facebook', href: 'https://www.facebook.com/IlRistorante/' },
  { label: 'Instagram', href: 'https://www.instagram.com/il_ristorante/' },
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
  { n: '01', title: 'Cuisine & produit', text: 'Sourcing direct auprès des producteurs italiens. Parmigiano Reggiano affiné 36 mois, jambon de Parme coupé à la minute.', img: '/img/site/plats-ete.webp' },
  { n: '02', title: 'Architecture & décor', text: 'Marbre blanc, velours bleu canard, laiton et plantes. Un cadre pensé pour qu’on s’y sente bien, du déjeuner au dîner.', img: '/img/site/franchise-salle.webp' },
  { n: '03', title: 'Nos collaborateurs', text: 'Des chefs et des brigades formés chez nous. En cuisine, on transmet les bons gestes depuis 2006.', img: '/img/site/team.webp' },
  { n: '04', title: 'L’art de vivre à l’italienne', text: 'Des plats pensés pour être partagés, un service attentif, et le plaisir simple de passer à table ensemble.', img: '/img/site/aperitivo.webp' },
];
