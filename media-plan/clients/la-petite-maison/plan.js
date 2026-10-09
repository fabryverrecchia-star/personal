/*
 * Media planning — La Petite Maison, Paris 8 (7 rue du Boccador). Planning du mois : octobre 2026, avant l'ouverture.
 * Situation au 9 octobre : 7 posts en ligne sur @lapetitemaison_paris (feedExisting), la suite du mois ci-dessous.
 * Chaque post a un id : photo, vidéo, couverture, légende et date se modifient depuis l'espace équipe.
 * Passages, missions, inspirations et modifications : data/suivi.json, via suivi.php.
 */
window.PLAN = {
  client: {
    name: 'La Petite Maison',
    logo: 'logo.svg',
    badge: 'logo.svg',
    services: ['Ouverture', 'Photo', 'Vidéo', 'CM'],
    location: 'Paris 8',
    instagram: 'lapetitemaison_paris',
  },

  title: 'Media planning',
  period: 'Octobre 2026',
  intro:
    'De Nice à Paris. Un mois pour installer l’univers avant l’ouverture : la <em>Méditerranée</em>, les matières, l’automne, et une date qui approche.',

  // Couleurs du site : crème, terracotta, texte presque noir. Bascule en fondu après l'ouverture 18H22.
  theme: {
    bg: '#f0ede3',
    'bg-deep': '#e6e0d2',
    ink: '#9c4e42',
    'ink-soft': 'rgba(43, 34, 31, 0.78)',
    'ink-faint': 'rgba(156, 78, 66, 0.22)',
    bar: 'rgba(240, 237, 227, 0.9)',
    tint: 'rgba(156, 78, 66, 0.05)',
  },
  // Typographie du client pour le texte ; titres et haut de page restent en 18H22
  fonts: {
    css: 'fonts/fonts.css',
    text: "'Alegreya', Georgia, serif",
  },

  // Un planning par mois
  months: [
    {
      title: 'Octobre, l’<em>ouverture</em>',
      theme: 'Deux publications déjà en ligne ce mois-ci (les Champs-Élysées, l’assiette). La suite : deux rendez-vous par semaine jusqu’à fin octobre.',
      posts: [
        {
          id: 'oct-01',
          date: '2026-10-13',
          time: '18h45',
          type: 'post',
          media: 'media/mardi-verre.jpg',
          title: 'Une maison, une table',
          caption: ['Une table pensée comme à la maison, dans le détail.', 'Ouverture cet automne, 7 rue du Boccador.'],
        },
        {
          id: 'oct-02',
          date: '2026-10-16',
          time: '12h00',
          type: 'reel',
          poster: 'media/reel-ouverture.jpg',
          video: 'media/reel-ouverture.mp4',
          title: 'Ouverture automne 2026',
          caption: ['De Nice à Paris.', 'La Petite Maison, ouverture automne 2026.'],
        },
        {
          id: 'oct-03',
          date: '2026-10-20',
          type: 'post',
          media: 'media/mercredi-accords.jpg',
          title: 'Les accords',
          caption: ['Des vins du Sud, choisis pour chaque assiette.'],
        },
        {
          id: 'oct-04',
          date: '2026-10-23',
          type: 'post',
          media: 'media/jeudi-paris.jpg',
          title: 'Nice, point de départ',
          caption: [
            'Nice comme point de départ.',
            'Dans les couleurs, les matières, dans la carte.',
            'Désormais à Paris.',
          ],
        },
        {
          id: 'oct-05',
          date: '2026-10-27',
          type: 'post',
          // Deux propositions de visuel, un seul sera publié
          options: ['media/vendredi-1.jpg', 'media/vendredi-2.jpg'],
          title: 'Iodé',
          caption: ['La mer, franche et maîtrisée.'],
        },
        {
          id: 'oct-06',
          date: '2026-10-30',
          type: 'post',
          // Trois propositions de visuel, un seul sera publié
          options: ['media/samedi-1.jpg', 'media/samedi-2.jpg', 'media/samedi-3.jpg'],
          title: 'L’ouverture approche',
          caption: ['La Petite Maison ouvre ses portes à Paris.', 'Réservations bientôt ouvertes.'],
        },
      ],
    },
  ],

  // Feed actuel de @lapetitemaison_paris au 9 octobre (7 posts, le premier épinglé), affiché après le planning
  feedExisting: ['media/live-1.jpg', 'media/live-2.jpg', 'media/live-3.jpg', 'media/live-4.jpg', 'media/live-5.jpg', 'media/live-6.jpg', 'media/live-7.jpg'],

  // Passages (shootings, tournages, rendez-vous), missions en cours et modifications des posts : partagés entre
  // tous les visiteurs via suivi.php. Sans PHP (aperçu), data/suivi.json est lu tel quel.
  suivi: {
    api: 'suivi.php',
    data: 'data/suivi.json',
    team: ['Fabrizio', 'Jade'],
    // Fabrizio en couleur 18H22, Jade en couleur La Petite Maison
    colors: { Fabrizio: '#22365f', Jade: '#9c4e42' },
  },

  // Retours du client : Validé / À revoir + commentaire, envoyés en un récapitulatif.
  feedback: { whatsapp: '' },

  footer: 'Planning soumis à validation. Visuels et wording susceptibles d’évoluer.',
};
