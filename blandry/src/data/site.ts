// ─────────────────────────────────────────────────────────────
//  Toutes les informations de l'entreprise sont ici.
//  Les lignes marquées « À COMPLÉTER » doivent être vérifiées
//  avant la mise en ligne (elles servent aussi au référencement).
// ─────────────────────────────────────────────────────────────

export const site = {
  url: 'https://18h22.com/blandry', // À COMPLÉTER : domaine définitif
  nom: 'Blandry',
  metier: 'Peintre en bâtiment',
  signature: 'Peinture & décoration — Combrailles, Riom, Clermont-Ferrand',
  gerant: 'B. Landry', // À COMPLÉTER
  telephone: '06 00 00 00 00', // À COMPLÉTER
  email: 'contact@blandry.fr', // À COMPLÉTER
  // Commune du siège : c'est elle qui ancre l'entreprise localement pour Google.
  adresse: {
    rue: '', // À COMPLÉTER (facultatif si vous ne recevez pas de clients)
    codePostal: '63390', // À COMPLÉTER
    ville: 'Saint-Gervais-d’Auvergne', // À COMPLÉTER
    region: 'Auvergne-Rhône-Alpes',
    departement: 'Puy-de-Dôme',
  },
  geo: { lat: 46.0333, lng: 2.8167 }, // À COMPLÉTER : coordonnées du siège
  siret: '', // À COMPLÉTER
  assurance: 'Garantie décennale', // À COMPLÉTER : nom de l'assureur
  horaires: 'Du lundi au vendredi, 8 h – 18 h',
  delaiReponse: 'Réponse sous 48 h, devis gratuit après visite',
  reseaux: {
    // instagram: 'https://instagram.com/…',
    // google: 'https://g.page/…',
  } as Record<string, string>,
};

export const telHref = `tel:${site.telephone.replace(/\s/g, '').replace(/^0/, '+33')}`;

// Nuancier maison : chaque teinte porte le nom d'un lieu du secteur.
export const nuancier = [
  { id: 'chaux', nom: 'Blanc de chaux', lieu: 'Enduits des bourgs', hex: '#E2DACB', ink: '#1F1D1A' },
  { id: 'volvic', nom: 'Gris Volvic', lieu: 'Pierre de lave, Riom', hex: '#56595C', ink: '#F3EFE7' },
  { id: 'sioule', nom: 'Vert Sioule', lieu: 'Gorges de la Sioule', hex: '#3F5A45', ink: '#F1EDE3' },
  { id: 'limagne', nom: 'Ocre Limagne', lieu: 'Plaine de la Limagne', hex: '#C08A3E', ink: '#1F1D1A' },
  { id: 'tuile', nom: 'Rouge tuile', lieu: 'Toits de Combronde', hex: '#9B4B34', ink: '#F4EEE4' },
  { id: 'puys', nom: 'Bleu des Puys', lieu: 'Ciel de la Chaîne des Puys', hex: '#8DA3B3', ink: '#1F1D1A' },
  { id: 'basalte', nom: 'Noir basalte', lieu: 'Coulées de Volvic', hex: '#1F1D1A', ink: '#EFEAE0' },
] as const;

export const services = [
  {
    id: 'interieur',
    titre: 'Peinture intérieure',
    court: 'Murs, plafonds, cages d’escalier.',
    texte:
      'Rebouchage, ponçage, sous-couche adaptée au support, deux couches croisées. Mat profond, velours ou satin : on choisit la finition selon la pièce et la lumière, pas selon le catalogue.',
    points: ['Murs & plafonds', 'Cages d’escalier', 'Pièces humides', 'Peintures sans odeur, A+'],
    teinte: 'chaux',
  },
  {
    id: 'facade',
    titre: 'Façades & extérieurs',
    court: 'Peinture de façade, pignons, soubassements.',
    texte:
      'Entre les hivers du plateau des Combrailles et le soleil de la Limagne, une façade travaille. Nettoyage, traitement des microfissures, peinture siloxane ou minérale qui laisse respirer la pierre.',
    points: ['Nettoyage & démoussage', 'Traitement des fissures', 'Peintures minérales & siloxanes', 'Soubassements'],
    teinte: 'volvic',
  },
  {
    id: 'boiseries',
    titre: 'Boiseries & volets',
    court: 'Volets, portes, fenêtres, avant-toits.',
    texte:
      'Décapage, égrenage, lasure ou laque microporeuse. Les volets battants des maisons de bourg et les dessous de toit retrouvent une protection durable — et leur couleur.',
    points: ['Volets battants', 'Portes & fenêtres bois', 'Dessous de toit', 'Lasures & laques'],
    teinte: 'sioule',
  },
  {
    id: 'decoration',
    titre: 'Décoration & conseil couleur',
    court: 'Harmonies, effets, papiers peints.',
    texte:
      'Chaux, badigeon, effets tadelakt, papiers peints panoramiques. On vient avec des échantillons, on les pose au mur chez vous, et on décide à la lumière du jour.',
    points: ['Conseil couleur sur place', 'Enduits à la chaux', 'Papiers peints', 'Effets décoratifs'],
    teinte: 'limagne',
  },
  {
    id: 'preparation',
    titre: 'Préparation des supports',
    court: 'Enduits, bandes, petites reprises.',
    texte:
      'La peinture ne cache rien : elle révèle. Enduits de lissage, reprises de plâtre, joints de plaques, toile de verre. Les petits travaux de rénovation qui précèdent la couleur, faits proprement.',
    points: ['Enduits de lissage', 'Reprises de plâtre', 'Toile de verre', 'Joints de plaques'],
    teinte: 'tuile',
  },
] as const;

