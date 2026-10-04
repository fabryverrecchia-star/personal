// ─────────────────────────────────────────────────────────────
//  Toutes les informations de l'entreprise sont ici.
//  Les lignes marquées « À COMPLÉTER » doivent être vérifiées
//  avant la mise en ligne (elles servent aussi au référencement).
// ─────────────────────────────────────────────────────────────
import combleAvant from '../assets/chantiers/combles-avant.jpg';
import combleApres from '../assets/chantiers/combles-apres.jpg';
import pieceAvant from '../assets/chantiers/piece-de-vie-avant.jpg';
import sejourVoute from '../assets/chantiers/sejour-voute.jpg';
import artisan from '../assets/chantiers/artisan-poncage.jpg';
import finition from '../assets/chantiers/finition-lumiere.jpg';
import applique from '../assets/chantiers/applique-lumiere.jpg';

const galerieFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/galerie/*.jpg', { eager: true });
const g = (slug: string) => galerieFiles[`../assets/galerie/${slug}.jpg`].default;

export const site = {
  url: 'https://18h22.com/blandry', // À COMPLÉTER : domaine définitif
  nom: 'Benjamin Landry',
  monogramme: 'BL',
  metier: 'Peintre en bâtiment',
  gerant: 'Benjamin Landry',
  telephone: '06 58 38 78 37',
  email: 'contact@blandry.fr', // À COMPLÉTER
  adresse: {
    rue: '', // À COMPLÉTER (facultatif si vous ne recevez pas de clients)
    codePostal: '63780', // À COMPLÉTER
    ville: 'Saint-Georges-de-Mons', // À COMPLÉTER
    region: 'Auvergne-Rhône-Alpes',
    departement: 'Puy-de-Dôme',
  },
  geo: { lat: 45.9406, lng: 2.8386 }, // À COMPLÉTER : coordonnées exactes du siège
  siret: '', // À COMPLÉTER
  assurance: 'Garantie décennale', // À COMPLÉTER : nom de l'assureur
  horaires: 'Du lundi au vendredi, de 8 h à 18 h',
  delaiReponse: 'Réponse sous 48 heures',
  reseaux: {} as Record<string, string>,
};

export const telHref = `tel:${site.telephone.replace(/\s/g, '').replace(/^0/, '+33')}`;

export const photos = {
  artisan: { src: artisan, alt: 'Ponçage d’un plafond à la ponceuse girafe, sous une lumière rasante' },
  detail: { src: applique, alt: 'Applique murale sur un mur parfaitement lissé, sous un plafond rampant' },
  finition: { src: finition, alt: 'Angle de mur arrondi, enduit parfaitement lisse baigné de lumière' },
  arche: { src: g('pierre-poutres'), alt: 'Mur de pierre, poutres et enduit clair' },
};

// ── Nuancier du territoire ────────────────────────────────────
// Photos facultatives : déposer src/assets/region/<id>.jpg (ex. volvic.jpg)
const regionFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/region/*.{jpg,jpeg,png,webp}', { eager: true });
const regionPhoto = (id: string) =>
  Object.entries(regionFiles).find(([k]) => k.split('/').pop()!.split('.')[0] === id)?.[1].default;

export const palette = [
  { id: 'chaux', nom: 'Blanc de chaux', origine: 'Enduits des maisons de bourg', hex: '#E2DACB', ink: '#1A1917' },
  { id: 'volvic', nom: 'Gris Volvic', origine: 'Pierre de lave de Volvic et de Riom', hex: '#56595C', ink: '#F3EFE8' },
  { id: 'sioule', nom: 'Vert Sioule', origine: 'Gorges de la Sioule, Combrailles', hex: '#3F5A45', ink: '#F3EFE8' },
  { id: 'limagne', nom: 'Ocre Limagne', origine: 'Terres de la plaine de Limagne', hex: '#C08A3E', ink: '#1A1917' },
  { id: 'tuile', nom: 'Rouge tuile', origine: 'Toitures des villages', hex: '#9B4B34', ink: '#F3EFE8' },
  { id: 'puys', nom: 'Bleu des Puys', origine: 'Ciel de la Chaîne des Puys', hex: '#8DA3B3', ink: '#1A1917' },
  { id: 'basalte', nom: 'Noir basalte', origine: 'Coulées volcaniques', hex: '#1F1D1A', ink: '#F3EFE8' },
].map((c) => ({ ...c, photo: regionPhoto(c.id) }));

// ── Avant / après ─────────────────────────────────────────────
export const comparaisons = [
  {
    id: 'combles',
    onglet: 'Combles',
    titre: 'Des combles à la chambre',
    texte: 'Reprise complète des supports, plafonds rampants, charpente conservée et mise en valeur.',
    avant: { src: combleAvant, alt: 'Combles avant travaux' },
    apres: { src: combleApres, alt: 'Combles après travaux' },
  },
  {
    id: 'piece',
    onglet: 'Pièce de vie',
    titre: 'Une pièce de vie rendue à la lumière',
    texte: 'Dépose, reprise des murs et plafonds, arche dégagée, revêtement de sol neuf.',
    avant: { src: pieceAvant, alt: 'Pièce de vie avant travaux' },
    // À REMPLACER par la photo « après » prise sous le même angle
    apres: { src: sejourVoute, alt: 'Pièce de vie après travaux' },
  },
];

// ── Galerie ───────────────────────────────────────────────────
export type Photo = { src: ImageMetadata; titre: string; cat: 'Façade' | 'Extérieur' | 'Intérieur' | 'Commerce' };
const P = (slug: string, titre: string, cat: Photo['cat']): Photo => ({ src: g(slug), titre, cat });

// Sélection de l'accueil : façades et intérieurs terminés
export const selection: Photo[] = [
  P('salle-a-manger-verriere', 'Séjour ouvert sur baie vitrée', 'Intérieur'),
  P('mur-pierre-applique', 'Maçonnerie apparente et enduit lissé', 'Intérieur'),
  P('chambre-vert-sapin', 'Mur d’accent vert sapin', 'Intérieur'),
  P('portique-bois', 'Charpente de portique lasurée', 'Extérieur'),
  P('salon-papier-peint', 'Pose de papier peint panoramique', 'Intérieur'),
];

// Toutes les réalisations (page dédiée)
export const galerie: Photo[] = [
  ...selection,
  P('portique-charpente', 'Sous-face de charpente', 'Extérieur'),
  P('cuisine-lineaire', 'Pièce à vivre en longueur', 'Intérieur'),
  P('poele-pierre', 'Conduit habillé de pierre', 'Intérieur'),
  P('chambre-bleu-nuit', 'Chambre bleu nuit', 'Intérieur'),
  P('bibliotheque-rouge', 'Bibliothèque vermillon', 'Commerce'),
  P('salon-rouge-anthracite', 'Contrastes vermillon et anthracite', 'Commerce'),
  P('wc-noir-graphique', 'Sanitaires en noir profond', 'Commerce'),
  P('couloir-vert-de-gris', 'Circulation vert-de-gris', 'Commerce'),
  P('restaurant-salle', 'Salle de restaurant', 'Commerce'),
  P('restaurant-banquettes', 'Banquettes et plafond sombre', 'Commerce'),
  P('sejour-baie', 'Séjour et baie coulissante', 'Intérieur'),
  P('cuisine-bois', 'Cuisine et mur anthracite', 'Intérieur'),
  P('chambre-papier-peint', 'Tête de lit en papier peint', 'Intérieur'),
  P('sejour-mezzanine', 'Séjour sous mezzanine', 'Intérieur'),
  P('escalier-ajoure', 'Cage d’escalier', 'Intérieur'),
  P('sejour-poutres', 'Poutres et plafonds rampants', 'Intérieur'),
  P('chambre-claire', 'Chambre aux tons chauds', 'Intérieur'),
  P('salle-de-bain-miroir', 'Salle d’eau et dégagement', 'Intérieur'),
  P('sejour-chevrons', 'Séjour, parquet à chevrons', 'Intérieur'),
  P('entree-porte-noire', 'Entrée et menuiserie noire', 'Intérieur'),
  P('plafond-noir', 'Plafond laqué noir', 'Intérieur'),
  P('soubassement-rose', 'Soubassement vieux rose', 'Intérieur'),
  P('pierre-poutres', 'Pierre, poutres et enduit', 'Intérieur'),
  P('douche-mosaique', 'Douche en mosaïque', 'Intérieur'),
  P('salle-de-bain-parquet', 'Salle de bains lumineuse', 'Intérieur'),
  P('chambre-sauge', 'Chambre vert sauge', 'Intérieur'),
  P('wc-rose', 'Sanitaires rose poudré', 'Intérieur'),
  P('douche-carrelage', 'Douche à l’italienne', 'Intérieur'),
];

// Photos flottantes du hero
export const heroPhotos: Photo[] = [
  P('mur-pierre-applique', '', 'Intérieur'),
  P('chambre-vert-sapin', '', 'Intérieur'),
  P('salon-papier-peint', '', 'Intérieur'),
  P('bibliotheque-rouge', '', 'Commerce'),
  P('chambre-bleu-nuit', '', 'Intérieur'),
  P('portique-bois', '', 'Extérieur'),
  P('wc-noir-graphique', '', 'Commerce'),
  P('chambre-papier-peint', '', 'Intérieur'),
];

// ── Garanties et engagements (également utiles au référencement) ─
// À VÉRIFIER : nom de l'assureur décennale à indiquer dans site.assurance
export const garanties = [
  {
    titre: 'Garantie décennale',
    texte: 'Nos travaux sont couverts par une assurance décennale. L’attestation, au nom de l’entreprise, est jointe à chaque devis.',
  },
  {
    titre: 'Responsabilité civile professionnelle',
    texte: 'Votre logement, votre mobilier et les parties communes sont assurés pendant toute la durée du chantier.',
  },
  {
    titre: 'Garantie de parfait achèvement',
    texte: 'Pendant un an après la réception, tout désordre signalé est repris à nos frais, conformément au Code civil.',
  },
  {
    titre: 'Devis détaillé, prix ferme',
    texte: 'Surfaces, préparation, produits et nombre de couches sont chiffrés poste par poste. Le prix accepté est celui facturé.',
  },
  {
    titre: 'Visite et devis gratuits',
    texte: 'Le déplacement, l’examen des supports et l’établissement du devis ne vous engagent à rien et ne vous coûtent rien.',
  },
  {
    titre: 'Produits professionnels A+',
    texte: 'Peintures en phase aqueuse, faiblement émissives, pour une qualité de l’air intérieur préservée dès la fin du chantier.',
  },
];

// ── Savoir-faire ──────────────────────────────────────────────
export const services = [
  {
    id: 'interieur',
    titre: 'Peinture intérieure',
    texte:
      'Murs, plafonds, cages d’escalier et pièces d’eau. Chaque support reçoit l’impression qui lui convient, puis deux couches croisées. La finition, mate, velours ou satinée, se choisit selon l’usage de la pièce et la lumière qu’elle reçoit.',
    photo: 'chambre-bleu-nuit',
  },
  {
    id: 'preparation',
    titre: 'Préparation des supports',
    texte:
      'Enduits de lissage, reprises de plâtre, bandes, toile de verre. C’est l’étape que l’on ne voit plus une fois le chantier terminé, et celle qui décide de tout : une peinture ne corrige pas un défaut, elle le révèle.',
    photo: 'mur-pierre-applique',
  },
  {
    id: 'facade',
    titre: 'Façades et extérieurs',
    texte:
      'Nettoyage, traitement des fissures, peintures minérales ou siloxanes qui laissent respirer la maçonnerie. Des systèmes choisis pour les écarts de température du Puy-de-Dôme, du plateau des Combrailles à la Limagne.',
    photo: 'portique-charpente',
  },
  {
    id: 'boiseries',
    titre: 'Boiseries et menuiseries',
    texte:
      'Volets, portes, fenêtres, charpentes apparentes et sous-faces. Décapage, égrenage, puis lasure ou laque microporeuse pour une protection durable et une teinte homogène.',
    photo: 'portique-bois',
  },
  {
    id: 'decoration',
    titre: 'Décoration et conseil couleur',
    texte:
      'Murs d’accent, papiers peints, enduits décoratifs. Les échantillons sont posés chez vous : une teinte ne se valide qu’à la lumière réelle de la pièce, à différentes heures du jour.',
    photo: 'salon-papier-peint',
  },
];

// ── Déroulement : de la demande de devis à la livraison ───────
export const etapes = [
  {
    titre: 'Premier échange',
    texte: 'Vous décrivez votre projet par téléphone ou par le formulaire. Nous vous rappelons sous 48 heures pour fixer une visite.',
    duree: 'Sous 48 h',
  },
  {
    titre: 'Visite sur place',
    texte: 'Nous examinons les supports, relevons les surfaces et vous conseillons sur les produits et les teintes. La visite est gratuite.',
    duree: 'Sans frais',
  },
  {
    titre: 'Devis détaillé',
    texte: 'Chaque poste est décrit : surfaces, préparation, produits, nombre de couches. Aucune ligne imprécise, aucun supplément découvert en cours de route.',
    duree: 'Sous une semaine',
  },
  {
    titre: 'Planification',
    texte: 'Après accord, nous arrêtons ensemble une date de début et une durée. Vous connaissez le calendrier avant le premier jour.',
    duree: 'Date ferme',
  },
  {
    titre: 'Réalisation',
    texte: 'Sols, mobilier et menuiseries sont protégés avant toute intervention. Le chantier est rangé chaque soir et vous êtes tenu informé de son avancement.',
    duree: 'Suivi continu',
  },
  {
    titre: 'Réception',
    texte: 'Nous parcourons chaque pièce avec vous, à la lumière du jour. Les retouches éventuelles sont reprises avant la remise d’un chantier propre.',
    duree: 'Chantier remis',
  },
];

export type Zone = {
  slug: string;
  nom: string;
  dans: string;
  court: string;
  titreSeo: string;
  descriptionSeo: string;
  accroche: string;
  intro: string;
  terrain: { titre: string; texte: string }[];
  communes: string[];
  faq: { q: string; r: string }[];
  teinte: string;
};

export const zones: Zone[] = [
  {
    slug: 'peintre-combrailles',
    nom: 'Combrailles',
    dans: 'dans les Combrailles',
    court: 'Saint-Georges-de-Mons, Les Ancizes-Comps, Pontaumur',
    titreSeo: 'Peintre en bâtiment dans les Combrailles',
    descriptionSeo:
      'Artisan peintre à Saint-Georges-de-Mons : peinture intérieure, préparation des supports, façades et boiseries dans les Combrailles. Visite et devis gratuits.',
    accroche: 'Notre secteur d’origine, où nous intervenons au quotidien.',
    intro:
      'L’entreprise est installée à Saint-Georges-de-Mons. Maisons de bourg, fermes rénovées, résidences principales ou secondaires : nous accompagnons les propriétaires des Combrailles de la première visite à la réception des travaux.',
    terrain: [
      { titre: 'Bâti ancien', texte: 'Sur les murs épais en pierre, nous privilégions la chaux et les peintures minérales, qui laissent la maçonnerie respirer.' },
      { titre: 'Climat du plateau', texte: 'Pour les volets et les façades, des produits microporeux conçus pour le gel et les fortes amplitudes de température.' },
      { titre: 'Résidences secondaires', texte: 'En votre absence, nous organisons le chantier et vous transmettons des photographies à chaque étape.' },
    ],
    communes: [
      'Saint-Georges-de-Mons', 'Les Ancizes-Comps', 'Manzat', 'Pontaumur', 'Pontgibaud', 'Saint-Gervais-d’Auvergne',
      'Saint-Éloy-les-Mines', 'Menat', 'Châteauneuf-les-Bains', 'Queuille', 'Miremont', 'Loubeyrat', 'Charbonnières-les-Vieilles',
    ],
    faq: [
      { q: 'Dans quelles communes des Combrailles intervenez-vous ?', r: 'Principalement autour de Saint-Georges-de-Mons et des Ancizes-Comps, et plus largement dans l’ensemble des Combrailles. La visite et le devis sont gratuits.' },
      { q: 'Quelle peinture pour une maison en pierre ?', r: 'Sur des murs anciens, une peinture ou un enduit à la chaux, ou une peinture minérale respirante. Les peintures acryliques épaisses retiennent l’humidité et finissent par cloquer.' },
      { q: 'Pouvez-vous intervenir en notre absence ?', r: 'Oui. Nous convenons de la remise des clés, vous informons par photographies à chaque étape et organisons la réception sur place ou à distance.' },
    ],
    teinte: 'sioule',
  },
  {
    slug: 'peintre-riom',
    nom: 'Riom',
    dans: 'à Riom',
    court: 'Riom, Châtel-Guyon, Volvic, Mozac',
    titreSeo: 'Peintre en bâtiment à Riom et alentours',
    descriptionSeo:
      'Artisan peintre pour Riom, Châtel-Guyon, Volvic et Mozac : peinture intérieure, finitions, façades et boiseries. Visite et devis gratuits.',
    accroche: 'Riom et ses environs, à proximité immédiate de notre atelier.',
    intro:
      'Riom se trouve à quelques kilomètres de notre base. Appartements du centre ancien, maisons de ville, pavillons : nous y réalisons des travaux de peinture intérieure et extérieure avec la même exigence.',
    terrain: [
      { titre: 'Centre ancien', texte: 'Pour les façades et menuiseries visibles depuis la rue, nous vérifions avec vous les teintes autorisées avant le début des travaux.' },
      { titre: 'Menuiseries anciennes', texte: 'Volets, portes et fenêtres en bois sont préparés avec soin avant l’application de la lasure ou de la laque.' },
      { titre: 'Remise en état locative', texte: 'Pour les propriétaires bailleurs, des interventions rapides sur la base d’un devis ferme.' },
    ],
    communes: ['Riom', 'Châtel-Guyon', 'Mozac', 'Volvic', 'Ménétrol', 'Marsat', 'Enval', 'Combronde', 'Saint-Bonnet-près-Riom', 'Ennezat'],
    faq: [
      { q: 'Intervenez-vous dans le centre historique de Riom ?', r: 'Oui. Pour les façades et menuiseries visibles depuis la rue, nous vous aidons à vérifier les teintes autorisées avant de commencer.' },
      { q: 'Combien de temps pour repeindre un appartement ?', r: 'Pour un trois-pièces en bon état, comptez généralement une à deux semaines selon la préparation nécessaire. Le planning précis figure sur le devis.' },
      { q: 'Prenez-vous en charge les volets et encadrements ?', r: 'Oui, volets bois et métal, portes et fenêtres. Les encadrements en pierre sont protégés et laissés à nu, sauf demande contraire.' },
    ],
    teinte: 'volvic',
  },
  {
    slug: 'peintre-clermont-ferrand',
    nom: 'Clermont-Ferrand',
    dans: 'à Clermont-Ferrand',
    court: 'Clermont-Ferrand, Chamalières, Royat, Durtol',
    titreSeo: 'Peintre en bâtiment à Clermont-Ferrand',
    descriptionSeo:
      'Artisan peintre pour Clermont-Ferrand, Chamalières, Royat et Durtol : appartements, maisons, parties communes. Visite et devis gratuits.',
    accroche: 'Appartements, maisons et copropriétés de la métropole.',
    intro:
      'Nous intervenons régulièrement à Clermont-Ferrand et dans l’ouest de la métropole. Appartements anciens, maisons individuelles ou parties communes : chaque chantier bénéficie d’une préparation soignée et d’un suivi attentif.',
    terrain: [
      { titre: 'Appartements anciens', texte: 'Moulures, hauts plafonds, parquets : protection complète et finitions réalisées à la main, dans le respect du voisinage.' },
      { titre: 'Copropriétés', texte: 'Halls, cages d’escalier, paliers : coordination avec le syndic et accès sécurisés pendant les travaux.' },
      { titre: 'Remise en état locative', texte: 'Pour les propriétaires bailleurs, des interventions rapides sur la base d’un devis ferme.' },
    ],
    communes: ['Clermont-Ferrand', 'Chamalières', 'Royat', 'Durtol', 'Nohanent', 'Blanzat', 'Cébazat', 'Orcines', 'Ceyrat'],
    faq: [
      { q: 'La visite est-elle gratuite à Clermont-Ferrand ?', r: 'Oui, la visite et le devis sont gratuits dans toute la métropole clermontoise.' },
      { q: 'Travaillez-vous en copropriété ?', r: 'Oui, pour les parties privatives comme pour les parties communes. Nous nous organisons avec le syndic et protégeons les accès.' },
      { q: 'Sous quel délai recevrai-je mon devis ?', r: 'Nous vous rappelons sous 48 heures pour fixer une visite. Le devis détaillé vous est adressé dans la semaine qui suit.' },
    ],
    teinte: 'puys',
  },
];

export const faqGenerale = [
  { q: 'La visite et le devis sont-ils gratuits ?', r: 'Oui. La visite sur place et le devis détaillé sont gratuits et sans engagement.' },
  { q: 'Réalisez-vous des rénovations complètes ?', r: 'Notre métier est la peinture et tout ce qui la prépare : enduits, reprises de plâtre, toile de verre, ainsi que certains revêtements de sol. Pour les autres corps de métier, nous pouvons vous orienter vers des artisans de confiance.' },
  { q: 'Quels produits utilisez-vous ?', r: 'Des peintures professionnelles en phase aqueuse, classées A+ pour l’intérieur, minérales ou siloxanes pour l’extérieur. Les marques et références figurent sur le devis.' },
  { q: 'Quelles garanties couvrent vos travaux ?', r: 'Nos travaux sont couverts par une garantie décennale et une assurance responsabilité civile professionnelle, dont l’attestation est jointe au devis. S’y ajoute la garantie de parfait achèvement : pendant un an après la réception, tout désordre signalé est repris à nos frais.' },
  { q: 'Comment votre logement est-il protégé ?', r: 'Sols, mobilier et menuiseries sont protégés avant toute intervention. Le chantier est rangé chaque soir et remis propre à la livraison.' },
];

// Compatibilité (anciens composants)
export const realisations = selection.map((p) => ({ titre: p.titre, lieu: '', travaux: [p.cat], image: p.src, alt: p.titre }));
export const nuancier = palette.map((p) => ({ id: p.id, nom: p.nom, lieu: p.origine, hex: p.hex, ink: p.ink }));
export const teinte = (_id: string) => nuancier[0];
export const zoneBySlug = (slug: string) => zones.find((z) => z.slug === slug)!;
