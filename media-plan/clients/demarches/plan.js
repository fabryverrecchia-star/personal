/*
 * Démarches SRL, concessionnaire Helicave by Harnois Paris. Price list interactive (offre du 23 septembre 2026).
 * Base reprise d'Enza Famiglia, sans feed Instagram. Ordre de la page : price list et crédit engagé,
 * missions en cours, calendrier des passages.
 * Price list, missions, avancement et passages : data/suivi.json, modifiables depuis la page en mode équipe.
 */
window.PLAN = {
  client: {
    name: 'Démarches',
    logo: 'logo.svg',
    badge: 'logo.svg',
    // Lettres pleines et bloc du logo : trait large, écrit dans l'ordre, sans grand trait final
    writeStroke: 18,
    writeFlourish: false,
    services: ['Direction artistique', 'Print', 'Photo', 'Vidéo', 'Web'],
    location: 'Concessionnaire Helicave by Harnois',
  },

  title: 'Price list',
  period: 'Offre du 23 septembre 2026',
  intro:
    'Communication, direction artistique et design pour <em>Helicave</em>. Toute la price list, les prestations engagées et le crédit en cours, au même endroit.',

  // Couleurs du site : ivoire, bronze et or Helicave, texte graphite (jamais noir). Bascule après l'ouverture 18H22.
  theme: {
    bg: '#f7f2e9',
    'bg-deep': '#efe4d0',
    ink: '#7d6340',
    'ink-soft': 'rgba(63, 59, 59, 0.82)',
    'ink-faint': 'rgba(125, 99, 64, 0.22)',
    bar: 'rgba(247, 242, 233, 0.9)',
    tint: 'rgba(198, 174, 139, 0.12)',
  },

  // Pas de media planning ni de feed Instagram pour ce client
  months: [],

  // Price list : le contenu (rubriques, prestations, crédit, TVA) est dans data/suivi.json
  prices: {
    kicker: 'Communication, direction artistique & design',
    agency: 'Fabrizio Verrecchia · Abysse.lab (18H22)',
    client: 'Démarches SRL, concessionnaire Helicave',
    date: '23 septembre 2026',
    validity: '360 jours',
    hoursPerDay: 8,
    conditions: [
      'Prix exprimés en euros hors taxes. Chaque projet fait l’objet d’un devis détaillé ; les durées (heures, j/h) sont indicatives.',
      'Sauf mention contraire, les créations comprennent 2 allers-retours de corrections. Toute modification supplémentaire est facturée à l’heure.',
      'Non inclus : frais d’impression, budget média publicitaire, achat de photos ou de polices sous licence, frais de déplacement longue distance.',
      'Acompte de 30 % à la commande, solde à la livraison. Paiement à 30 jours date de facture.',
      'Les droits d’utilisation des créations sont cédés au client après paiement intégral.',
    ],
  },

  // Missions, avancement, passages et price list : partagés entre tous les visiteurs via suivi.php.
  // Sans PHP (aperçu), data/suivi.json est lu tel quel.
  suivi: {
    api: 'suivi.php',
    data: 'data/suivi.json',
    team: ['Fabrizio', 'Helicave'],
    // [fond, texte, contour] : Fabrizio en 18H22, Helicave en or
    colors: {
      Fabrizio: ['#22365f', '#f1eee6'],
      Helicave: ['#c6ae8b', '#3f3b3b'],
    },
  },

  footer: 'Price list indicative. Chaque projet fait l’objet d’un devis détaillé.',
};
