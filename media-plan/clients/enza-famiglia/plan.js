/*
 * Media planning — Enza Famiglia (Louvre, La Défense). Planning de la semaine du 28 septembre 2026.
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
  period: 'Semaine du 28 septembre',
  intro:
    'Trattoria, pizzeria, aperitivo. Une semaine pour lancer l’<em>aperitivo</em> et faire vivre les deux adresses, du Louvre à La Défense.',

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

  // Un planning par mois : ici la semaine du 28 septembre. Visuels en production (wip) : fac-similés en attendant.
  months: [
    {
      nav: 'Semaine',
      kicker: 'Semaine du 28 septembre',
      title: 'Cette semaine, l’<em>aperitivo</em>',
      theme: 'Un reel concept et trois publications : l’humain, la cuisine, La Défense. Visuels bientôt disponibles.',
      posts: [
        {
          date: '2026-09-29',
          time: '18h00',
          type: 'reel',
          wip: true,
          poster: 'media/fac-reel-aperitivo.svg',
          title: 'Reel concept, Aperitivo',
          caption: ['L’aperitivo di Enza, du premier geste au premier verre.', 'Cocktails signature et cicchetti offerts, tous les soirs.'],
          note: 'Concept du reel : préparation du spritz, service, table qui trinque.',
        },
        {
          date: '2026-09-30',
          type: 'post',
          wip: true,
          media: 'media/fac-humain.svg',
          title: 'Publication humain',
          caption: ['Ceux qui font Enza, en cuisine et en salle.', 'La famiglia, au Louvre et à La Défense.'],
        },
        {
          date: '2026-10-01',
          type: 'post',
          wip: true,
          media: 'media/fac-food.svg',
          title: 'Publication food',
          caption: ['Du forno à la table.', 'Pizze, pasta fresca, et tout ce qui sort de la cuisine d’Enza.'],
        },
        {
          date: '2026-10-03',
          type: 'post',
          wip: true,
          media: 'media/fac-la-defense.svg',
          title: 'Publication La Défense',
          caption: ['Pranzo veloce, aperitivo dopo lavoro.', 'Enza Famiglia, à La Défense.'],
        },
      ],
    },
  ],

  // Feed actuel du compte @enzafamiglia (du plus récent au plus ancien), affiché après le planning
  feedExisting: [
    'media/live-1.jpg', 'media/live-2.jpg', 'media/live-3.jpg', 'media/live-4.jpg', 'media/live-5.jpg', 'media/live-6.jpg',
    'media/live-7.jpg', 'media/live-8.jpg', 'media/live-9.jpg', 'media/live-10.jpg', 'media/live-11.jpg',
  ],

  // Missions, avancement global et passages : partagés entre tous les visiteurs via suivi.php.
  // Sans PHP (aperçu), data/suivi.json est lu tel quel.
  suivi: {
    api: 'suivi.php',
    data: 'data/suivi.json',
    team: ['Fabrizio', 'Carlotta', 'Sixte'],
    // [fond, texte, contour] : Fabrizio en 18H22, Carlotta en rouge Enza vif, Sixte en crème Enza
    colors: {
      Fabrizio: ['#22365f', '#f1eee6'],
      Carlotta: ['#e5321c', '#fff0c3'],
      Sixte: ['#fff0c3', '#ca4737', '#ca4737'],
    },
    // Enza 8e est un autre projet : toujours en vert sauge, distinct du reste du branding
    highlight: [{ match: 'Enza\\s*(8\\s*(e|ème|eme)|huiti[eè]me)', color: '#6f8a64' }],
  },

  // Retours du client : Validé / À revoir + commentaire, envoyés en un récapitulatif.
  feedback: { whatsapp: '' },

  footer: 'Planning soumis à validation. Visuels et wording susceptibles d’évoluer.',
};
