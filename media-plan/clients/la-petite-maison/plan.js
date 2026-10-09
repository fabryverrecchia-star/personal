/*
 * Media planning — La Petite Maison, Paris 8 (7 rue du Boccador). Planning du mois : octobre 2026, avant l'ouverture.
 * Situation au 9 octobre : 7 posts en ligne sur @lapetitemaison_paris (feedExisting). Aucun post prévu dans le fichier :
 * l'équipe les ajoute depuis la page (Espace équipe → Publications).
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
      theme: 'Le feed en ligne aujourd’hui, et les prochaines publications à venir.',
      month: '2026-10',
      // Vide : l'équipe ajoute les publications depuis l'espace équipe (Publications → Ajouter une publication)
      posts: [],
    },
  ],

  // Feed actuel de @lapetitemaison_paris au 9 octobre (7 posts, le premier épinglé), affiché après le planning
  feedExisting: ['media/live-1.jpg', 'media/live-2.jpg', 'media/live-3.jpg', 'media/live-4.jpg', 'media/live-5.jpg', 'media/live-6.jpg', 'media/live-7.jpg'],

  // Bouton « Branding » : playlists de marque, typographie, visuels de démo et banques d'images
  branding: {
    playlists: [
      'https://open.spotify.com/playlist/2nHqblFHFdvP2RHsYuT6WN',
      'https://open.spotify.com/playlist/6YFQndIQh7WioQbiMU5pEX',
    ],
    fonts: [],
    visuals: [],
    links: [
      { label: 'Stock branding LPM Paris', url: 'https://www.dropbox.com/scl/fo/7oacwrgz57wc2h598cp1a/AIu0-tW2Z-edrYnr6zTv1Gc?rlkey=0azg6wrbd0y31chkqxhusnz5x&dl=0' },
      { label: 'LPM Cannes', url: 'https://www.dropbox.com/scl/fo/pecdmih9tv0f7w4xpo520/AMlPbcEQRvYof_zXlkph_NY?rlkey=1cnj6xxjbdirmyqf4zsg6au7m&dl=0' },
      { label: 'La Petite Maison', url: 'https://www.dropbox.com/scl/fo/33krmnps80x5jasfdxtff/ANOxaKlgG8T63lWxBzWo2Nk?rlkey=z36zuw54oeyxgjl9m6racqrt6&dl=0' },
      { label: 'LPM Nice', url: 'https://www.dropbox.com/scl/fo/rnx7olir1ij02fpqpygou/AFzmsbCIJ1C0HozddAsCgAc?rlkey=1dip99fxp3xwwyf1tzd0l0knp&dl=0' },
    ],
  },

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
