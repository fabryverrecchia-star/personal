/*
 * Media planning — Jacqueline, table gastronomique, Paris 9e. Semaine du 28 septembre 2026 (lancement).
 * Photos originales : mercredi, jeudi, vendredi-1, samedi-2, samedi-3.
 * Encore extraites de la maquette : lundi-courges, mardi-verre, vendredi-2, samedi-1 (à remplacer, mêmes noms).
 * live-* : publications déjà en ligne sur le compte (@jacqueline_restaurant_paris).
 */
window.PLAN = {
  client: {
    name: 'Jacqueline',
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

  weeks: [
    {
      title: 'Lancement, <em>textures</em> & branding',
      theme: 'Six rendez-vous, du lundi au samedi, jusqu’à l’ouverture.',
      posts: [
        {
          date: '2026-09-28',
          type: 'post',
          media: 'media/lundi-courges.jpg',
          title: 'Réservations ouvertes',
          caption: ['Premiers services la semaine prochaine.', 'Réservations ouvertes.'],
        },
        {
          date: '2026-09-29',
          time: '18h45',
          type: 'post',
          media: 'media/mardi-verre.jpg',
          title: 'Une table intime',
          caption: ['Une table intime, pensée dans le détail.', 'Jacqueline ouvre la semaine prochaine.'],
        },
        {
          date: '2026-09-30',
          type: 'post',
          media: 'media/mercredi-accords.jpg',
          title: 'Les accords',
          caption: ['Des accords précis, au fil des séquences.'],
        },
        {
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
          date: '2026-10-02',
          type: 'carousel',
          media: ['media/vendredi-1.jpg', 'media/vendredi-2.jpg'],
          title: 'Iodé',
          caption: ['Une lecture iodée, franche et maîtrisée.'],
        },
        {
          date: '2026-10-03',
          type: 'carousel',
          media: ['media/samedi-1.jpg', 'media/samedi-2.jpg', 'media/samedi-3.jpg'],
          title: 'L’ouverture approche',
          caption: ['Jacqueline ouvre la semaine prochaine.', 'Réservations ouvertes.'],
        },
      ],
    },
  ],

  // Feed actuel du compte (du plus récent au plus ancien), affiché après le planning
  feedExisting: ['media/live-1.jpg', 'media/live-2.jpg', 'media/live-3.jpg', 'media/live-4.jpg'],

  footer: 'Planning soumis à validation. Visuels et wording susceptibles d’évoluer.',
};
