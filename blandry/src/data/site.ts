// ─────────────────────────────────────────────────────────────
//  Toutes les informations de l'entreprise sont ici.
//  Les lignes marquées « À COMPLÉTER » doivent être vérifiées
//  avant la mise en ligne (elles servent aussi au référencement).
// ─────────────────────────────────────────────────────────────
import combleAvant from '../assets/chantiers/combles-avant.jpg';
import combleApres from '../assets/chantiers/combles-apres.jpg';
import pieceAvant from '../assets/chantiers/piece-de-vie-avant.jpg';
import sejourVoute from '../assets/chantiers/sejour-voute.jpg';
import cheminee from '../assets/chantiers/cheminee.jpg';
import artisan from '../assets/chantiers/artisan-poncage.jpg';
import finition from '../assets/chantiers/finition-lumiere.jpg';

export const photos = {
  artisan: { src: artisan, alt: 'Artisan Blandry ponçant un plafond à la ponceuse girafe' },
  finition: { src: finition, alt: 'Angle de mur arrondi, enduit lisse baigné de lumière' },
};

export const site = {
  url: 'https://18h22.com/blandry', // À COMPLÉTER : domaine définitif
  nom: 'Blandry',
  monogramme: 'BL',
  metier: 'Peintre en bâtiment',
  gerant: 'B. Landry', // À COMPLÉTER
  telephone: '06 58 38 78 37',
  email: 'contact@blandry.fr', // À COMPLÉTER
  // Commune du siège : c'est elle qui ancre l'entreprise localement pour Google.
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
  horaires: 'Du lundi au vendredi, 8 h – 18 h',
  delaiReponse: 'Réponse sous 48 heures',
  reseaux: {
    // instagram: 'https://instagram.com/…',
    // google: 'https://g.page/…',
  } as Record<string, string>,
};

export const telHref = `tel:${site.telephone.replace(/\s/g, '').replace(/^0/, '+33')}`;

// ── Avant / après ─────────────────────────────────────────────
// Idéalement : même cadrage avant et après.
export const comparaisons = [
  {
    id: 'combles',
    onglet: 'Combles',
    titre: 'Combles aménagés en chambre',
    texte: 'Préparation des supports, plafonds rampants, poutres mises en valeur, peinture.',
    avant: { src: combleAvant, alt: 'Combles avant travaux : charpente brute, murs en pierre abîmés, isolant apparent' },
    apres: { src: combleApres, alt: 'Les combles après travaux : chambre lumineuse aux murs blancs, poutres apparentes, velux' },
  },
  {
    id: 'piece',
    onglet: 'Pièce de vie',
    titre: 'Pièce de vie, reprise complète',
    texte: 'Dépose, reprise des murs et plafonds, arche dégagée, sol posé.',
    avant: { src: pieceAvant, alt: 'Pièce de vie avant travaux : murs abîmés, poutres sombres, pièce encombrée' },
    // À REMPLACER par la photo « après » prise sous le même angle
    apres: { src: sejourVoute, alt: 'La même pièce après travaux : murs blancs, arche dégagée, carrelage neuf' },
  },
];

// ── Réalisations ──────────────────────────────────────────────
// À COMPLÉTER : commune de chaque chantier, photos originales en HD.
export const realisations = [
  {
    titre: 'Séjour voûté',
    lieu: '', // ex. « Les Ancizes-Comps »
    travaux: ['Préparation des murs', 'Peinture murs & plafonds', 'Carrelage'],
    image: sejourVoute,
    alt: 'Séjour aux murs blancs avec une arche, sol carrelé neuf',
  },
  {
    titre: 'Salon & cheminée centrale',
    lieu: '',
    travaux: ['Enduits de lissage', 'Peinture', 'Finitions'],
    image: cheminee,
    alt: 'Salon lumineux avec cheminée centrale noire et baies vitrées',
  },
  {
    titre: 'Chambre sous combles',
    lieu: '',
    travaux: ['Plafonds rampants', 'Mise en valeur des poutres', 'Peinture'],
    image: combleApres,
    alt: 'Chambre mansardée aux murs blancs, poutres en bois apparentes et velux',
  },
];

