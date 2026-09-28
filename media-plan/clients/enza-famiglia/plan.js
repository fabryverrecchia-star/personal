/*
 * Media planning — Enza Famiglia (Louvre, La Défense). Planning du mois : octobre 2026.
 * Base reprise de La Petite Maison. Ordre de la page : missions et avancement, media planning, calendrier.
 * Missions, avancement et passages : data/suivi.json, modifiables depuis la page en mode équipe.
 */
window.PLAN = {
  client: {
    name: 'Enza Famiglia',
    logo: 'logo.svg',
    badge: 'logo.svg',
    // Lettres pleines : le trait qui les écrit au scroll doit être plus large que pour une écriture fine
    writeStroke: 22,
    writeFlourish: false,
    services: ['Branding', 'Print', 'Photo', 'Vidéo', 'CM'],
    location: 'Louvre · La Défense',
  },

  title: 'Media planning',
  period: 'Octobre 2026',
  intro:
    'Trattoria, pizzeria, aperitivo. Un mois pour faire vivre les deux adresses : la <em>colazione</em> au Louvre, la rentrée à La Défense, les nouvelles cartes et la famiglia.',

  // Couleurs du site : crème Enza, rouge Enza, texte brun rouge (jamais noir). Bascule après l'ouverture 18H22.
  theme: {
    bg: '#fdf5e1',
    'bg-deep': '#f7e9c4',
    ink: '#ca4737',
    'ink-soft': 'rgba(94, 38, 30, 0.8)',
    'ink-faint': 'rgba(202, 71, 55, 0.22)',
    bar: 'rgba(253, 245, 225, 0.9)',
    tint: 'rgba(202, 71, 55, 0.05)',
  },
  // Typographie du client pour le texte ; titres et haut de page restent en 18H22
  fonts: {
    css: 'fonts/fonts.css',
    text: "'Lora', Georgia, serif",
  },

  // Un planning par mois
  months: [
    {
      title: 'Octobre, <em>la famiglia</em>',
      theme: 'Deux rendez-vous par semaine sur les deux adresses. Visuels en préparation, remplacés au fil des shootings.',
      posts: [
        {
          date: '2026-10-01',
          time: '08h30',
          type: 'post',
          media: 'media/01-colazione.svg',
          title: 'Colazione al Louvre',
          caption: ['Cornetto, cappuccino, spremuta.', 'La nouvelle carte petit déjeuner arrive au Louvre, dès 8h.'],
        },
        {
          date: '2026-10-05',
          type: 'carousel',
          media: ['media/02-rentree-1.svg', 'media/02-rentree-2.svg', 'media/02-rentree-3.svg'],
          title: 'La rentrée à La Défense',
          caption: ['Pranzo veloce, aperitivo dopo lavoro.', 'Tout ce qui change à La Défense pour la rentrée.'],
        },
        {
          date: '2026-10-08',
          time: '18h00',
          type: 'reel',
          poster: 'media/03-reel-forno.svg',
          title: 'Il forno',
          caption: ['Preparazione. Cottura. Piacere.', 'Trois temps, une pizza.'],
        },
        {
          date: '2026-10-12',
          type: 'post',
          media: 'media/04-aperitivo.svg',
          title: 'L’aperitivo di Enza',
          caption: ['Cocktails signature et cicchetti offerts.', 'Tous les soirs, au Louvre et à La Défense.'],
        },
        {
          date: '2026-10-15',
          type: 'post',
          media: 'media/05-carta-defense.svg',
          title: 'La nouvelle carte, La Défense',
          caption: ['Nouvelle carte, mêmes recettes de famille.', 'À découvrir dès cette semaine à La Défense.'],
        },
        {
          date: '2026-10-19',
          type: 'carousel',
          media: ['media/06-carta-louvre-1.svg', 'media/06-carta-louvre-2.svg', 'media/06-carta-louvre-3.svg'],
          title: 'La nouvelle carte, Louvre',
          caption: ['Antipasti, primi, pizze, dolci.', 'La carte d’automne du Louvre, page par page.'],
        },
        {
          date: '2026-10-22',
          time: '12h00',
          type: 'reel',
          poster: 'media/07-reel-traiteur.svg',
          title: 'Enza Traiteur',
          caption: ['La cuisine d’Enza chez vous.', 'Les commandes de fin d’année sont ouvertes.'],
        },
        {
          date: '2026-10-26',
          type: 'post',
          media: 'media/08-famiglia.svg',
          title: 'La famiglia',
          caption: ['Ceux qui font Enza, au Louvre et à La Défense.', 'Grazie a tutti.'],
        },
      ],
    },
  ],

  // Feed actuel du compte @enzafamiglia (du plus récent au plus ancien), affiché après le planning
  feedExisting: [
    'media/live-1.jpg', 'media/live-2.jpg', 'media/live-3.jpg', 'media/live-4.jpg', 'media/live-5.jpg', 'media/live-6.jpg',
    'media/live-7.jpg', 'media/live-8.jpg', 'media/live-9.jpg', 'media/live-10.jpg', 'media/live-11.jpg', 'media/live-12.jpg',
  ],

  // Missions, avancement global et passages : partagés entre tous les visiteurs via suivi.php.
  // Sans PHP (aperçu), data/suivi.json est lu tel quel.
  suivi: {
    api: 'suivi.php',
    data: 'data/suivi.json',
    team: ['Fabrizio', 'Jade'],
    // Enza 8e est un autre projet : toujours en vert sauge, distinct du reste du branding
    highlight: [{ match: 'Enza\\s*(8\\s*(e|ème|eme)|huiti[eè]me)', color: '#6f8a64' }],
  },

  // Retours du client : Validé / À revoir + commentaire, envoyés en un récapitulatif.
  feedback: { whatsapp: '' },

  footer: 'Planning soumis à validation. Visuels et wording susceptibles d’évoluer.',
};
