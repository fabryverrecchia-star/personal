/*
 * Media planning — La Petite Maison, Paris. Planning du mois : octobre 2026 (avant l'ouverture).
 * Base de contenu reprise du planning Jacqueline ; reel d'annonce envoyé le 28 septembre.
 * Passages et missions : data/suivi.json, modifiables depuis la page en mode équipe (&admin).
 */
window.PLAN = {
  client: {
    name: 'La Petite Maison',
    logo: 'logo.svg',
    badge: 'logo.svg',
    services: ['Ouverture', 'Photo', 'Vidéo', 'CM'],
    location: 'Paris',
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
  // Typographies du client, utilisées à partir de son univers (le haut de page reste 18H22)
  fonts: {
    css: 'fonts/fonts.css',
    display: "'Freckle Face', 'Alegreya', Georgia, serif",
    text: "'Alegreya', Georgia, serif",
  },

  // Un planning par mois
  months: [
    {
      title: 'Octobre, l’<em>ouverture</em>',
      theme: 'Deux rendez-vous par semaine, tout le mois, jusqu’à l’ouverture.',
      posts: [
        {
          date: '2026-10-02',
          type: 'post',
          media: 'media/lundi-courges.jpg',
          title: 'Réservations ouvertes',
          caption: ['La Petite Maison arrive à Paris.', 'Réservations ouvertes.'],
        },
        {
          date: '2026-10-06',
          time: '18h45',
          type: 'post',
          media: 'media/mardi-verre.jpg',
          title: 'Une maison, une table',
          caption: ['Une table pensée comme à la maison, dans le détail.', 'Ouverture cet automne.'],
        },
        {
          date: '2026-10-09',
          type: 'post',
          media: 'media/mercredi-accords.jpg',
          title: 'Les accords',
          caption: ['Des vins du Sud, choisis pour chaque assiette.'],
        },
        {
          date: '2026-10-13',
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
          date: '2026-10-16',
          time: '12h00',
          type: 'reel',
          poster: 'media/reel-ouverture.jpg',
          video: 'media/reel-ouverture.mp4',
          title: 'Ouverture automne 2026',
          caption: ['De Nice à Paris.', 'La Petite Maison, ouverture automne 2026.'],
        },
        {
          date: '2026-10-20',
          type: 'post',
          // Deux propositions de visuel, un seul sera publié
          options: ['media/vendredi-1.jpg', 'media/vendredi-2.jpg'],
          title: 'Iodé',
          caption: ['La mer, franche et maîtrisée.'],
        },
        {
          date: '2026-10-23',
          type: 'post',
          // Trois propositions de visuel, un seul sera publié
          options: ['media/samedi-1.jpg', 'media/samedi-2.jpg', 'media/samedi-3.jpg'],
          title: 'L’ouverture approche',
          caption: ['La Petite Maison ouvre ses portes à Paris.', 'Réservations ouvertes.'],
        },
      ],
    },
  ],

  // Feed actuel du compte (du plus récent au plus ancien), affiché après le planning
  feedExisting: ['media/live-1.jpg', 'media/live-2.jpg', 'media/live-3.jpg', 'media/live-4.jpg', 'media/live-5.jpg'],

  // Passages (shootings, tournages, rendez-vous) et missions en cours : partagés entre
  // tous les visiteurs via suivi.php. Sans PHP (aperçu), data/suivi.json est lu tel quel.
  suivi: {
    api: 'suivi.php',
    data: 'data/suivi.json',
    team: ['Fabrizio', 'Jade'],
  },

  // Retours du client : Validé / À revoir + commentaire, envoyés en un récapitulatif.
  feedback: { whatsapp: '' },

  footer: 'Planning soumis à validation. Visuels et wording susceptibles d’évoluer.',
};