// ── Étapes : de la demande de devis à la livraison ────────────
export const etapes = [
  {
    titre: 'Premier échange',
    texte:
      'Vous nous présentez votre projet par téléphone ou via le formulaire. Nous vous rappelons sous 48 heures pour convenir d’un rendez-vous.',
    duree: 'Sous 48 h',
  },
  {
    titre: 'Visite-conseil sur place',
    texte:
      'Nous nous déplaçons gratuitement chez vous pour examiner les supports, prendre les mesures et vous conseiller sur les produits et les teintes.',
    duree: 'Gratuite',
  },
  {
    titre: 'Devis détaillé',
    texte:
      'Vous recevez une proposition chiffrée poste par poste. Chaque prestation et chaque produit y sont décrits, sans ligne imprécise.',
    duree: 'Sous une semaine',
  },
  {
    titre: 'Planification',
    texte:
      'Après validation, nous fixons ensemble la date de début et la durée du chantier. Vous connaissez le calendrier avant le premier jour.',
    duree: 'Date garantie',
  },
  {
    titre: 'Réalisation des travaux',
    texte:
      'Protection des sols et du mobilier, préparation des supports, application. Le chantier est rangé chaque soir et vous êtes tenu informé de l’avancement.',
    duree: 'Suivi régulier',
  },
  {
    titre: 'Réception & livraison',
    texte:
      'Nous faisons le tour des pièces avec vous, à la lumière du jour. Les éventuelles retouches sont reprises avant la remise du chantier propre.',
    duree: 'Chantier propre',
  },
];

// Nuancier : teintes de référence, nommées d'après la région.
export const nuancier = [
  { id: 'chaux', nom: 'Blanc de chaux', lieu: 'Enduits traditionnels', hex: '#E2DACB', ink: '#1F1D1A' },
  { id: 'volvic', nom: 'Gris Volvic', lieu: 'Pierre de lave', hex: '#56595C', ink: '#F3EFE7' },
  { id: 'sioule', nom: 'Vert Sioule', lieu: 'Vallée de la Sioule', hex: '#3F5A45', ink: '#F1EDE3' },
  { id: 'limagne', nom: 'Ocre Limagne', lieu: 'Terres de la Limagne', hex: '#C08A3E', ink: '#1F1D1A' },
  { id: 'tuile', nom: 'Rouge tuile', lieu: 'Toitures anciennes', hex: '#9B4B34', ink: '#F4EEE4' },
  { id: 'puys', nom: 'Bleu des Puys', lieu: 'Ciel des volcans', hex: '#8DA3B3', ink: '#1F1D1A' },
  { id: 'basalte', nom: 'Noir basalte', lieu: 'Roche volcanique', hex: '#1F1D1A', ink: '#EFEAE0' },
] as const;

