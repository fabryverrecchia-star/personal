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
const metierFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/metier/*.jpg', { eager: true });
const m = (slug: string) => metierFiles[`../assets/metier/${slug}.jpg`].default;
// Photo par identifiant, qu'elle vienne de la galerie ou des photos métier
export const visuel = (slug: string) => metierFiles[`../assets/metier/${slug}.jpg`]?.default ?? g(slug);

export const site = {
  url: 'https://18h22.com/blandry', // À COMPLÉTER : domaine définitif
  nom: 'Benjamin Landry',
  monogramme: 'BL',
  metier: 'Plâtrerie, peinture et carrelage',
  metierCourt: 'Plaquiste et peintre',
  gerant: 'Benjamin Landry',
  telephone: '06 58 38 78 37',
  email: 'contact@blandry.fr', // À COMPLÉTER
  adresse: {
    rue: '59 rue du Boucheix',
    codePostal: '63770',
    ville: 'Les Ancizes-Comps',
    region: 'Auvergne-Rhône-Alpes',
    departement: 'Puy-de-Dôme',
  },
  geo: { lat: 45.9167, lng: 2.8167 }, // centre des Ancizes-Comps (à affiner avec la position exacte du siège)
  formeJuridique: 'Entrepreneur individuel',
  siren: '822 175 519',
  siret: '822 175 519 00021',
  registre: 'Inscrit au Registre national des entreprises (RNE) depuis le 15 octobre 2021',
  // Zone d'intervention : chantiers à 1 h 30 de route maximum du siège
  zoneIntervention: 'jusqu’à 1 h 30 de route autour des Ancizes-Comps',
  assurance: 'Garantie décennale', // À COMPLÉTER : nom de l'assureur
  horaires: 'Du lundi au vendredi, de 8 h à 18 h',
  delaiReponse: 'Réponse sous 48 heures',
  reseaux: { instagram: 'https://www.instagram.com/benjamin_landry_finitions/' } as Record<string, string>,
};

export const instagram = {
  compte: '@benjamin_landry_finitions',
  url: site.reseaux.instagram,
  photos: ['chambre-bleu-nuit', 'bibliotheque-rouge', 'cuisine-lineaire', 'sejour-poutres'].map(g),
};

export const telHref = `tel:${site.telephone.replace(/\s/g, '').replace(/^0/, '+33')}`;

export const photos = {
  artisan: { src: artisan, alt: 'Ponçage d’un plafond à la ponceuse girafe, sous une lumière rasante' },
  detail: { src: applique, alt: 'Applique murale sur un mur parfaitement lissé, sous un plafond rampant' },
  finition: { src: finition, alt: 'Angle de mur arrondi, enduit parfaitement lisse baigné de lumière' },
  arche: { src: g('pierre-poutres'), alt: 'Mur en pierre apparente et enduit lissé, applique murale' },
};

// ── Nuancier du territoire ────────────────────────────────────
// Couleurs d'inspiration (affichées sans nom ni référence) : les teintes réelles
// sont choisies avec le client sur les nuanciers des fabricants.
export const palette = [
  { id: 'chaux', origine: 'les enduits à la chaux des maisons de bourg', hex: '#E2DACB' },
  { id: 'limagne', origine: 'les terres de Limagne', hex: '#C08A3E' },
  { id: 'tuile', origine: 'les toits de tuile des villages', hex: '#9B4B34' },
  { id: 'sioule', origine: 'les forêts des gorges de la Sioule', hex: '#3F5A45' },
  { id: 'puys', origine: 'le ciel de la Chaîne des Puys', hex: '#8DA3B3' },
  { id: 'volvic', origine: 'la pierre de Volvic', hex: '#56595C' },
  { id: 'basalte', origine: 'les coulées de basalte', hex: '#1F1D1A' },
];

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
const P = (slug: string, titre: string, cat: Photo['cat']): Photo => ({ src: visuel(slug), titre, cat });

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
  P('placo-vissage', '', 'Intérieur'),
  P('mur-pierre-applique', '', 'Intérieur'),
  P('enduit-couteau', '', 'Intérieur'),
  P('douche-carrelage', '', 'Intérieur'),
  P('poncage-main', '', 'Intérieur'),
  P('chambre-vert-sapin', '', 'Intérieur'),
  P('placo-plafond-bandes', '', 'Intérieur'),
  P('salon-papier-peint', '', 'Intérieur'),
];

// ── De l'ossature à la dernière couche (section « Le placo ») ─────
export const chaine = [
  { titre: 'Tracer et monter', texte: 'Rails et montants tracés au laser, plaques vissées à entraxe régulier. Une cloison droite commence par une ossature juste.', photo: m('placo-vissage'), alt: 'Vissage d’une plaque de plâtre hydrofuge le long d’un trait laser' },
  { titre: 'Jointer', texte: 'Bandes et enduit à joints sur chaque raccord et chaque tête de vis, au plafond comme aux murs.', photo: m('placo-plafond-bandes'), alt: 'Pose de bandes et d’enduit à joints sur un plafond en plaques de plâtre' },
  { titre: 'Lisser', texte: 'Enduit de finition tiré au couteau large, passe après passe, jusqu’à une surface parfaitement plane.', photo: m('enduit-couteau'), alt: 'Enduit de lissage appliqué au couteau sur un mur clair' },
  { titre: 'Poncer et contrôler', texte: 'Ponçage à la main dans les angles, contrôle à la lumière rasante : aucun défaut ne doit survivre à cette étape.', photo: m('poncage-main'), alt: 'Ponçage à la main d’un angle de mur sous une lumière chaude' },
  { titre: 'Peindre', texte: 'Impression, puis deux couches croisées, sous une baladeuse pour vérifier chaque passe.', photo: m('peinture-baladeuse'), alt: 'Peinture d’un mur au rouleau à la lumière d’une baladeuse' },
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
    texte: 'Plâtrerie, préparation, peinture et carrelage sont chiffrés poste par poste. Le prix accepté est celui facturé.',
  },
  {
    titre: 'Visite et devis gratuits',
    texte: 'Le déplacement, l’examen des supports et l’établissement du devis ne vous engagent à rien et ne vous coûtent rien.',
  },
  {
    titre: 'Matériaux professionnels',
    texte: 'Plaques et isolants conformes aux DTU, peintures en phase aqueuse classées A+ : une qualité de l’air intérieur préservée dès la fin du chantier.',
  },
];

// ── Marques et fournisseurs (bandeau défilant) ──────────────
// Logos officiels à déposer dans src/assets/marques/<id>.svg (ou .png)
const marqueFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/marques/*.{svg,png,webp}', { eager: true });
const marqueLogo = (id: string) =>
  Object.entries(marqueFiles).find(([k]) => k.split('/').pop()!.split('.')[0] === id)?.[1].default;
export const marques = [
  { id: 'caparol', nom: 'Caparol' },
  { id: 'tollens', nom: 'Tollens' },
  { id: 'gedimat', nom: 'Gedimat' },
  { id: 'bigmat', nom: 'BigMat' },
].map((m) => ({ ...m, logo: marqueLogo(m.id) }));

// ── Savoir-faire ──────────────────────────────────────────────
export const services = [
  {
    id: 'platrerie',
    titre: 'Plâtrerie et cloisons sèches',
    texte:
      'Cloisons, contre-cloisons et aménagements en plaques de plâtre sur ossature métallique. Rails tracés au laser, montants calés, plaques standard, hydrofuges, phoniques ou coupe-feu selon la pièce : une structure droite et solide, prête à recevoir la finition.',
    photo: 'placo-vissage',
  },
  {
    id: 'plafonds',
    titre: 'Plafonds, doublages et isolation',
    texte:
      'Faux plafonds suspendus, doublages collés ou sur ossature, isolation thermique et acoustique des murs et des combles. Des pièces plus confortables et des surfaces parfaitement planes, du sol au plafond.',
    photo: 'placo-plafond-bandes',
  },
  {
    id: 'bandes',
    titre: 'Bandes, enduits et préparation',
    texte:
      'Bandes à joints, enduits de lissage, reprises de plâtre et ponçage soigné. C’est l’étape que l’on ne voit plus une fois le chantier terminé, et celle qui décide de tout : une peinture ne corrige pas un défaut, elle le révèle.',
    photo: 'enduit-couteau',
  },
  {
    id: 'peinture',
    titre: 'Peinture intérieure et extérieure',
    texte:
      'Murs, plafonds, boiseries, volets et façades. Chaque support reçoit l’impression qui lui convient, puis deux couches croisées, dans la finition mate, velours ou satinée adaptée à l’usage de la pièce et à sa lumière.',
    photo: 'peinture-baladeuse',
  },
  {
    id: 'carrelage',
    titre: 'Carrelage et faïence',
    texte:
      'Sols, murs de salle de bains, douches à l’italienne et crédences. Support préparé et mis à niveau, étanchéité sous carrelage dans les pièces d’eau, calepinage étudié et joints réguliers.',
    photo: 'douche-carrelage',
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
    texte: 'Nous examinons les murs, plafonds et sols, relevons les surfaces et vous conseillons sur les matériaux, les finitions et les teintes. La visite est gratuite.',
    duree: 'Sans frais',
  },
  {
    titre: 'Devis détaillé',
    texte: 'Chaque poste est décrit : surfaces, type de plaques et d’isolant, préparation, produits, nombre de couches. Aucune ligne imprécise, aucun supplément découvert en cours de route.',
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
    slug: 'plaquiste-peintre-combrailles',
    nom: 'Combrailles',
    dans: 'dans les Combrailles',
    court: 'Les Ancizes-Comps, Saint-Georges-de-Mons, Pontaumur',
    titreSeo: 'Plaquiste et peintre dans les Combrailles',
    descriptionSeo:
      'Artisan plaquiste et peintre aux Ancizes-Comps : cloisons et plafonds en placo, isolation, peinture et carrelage dans les Combrailles. Visite et devis gratuits.',
    accroche: 'Notre secteur d’origine, où nous intervenons au quotidien.',
    intro:
      'L’entreprise est installée aux Ancizes-Comps, au cœur des Combrailles. Maisons de bourg, fermes rénovées, combles à aménager : nous montons les cloisons, isolons, préparons et peignons, de la première visite à la réception des travaux.',
    terrain: [
      { titre: 'Rénovation de l’ancien', texte: 'Murs irréguliers, combles, pièces à redistribuer : doublages et cloisons en plaques de plâtre redonnent des surfaces droites et isolées.' },
      { titre: 'Climat du plateau', texte: 'Isolation des murs et des combles adaptée aux hivers des Combrailles, produits extérieurs conçus pour le gel.' },
      { titre: 'Résidences secondaires', texte: 'En votre absence, nous organisons le chantier et vous transmettons des photographies à chaque étape.' },
    ],
    communes: [
      'Les Ancizes-Comps', 'Saint-Georges-de-Mons', 'Manzat', 'Pontaumur', 'Pontgibaud', 'Saint-Gervais-d’Auvergne',
      'Saint-Éloy-les-Mines', 'Menat', 'Châteauneuf-les-Bains', 'Queuille', 'Miremont', 'Loubeyrat', 'Charbonnières-les-Vieilles',
    ],
    faq: [
      { q: 'Dans quelles communes des Combrailles intervenez-vous ?', r: 'Principalement autour des Ancizes-Comps et de Saint-Georges-de-Mons, et plus largement dans l’ensemble des Combrailles. La visite et le devis sont gratuits.' },
      { q: 'Pouvez-vous aménager des combles ?', r: 'Oui : isolation, doublage des rampants, cloisons et plafonds en plaques de plâtre, puis bandes, enduits et peinture. Un seul artisan du début à la fin.' },
      { q: 'Quelle peinture pour une maison en pierre ?', r: 'Sur des murs anciens, une peinture ou un enduit à la chaux, ou une peinture minérale respirante. Les peintures acryliques épaisses retiennent l’humidité et finissent par cloquer.' },
      { q: 'Pouvez-vous intervenir en notre absence ?', r: 'Oui. Nous convenons de la remise des clés, vous informons par photographies à chaque étape et organisons la réception sur place ou à distance.' },
    ],
    teinte: 'sioule',
  },
  {
    slug: 'plaquiste-peintre-riom',
    nom: 'Riom',
    dans: 'à Riom',
    court: 'Riom, Châtel-Guyon, Volvic, Mozac',
    titreSeo: 'Plaquiste et peintre à Riom et alentours',
    descriptionSeo:
      'Plaquiste et peintre pour Riom, Châtel-Guyon, Volvic et Mozac : cloisons et plafonds en placo, isolation, peinture et carrelage. Visite et devis gratuits.',
    accroche: 'Riom et ses environs, à une quarantaine de minutes de notre atelier.',
    intro:
      'Riom se trouve à une quarantaine de minutes de notre atelier des Ancizes-Comps. Appartements du centre ancien, maisons de ville, pavillons : plâtrerie, peinture et carrelage, avec la même exigence.',
    terrain: [
      { titre: 'Centre ancien', texte: 'Pour les façades et menuiseries visibles depuis la rue, nous vérifions avec vous les teintes autorisées avant le début des travaux.' },
      { titre: 'Redistribution des pièces', texte: 'Création de cloisons, de faux plafonds et de rangements intégrés en plaques de plâtre, livrés prêts à vivre.' },
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
    slug: 'plaquiste-peintre-clermont-ferrand',
    nom: 'Clermont-Ferrand',
    dans: 'à Clermont-Ferrand',
    court: 'Clermont-Ferrand, Chamalières, Royat, Durtol',
    titreSeo: 'Plaquiste et peintre à Clermont-Ferrand',
    descriptionSeo:
      'Plaquiste et peintre pour Clermont-Ferrand, Chamalières, Royat et Durtol : cloisons, faux plafonds, isolation, peinture et carrelage. Visite et devis gratuits.',
    accroche: 'Appartements, maisons et copropriétés de la métropole.',
    intro:
      'Nous intervenons régulièrement à Clermont-Ferrand et dans l’ouest de la métropole. Appartements anciens, maisons individuelles ou parties communes : plâtrerie, peinture et carrelage, avec une préparation soignée et un suivi attentif.',
    terrain: [
      { titre: 'Appartements anciens', texte: 'Hauts plafonds, cloisons à reprendre, salles de bains à refaire : protection complète et finitions à la main, dans le respect du voisinage.' },
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
  { q: 'Jusqu’où vous déplacez-vous ?', r: 'Nous intervenons jusqu’à 1 h 30 de route autour de notre atelier des Ancizes-Comps : les Combrailles, Riom, Clermont-Ferrand et leurs environs. La visite et le devis sont gratuits dans toute cette zone.' },
  { q: 'Quels travaux réalisez-vous ?', r: 'Le second œuvre intérieur, de l’ossature à la finition : cloisons et plafonds en plaques de plâtre, doublages et isolation, bandes et enduits, peinture intérieure et extérieure, carrelage et faïence. Pour l’électricité, la plomberie ou la menuiserie, nous vous orientons vers des artisans de confiance.' },
  { q: 'Pourquoi confier le placo et la peinture au même artisan ?', r: 'Parce que la qualité d’une peinture dépend de la plâtrerie qui la porte. En réalisant les deux, nous maîtrisons la planéité, les joints et les angles : aucun défaut laissé par un autre corps de métier, un seul interlocuteur et un planning plus court.' },
  { q: 'Quels matériaux utilisez-vous ?', r: 'Des plaques de plâtre standard, hydrofuges, phoniques ou coupe-feu selon la pièce, des isolants adaptés, et des peintures professionnelles classées A+ pour l’intérieur. Les marques et références figurent sur le devis.' },
  { q: 'Quelles garanties couvrent vos travaux ?', r: 'Nos travaux sont couverts par une garantie décennale et une assurance responsabilité civile professionnelle, dont l’attestation est jointe au devis. S’y ajoute la garantie de parfait achèvement : pendant un an après la réception, tout désordre signalé est repris à nos frais.' },
  { q: 'Comment votre logement est-il protégé ?', r: 'Sols, mobilier et menuiseries sont protégés avant toute intervention. La poussière de ponçage est limitée et aspirée, le chantier est rangé chaque soir et remis propre à la livraison.' },
];

// Compatibilité (anciens composants)
export const realisations = selection.map((p) => ({ titre: p.titre, lieu: '', travaux: [p.cat], image: p.src, alt: p.titre }));
export const nuancier = palette;
export const teinte = (_id: string) => nuancier[0];
export const zoneBySlug = (slug: string) => zones.find((z) => z.slug === slug)!;