export const methode = [
  { n: '01', titre: 'Visite', texte: 'On se déplace chez vous, sans frais. On regarde les supports, la lumière, l’usage des pièces.' },
  { n: '02', titre: 'Devis clair', texte: 'Un devis détaillé poste par poste, avec les produits nommés. Pas de ligne « divers ».' },
  { n: '03', titre: 'Protection', texte: 'Sols, meubles, menuiseries : tout est protégé avant la première goutte. Chantier rangé chaque soir.' },
  { n: '04', titre: 'Finitions', texte: 'Réception ensemble, pièce par pièce, à la lumière du jour. On repasse si un détail ne va pas.' },
];

export type Zone = {
  slug: string;
  nom: string;
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
    court: 'Chez nous, sur le plateau.',
    titreSeo: 'Peintre en bâtiment dans les Combrailles — Saint-Gervais, Pontaumur, Saint-Éloy',
    descriptionSeo:
      'Artisan peintre installé dans les Combrailles : peinture intérieure, façades, volets et boiseries à Saint-Gervais-d’Auvergne, Pontaumur, Saint-Éloy-les-Mines, Manzat, Pontgibaud. Devis gratuit.',
    accroche: 'Peintre dans les Combrailles, du bourg à la ferme.',
    intro:
      'Les Combrailles, c’est notre secteur de tous les jours. Maisons de bourg en granit, fermes rénovées, longères qu’on rouvre après des années : on connaît les murs d’ici, l’humidité des vallées de la Sioule et les hivers qui mettent les façades à l’épreuve.',
    terrain: [
      { titre: 'Pierre & granit', texte: 'Des murs épais qui doivent respirer. On privilégie la chaux et les peintures minérales plutôt qu’un film qui emprisonne l’humidité.' },
      { titre: 'Hivers du plateau', texte: 'Gel, pluie, écarts de température : pour les volets et façades, on choisit des produits microporeux faits pour tenir ici.' },
      { titre: 'Résidences secondaires', texte: 'Vous n’êtes pas sur place ? On organise le chantier, on vous envoie des photos à chaque étape.' },
    ],
    communes: [
      'Saint-Gervais-d’Auvergne', 'Pontaumur', 'Saint-Éloy-les-Mines', 'Pontgibaud', 'Manzat', 'Menat',
      'Les Ancizes-Comps', 'Saint-Georges-de-Mons', 'Châteauneuf-les-Bains', 'Montaigut', 'Pionsat',
      'Saint-Priest-des-Champs', 'Miremont', 'Herment', 'Giat', 'Queuille', 'Loubeyrat', 'Charbonnières-les-Vieilles',
    ],
    faq: [
      { q: 'Vous déplacez-vous dans tout le secteur des Combrailles ?', r: 'Oui, de Pionsat à Pontgibaud et de Saint-Éloy-les-Mines à Herment. La visite et le devis sont gratuits.' },
      { q: 'Quelle peinture pour une maison en pierre des Combrailles ?', r: 'Pour des murs anciens, une peinture ou un enduit à la chaux, ou une peinture minérale respirante. On évite les peintures acryliques épaisses qui piègent l’humidité et finissent par cloquer.' },
      { q: 'Pouvez-vous intervenir dans une résidence secondaire en notre absence ?', r: 'Oui. On récupère les clés, on vous tient informé avec des photos à chaque étape, et on fait la réception avec vous en visio ou sur place.' },
    ],
    teinte: 'sioule',
  },
  {
    slug: 'peintre-riom',
    nom: 'Riom',
    court: 'Pierre de Volvic et Limagne.',
    titreSeo: 'Peintre à Riom — Châtel-Guyon, Mozac, Volvic, Ennezat',
    descriptionSeo:
      'Artisan peintre à Riom et alentours : peinture intérieure, façades, volets, enduits à la chaux. Châtel-Guyon, Mozac, Volvic, Ennezat, Combronde, Aigueperse. Devis gratuit après visite.',
    accroche: 'Peintre à Riom, entre pierre de Volvic et Limagne.',
    intro:
      'Riom, c’est à deux pas des Combrailles : Combronde, Châtel-Guyon, Volvic sont sur notre route quotidienne. Hôtels particuliers du centre ancien, maisons de vigneron, pavillons de la Limagne : chaque bâti a sa façon de recevoir la couleur.',
    terrain: [
      { titre: 'Centre ancien', texte: 'Menuiseries anciennes, encadrements en pierre de Volvic, teintes à respecter : on travaille avec soin et dans les règles du secteur protégé.' },
      { titre: 'Maisons de vigneron', texte: 'Caves, escaliers de pierre, volets en bois : des supports à préparer patiemment avant la peinture.' },
      { titre: 'Pavillons de la Limagne', texte: 'Rafraîchir un intérieur entre deux locataires, repeindre une façade qui a pris le soleil : des chantiers rapides et nets.' },
    ],
    communes: [
      'Riom', 'Châtel-Guyon', 'Mozac', 'Volvic', 'Ménétrol', 'Marsat', 'Enval', 'Saint-Bonnet-près-Riom',
      'Ennezat', 'Combronde', 'Aigueperse', 'Saint-Beauzire', 'Pessat-Villeneuve', 'Davayat', 'Chappes', 'Artonne',
    ],
    faq: [
      { q: 'Intervenez-vous dans le centre historique de Riom ?', r: 'Oui. Pour les façades et menuiseries visibles de la rue, on vous aide à vérifier les teintes autorisées avant de commencer, pour éviter toute mauvaise surprise.' },
      { q: 'Combien de temps pour repeindre un appartement à Riom ?', r: 'Pour un T3 en bon état, comptez généralement une à deux semaines selon la préparation des murs. Le planning exact figure sur le devis.' },
      { q: 'Faites-vous les volets et encadrements ?', r: 'Oui, volets bois et métal, portes, fenêtres. Les encadrements en pierre de Volvic sont protégés et laissés à nu, sauf demande contraire.' },
    ],
    teinte: 'volvic',
  },
  {
    slug: 'peintre-clermont-ferrand',
    nom: 'Clermont-Ferrand',
    court: 'La métropole, au pied des Puys.',
    titreSeo: 'Peintre en bâtiment à Clermont-Ferrand — Chamalières, Royat, Durtol',
    descriptionSeo:
      'Artisan peintre pour Clermont-Ferrand et l’ouest de la métropole : appartements, maisons, façades. Chamalières, Royat, Durtol, Nohanent, Blanzat, Cébazat. Devis gratuit après visite.',
    accroche: 'Peintre à Clermont-Ferrand, côté Puys.',
    intro:
      'On descend chaque semaine des Combrailles vers Clermont par Pontgibaud ou par Riom. On connaît les appartements haussmanniens du centre, les immeubles en pierre de Volvic de Jaude et les maisons de Chamalières et Royat accrochées à la pente.',
    terrain: [
      { titre: 'Appartements anciens', texte: 'Moulures, hauts plafonds, parquets : protection soignée et finitions à la main. Travail en copropriété dans le respect des voisins.' },
      { titre: 'Maisons de pente', texte: 'Chamalières, Royat, Durtol : façades exposées, accès parfois difficiles. On s’organise en conséquence.' },
      { titre: 'Entre deux baux', texte: 'Propriétaires bailleurs : remise en peinture rapide pour relouer vite, avec un devis ferme.' },
    ],
    communes: [
      'Clermont-Ferrand', 'Chamalières', 'Royat', 'Durtol', 'Nohanent', 'Blanzat', 'Cébazat', 'Sayat',
      'Orcines', 'Ceyrat', 'Beaumont', 'Aubière', 'Gerzat', 'Châteaugay', 'Pont-du-Château', 'Lempdes',
    ],
    faq: [
      { q: 'Vous venez de loin pour Clermont-Ferrand ?', r: 'Non : on est à une demi-heure, et on y travaille chaque semaine. La visite reste gratuite dans toute la métropole.' },
      { q: 'Travaillez-vous en copropriété ?', r: 'Oui, parties privatives comme parties communes : cages d’escalier, halls, paliers. On s’organise avec le syndic et on protège les accès.' },
      { q: 'Quel délai pour un devis à Clermont-Ferrand ?', r: 'On vous rappelle sous 48 heures pour fixer une visite. Le devis détaillé suit dans la semaine.' },
    ],
    teinte: 'puys',
  },
];

export const faqGenerale = [
  { q: 'Le devis est-il gratuit ?', r: 'Oui, la visite et le devis sont gratuits et sans engagement, dans les Combrailles, à Riom et à Clermont-Ferrand.' },
  { q: 'Faites-vous aussi de la rénovation complète ?', r: 'Notre métier, c’est la peinture et tout ce qui la prépare : enduits, reprises de plâtre, toile de verre. Pour une rénovation lourde (plomberie, électricité), on peut vous orienter vers des artisans du secteur avec qui nous travaillons.' },
  { q: 'Quelles peintures utilisez-vous ?', r: 'Des peintures professionnelles, en phase aqueuse et classées A+ pour l’intérieur, minérales ou siloxanes pour l’extérieur. Les marques et références sont indiquées sur le devis.' },
  { q: 'Êtes-vous assurés ?', r: 'Oui, nous disposons d’une assurance responsabilité civile professionnelle et d’une garantie décennale. L’attestation est jointe au devis.' },
];

export const zoneBySlug = (slug: string) => zones.find((z) => z.slug === slug)!;
export const teinte = (id: string) => nuancier.find((t) => t.id === id) ?? nuancier[0];