export const services = [
  {
    id: 'interieur',
    titre: 'Peinture intérieure',
    court: 'Murs, plafonds, cages d’escalier.',
    texte:
      'Rebouchage, ponçage, impression adaptée au support, puis deux couches croisées. Nous choisissons avec vous la finition, mate, velours ou satinée, selon l’usage de la pièce et sa lumière.',
    points: ['Murs & plafonds', 'Cages d’escalier', 'Pièces humides', 'Peintures A+'],
    teinte: 'chaux',
  },
  {
    id: 'preparation',
    titre: 'Préparation & finitions',
    court: 'Enduits, reprises, revêtements.',
    texte:
      'Une peinture ne masque pas un défaut : elle le révèle. Enduits de lissage, reprises de plâtre, bandes et toile de verre préparent des surfaces parfaitement planes. Nous assurons également la pose de revêtements de sol en complément.',
    points: ['Enduits de lissage', 'Reprises de plâtre', 'Toile de verre', 'Revêtements de sol'],
    teinte: 'volvic',
  },
  {
    id: 'facade',
    titre: 'Façades & extérieurs',
    court: 'Façades, pignons, soubassements.',
    texte:
      'Nettoyage, traitement des microfissures, puis peinture minérale ou siloxane qui laisse respirer la maçonnerie. Des produits choisis pour résister aux écarts de température de la région.',
    points: ['Nettoyage & démoussage', 'Traitement des fissures', 'Peintures minérales', 'Soubassements'],
    teinte: 'sioule',
  },
  {
    id: 'boiseries',
    titre: 'Boiseries & volets',
    court: 'Volets, portes, fenêtres, avant-toits.',
    texte:
      'Décapage, égrenage, puis lasure ou laque microporeuse. Vos menuiseries retrouvent une protection durable et une teinte homogène.',
    points: ['Volets battants', 'Portes & fenêtres', 'Dessous de toit', 'Lasures & laques'],
    teinte: 'limagne',
  },
  {
    id: 'decoration',
    titre: 'Décoration & conseil couleur',
    court: 'Harmonies, effets, papiers peints.',
    texte:
      'Enduits à la chaux, effets décoratifs, papiers peints. Nous apportons des échantillons et les posons chez vous, afin que le choix se fasse dans la lumière réelle de la pièce.',
    points: ['Conseil couleur', 'Enduits à la chaux', 'Papiers peints', 'Effets décoratifs'],
    teinte: 'tuile',
  },
] as const;

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
    court: 'Saint-Georges-de-Mons, Les Ancizes-Comps, Pontaumur…',
    titreSeo: 'Peintre en bâtiment dans les Combrailles',
    descriptionSeo:
      'Artisan peintre à Saint-Georges-de-Mons : peinture intérieure, préparation des supports, façades et boiseries dans les Combrailles. Visite et devis gratuits.',
    accroche: 'Notre secteur d’origine, où nous intervenons au quotidien.',
    intro:
      'Notre entreprise est installée à Saint-Georges-de-Mons. Maisons de bourg, fermes rénovées, résidences principales ou secondaires : nous accompagnons les particuliers des Combrailles dans leurs travaux de peinture et de finition, de la visite à la livraison.',
    terrain: [
      { titre: 'Bâti ancien', texte: 'Pour les murs épais en pierre, nous privilégions la chaux et les peintures minérales, qui laissent la maçonnerie respirer.' },
      { titre: 'Climat', texte: 'Pour les volets et façades, nous sélectionnons des produits microporeux adaptés au gel et aux fortes variations de température.' },
      { titre: 'Résidences secondaires', texte: 'En votre absence, nous organisons le chantier et vous transmettons des photos à chaque étape.' },
    ],
    communes: [
      'Saint-Georges-de-Mons', 'Les Ancizes-Comps', 'Manzat', 'Pontaumur', 'Pontgibaud', 'Saint-Gervais-d’Auvergne',
      'Saint-Éloy-les-Mines', 'Menat', 'Châteauneuf-les-Bains', 'Queuille', 'Miremont', 'Loubeyrat', 'Charbonnières-les-Vieilles',
    ],
    faq: [
      { q: 'Dans quelles communes des Combrailles intervenez-vous ?', r: 'Nous intervenons principalement autour de Saint-Georges-de-Mons et des Ancizes-Comps, et plus largement dans l’ensemble des Combrailles. La visite et le devis sont gratuits.' },
      { q: 'Quelle peinture choisir pour une maison en pierre ?', r: 'Pour des murs anciens, nous recommandons une peinture ou un enduit à la chaux, ou une peinture minérale respirante. Les peintures acryliques épaisses retiennent l’humidité et finissent par cloquer.' },
      { q: 'Pouvez-vous intervenir en notre absence ?', r: 'Oui. Nous convenons ensemble de la remise des clés, vous tenons informés par photos à chaque étape et organisons la réception sur place ou à distance.' },
    ],
    teinte: 'sioule',
  },
  {
    slug: 'peintre-riom',
    nom: 'Riom',
    dans: 'à Riom',
    court: 'Riom, Châtel-Guyon, Volvic et alentours.',
    titreSeo: 'Peintre en bâtiment à Riom et alentours',
    descriptionSeo:
      'Artisan peintre pour Riom, Châtel-Guyon, Volvic et Mozac : peinture intérieure, finitions, façades et boiseries. Visite et devis gratuits.',
    accroche: 'Riom et ses environs, à proximité immédiate de notre atelier.',
    intro:
      'Riom se trouve à quelques kilomètres de notre base. Appartements du centre ancien, maisons de ville et pavillons : nous y réalisons des travaux de peinture intérieure et extérieure avec le même niveau d’exigence.',
    terrain: [
      { titre: 'Centre ancien', texte: 'Pour les façades et menuiseries visibles depuis la rue, nous vérifions avec vous les teintes autorisées avant le début des travaux.' },
      { titre: 'Menuiseries anciennes', texte: 'Volets, portes et fenêtres en bois sont préparés avec soin avant l’application de la lasure ou de la laque.' },
      { titre: 'Remise en état locative', texte: 'Pour les propriétaires bailleurs, nous proposons des interventions rapides sur la base d’un devis ferme.' },
    ],
    communes: ['Riom', 'Châtel-Guyon', 'Mozac', 'Volvic', 'Ménétrol', 'Marsat', 'Enval', 'Combronde', 'Saint-Bonnet-près-Riom', 'Ennezat'],
    faq: [
      { q: 'Intervenez-vous dans le centre historique de Riom ?', r: 'Oui. Pour les façades et menuiseries visibles depuis la rue, nous vous aidons à vérifier les teintes autorisées avant de commencer.' },
      { q: 'Combien de temps faut-il pour repeindre un appartement ?', r: 'Pour un T3 en bon état, comptez généralement une à deux semaines selon la préparation nécessaire. Le planning précis figure sur le devis.' },
      { q: 'Prenez-vous en charge les volets et les encadrements ?', r: 'Oui, volets en bois et en métal, portes et fenêtres. Les encadrements en pierre sont protégés et laissés à nu, sauf demande contraire.' },
    ],
    teinte: 'volvic',
  },
  {
    slug: 'peintre-clermont-ferrand',
    nom: 'Clermont-Ferrand',
    dans: 'à Clermont-Ferrand',
    court: 'Clermont-Ferrand et l’ouest de la métropole.',
    titreSeo: 'Peintre en bâtiment à Clermont-Ferrand',
    descriptionSeo:
      'Artisan peintre pour Clermont-Ferrand, Chamalières, Royat et Durtol : appartements, maisons, parties communes. Visite et devis gratuits.',
    accroche: 'Appartements, maisons et copropriétés de la métropole.',
    intro:
      'Nous intervenons régulièrement à Clermont-Ferrand et dans l’ouest de la métropole. Appartements anciens, maisons individuelles ou parties communes : chaque chantier bénéficie d’une préparation soignée et d’un suivi attentif.',
    terrain: [
      { titre: 'Appartements anciens', texte: 'Moulures, hauts plafonds, parquets : protection complète et finitions réalisées à la main, dans le respect du voisinage.' },
      { titre: 'Copropriétés', texte: 'Halls, cages d’escalier, paliers : nous nous coordonnons avec le syndic et sécurisons les accès pendant les travaux.' },
      { titre: 'Remise en état locative', texte: 'Pour les propriétaires bailleurs, nous proposons des interventions rapides sur la base d’un devis ferme.' },
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
  { q: 'Le devis est-il gratuit ?', r: 'Oui. La visite sur place et le devis détaillé sont gratuits et sans engagement.' },
  { q: 'Réalisez-vous des rénovations complètes ?', r: 'Notre cœur de métier est la peinture et tout ce qui la prépare : enduits, reprises de plâtre, toile de verre, ainsi que certains revêtements de sol. Pour les corps de métier que nous n’exerçons pas, nous pouvons vous recommander des artisans de confiance.' },
  { q: 'Quels produits utilisez-vous ?', r: 'Des peintures professionnelles en phase aqueuse, classées A+ pour l’intérieur, minérales ou siloxanes pour l’extérieur. Les marques et références figurent sur le devis.' },
  { q: 'Êtes-vous assurés ?', r: 'Oui. Nous disposons d’une assurance responsabilité civile professionnelle et d’une garantie décennale, dont l’attestation est jointe à chaque devis.' },
  { q: 'Comment protégez-vous mon logement pendant les travaux ?', r: 'Sols, mobilier et menuiseries sont protégés avant toute intervention. Le chantier est rangé chaque soir et remis propre à la livraison.' },
];

export const zoneBySlug = (slug: string) => zones.find((z) => z.slug === slug)!;
export const teinte = (id: string) => nuancier.find((t) => t.id === id) ?? nuancier[0];
