/*
 * Media planning — Jacqueline, table gastronomique, Paris 9e. Semaine du 28 septembre 2026 (lancement).
 * Photos : originaux envoyés le 28 septembre. Vendredi (poissons) et samedi (rideaux) : propositions, un seul visuel publié.
 * live-* : publications déjà en ligne sur le compte (@jacqueline_restaurant_paris).
 * Missions et modifications de l'équipe (photos, légendes, dates, ajouts) : data/suivi.json, via suivi.php.
 */
window.PLAN = {
  client: {
    name: 'Jacqueline',
    logo: 'monogram.svg',
    services: ['Lancement', 'Textures', 'Branding', 'CM'],
    location: 'Paris 9e',
  },

  title: 'Media planning',
  period: 'Septembre — Octobre 2026',
  intro:
    'Table gastronomique au rythme des saisons. Une semaine pour installer l’univers avant l’ouverture : les <em>textures</em>, les matières, l’automne, et une date qui approche.',

  // Couleurs du client : la page y bascule en fondu après l'ouverture 18H22 (marbre rose, veines lie-de-vin).
  theme: {
    bg: '#e6c8bd',
    'bg-deep': '#d9b3a6',
    ink: '#4e1a18',
    'ink-soft': 'rgba(78, 26, 24, 0.78)',
    'ink-faint': 'rgba(78, 26, 24, 0.24)',
    bar: 'rgba(230, 200, 189, 0.9)',
    tint: 'rgba(78, 26, 24, 0.06)',
  },
  brandText: 'Précision, générosité, simplicité. Bienvenue chez <em>Jacqueline</em>.',

  // Planning au mois. Chaque post a un id : les modifications de l'espace équipe y sont rattachées.
  months: [
    {
      title: 'Lancement, <em>textures</em> & branding',
      theme: 'Trois premiers rendez-vous pour installer l’univers.',
      posts: [
        {
          id: 'jq-01',
          date: '2026-09-28',
          type: 'post',
          media: 'media/lundi-courges.jpg',
          title: 'Réservations ouvertes',
          caption: ['Premiers services la semaine prochaine.', 'Réservations ouvertes.'],
        },
        {
          id: 'jq-02',
          date: '2026-09-29',
          time: '18h45',
          type: 'post',
          media: 'media/mardi-verre.jpg',
          title: 'Une table intime',
          caption: ['Une table intime, pensée dans le détail.', 'Jacqueline ouvre la semaine prochaine.'],
        },
        {
          id: 'jq-03',
          date: '2026-09-30',
          type: 'post',
          media: 'media/mercredi-accords.jpg',
          title: 'Les accords',
          caption: ['Des accords précis, au fil des séquences.'],
        },
      ],
    },
    {
      title: 'L’ouverture <em>approche</em>',
      theme: 'Trois derniers rendez-vous avant les premiers services.',
      posts: [
        {
          id: 'jq-04',
          date: '2026-10-01',
          type: 'post',
          media: 'media/jeudi-paris.jpg',
          title: 'L’automne, point de départ',
          caption: [
            'L’automne comme point de départ.',
            'Dans les teintes, les matières, dans les menus.',
            'Au cœur du 9e arrondissement.',
          ],
        },
        {
          id: 'jq-05',
          date: '2026-10-02',
          type: 'post',
          // Trois propositions de visuel, un seul sera publié
          options: ['media/vendredi-1.jpg', 'media/vendredi-2.jpg', 'media/vendredi-3.jpg'],
          title: 'Iodé',
          caption: ['Une lecture iodée, franche et maîtrisée.'],
        },
        {
          id: 'jq-06',
          date: '2026-10-03',
          type: 'post',
          // Trois propositions de visuel, un seul sera publié
          options: ['media/samedi-1.jpg', 'media/samedi-2.jpg', 'media/samedi-3.jpg'],
          title: 'L’ouverture approche',
          caption: ['Jacqueline ouvre la semaine prochaine.', 'Réservations ouvertes.'],
        },
      ],
    },
  ],

  // Feed actuel du compte (du plus récent au plus ancien), affiché après le planning
  feedExisting: [
    'media/live-1.jpg', 'media/live-2.jpg', 'media/live-3.jpg', 'media/live-4.jpg', 'media/live-5.jpg',
    'media/live-6.jpg', 'media/live-7.jpg', 'media/live-8.jpg', 'media/live-9.jpg', 'media/live-10.jpg',
  ],

  // Missions en cours et modifications de l'équipe :
  // partagées entre tous les visiteurs via suivi.php. Sans PHP (aperçu), data/suivi.json est lu tel quel.
  suivi: {
    api: 'suivi.php',
    data: 'data/suivi.json',
    team: ['Fabrizio', 'Manon', 'Clément'],
    // Pas de passage prévu : le calendrier montre seulement les publications
    passages: false,
    // Fabrizio en couleurs 18H22, Manon et Clément aux couleurs du client
    colors: { Fabrizio: '#22365f', Manon: '#a35a4a', 'Clément': '#7d5a3c' },
  },

  // Retours du client : Validé / À revoir + commentaire, envoyés en un récapitulatif.
  // whatsapp: numéro au format international (vide = le client choisit le contact).
  feedback: { whatsapp: '' },

  footer: 'Planning soumis à validation. Visuels et wording susceptibles d’évoluer.',
};
