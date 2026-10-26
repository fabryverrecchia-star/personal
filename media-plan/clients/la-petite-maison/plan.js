/*
 * Media planning — La Petite Maison, Paris 8 (7 rue du Boccador). Planning du mois : octobre 2026, avant l'ouverture.
 * Situation au 9 octobre : 7 posts en ligne sur @lapetitemaison_paris (feedExisting). Aucun post prévu dans le fichier :
 * l'équipe les ajoute depuis la page (Espace équipe → Publications).
 * Chaque post a un id : photo, vidéo, couverture, légende et date se modifient depuis l'espace équipe.
 * Inspirations, idées teasing réécrites et argumentées, modifications : data/suivi.json, via suivi.php.
 * 26 octobre : passages, calendrier et missions retirés ; compte à rebours du grand opening (19 novembre) et idées teasing.
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
  // L'ouverture 18H22 ne se joue qu'à la première visite de la journée
  introDaily: true,
  period: 'Octobre 2026',
  intro:
    '7 rue du Boccador, Paris 8. Ici, le feed tel qu’il est aujourd’hui, les <em>prochaines publications</em>, et vos retours avant chaque mise en ligne.',

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

  // Grand opening : compte à rebours (heure de Paris)
  countdown: {
    date: '2026-11-19',
    kicker: 'Grand opening',
    title: 'Jeudi 19 <em>novembre</em>',
    lead: '7 rue du Boccador, Paris 8',
    done: 'La Petite Maison est ouverte.',
  },

  // Idées teasing avant l'ouverture : l'équipe (Jade, Fabrizio) peut réécrire chaque idée ou l'argumenter
  teasing: {
    kicker: 'Avant le 19 novembre',
    title: 'Idées <em>teasing</em>',
    lead: 'Trois pistes pour faire monter l’attente, tournées le 4 novembre et publiées jusqu’à l’ouverture. Chaque idée se modifie ou s’argumente depuis l’espace équipe.',
    // Bouton « Le coin inspi » sur chaque idée (panneau Inspiration du mois)
    inspiButton: true,
    // Tempo : shoot = jour de tournage, publish = jour de publication, rhythm = précision (série, story…)
    ideas: [
      {
        id: 't1',
        by: 'Fabrizio',
        shoot: '2026-11-04',
        publish: '2026-11-09',
        rhythm: 'Ouvre la série : la suite (idée 02) commence quand il entre.',
        title: 'Le serveur descend les Champs',
        text: [
          'Un serveur de La Petite Maison, sans jamais montrer son visage : on ne voit que sa tenue et des petits détails.',
          'Il prend son plateau et se met en marche. Il descend les Champs-Élysées, on découvre l’avenue avec lui, les passants, les vitrines, la lumière de Paris.',
          'Il continue jusqu’au Triangle d’or, s’arrête devant la devanture de La Petite Maison, pousse la porte et entre. Fin sur « 19 novembre ».',
        ],
        details: ['Nœud papillon ?', 'Chemise ?', 'Tablier ?'],
      },
      {
        id: 't2',
        shoot: '2026-11-04',
        publish: '2026-11-13',
        title: 'Texture mixte au sound effect',
        text: [
          'La suite du serveur : il pousse la porte, entre, et découvre La Petite Maison par ses textures, en très gros plans.',
          'Chaque plan a son son, amplifié : le lin de la nappe qu’on déplie, le zeste de citron qui éclate, la glace pilée, l’huile d’olive qui coule, la croûte du pain qui craque, le verre qui tinte sur le marbre.',
          'Montage rythmé, calé sur les effets sonores. Fin : la salle s’ouvre, « 19 novembre ».',
        ],
        details: ['Quelles textures garder ?', 'Musique sous les sons, ou les sons seuls ?'],
      },
      {
        id: 't3',
        shoot: '2026-11-04',
        publish: '2026-11-16',
        rhythm: 'Le dernier teasing, à J-3 de l’ouverture.',
        title: 'Le moment La Petite Maison',
        text: [
          'Un mélange des inspis citées : les sujets et le format captivant de @bistro_tino, un concept romantique, et l’expérience racontée en plans fixes.',
          'Des plans fixes posés comme des instants : une table pour deux, une main qui sert le vin, un regard, un rire, les citrons sur le bar, la lumière du soir sur la salle.',
          'Pas de musique forte, un son ASMR : verres, couverts, conversations feutrées. Le mood de l’inspi « WPI », sans être agressif.',
          'Fin : « La Petite Maison. Paris. 19 novembre. »',
        ],
        details: ['Quels moments en plans fixes ?', 'Combien de plans pour garder le rythme ?'],
      },
    ],
  },

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

  // Modifications des posts, stories, inspirations et idées teasing : partagées entre tous les visiteurs via suivi.php.
  // Sans PHP (aperçu), data/suivi.json est lu tel quel. Passages, calendrier et missions retirés le 26 octobre.
  suivi: {
    api: 'suivi.php',
    data: 'data/suivi.json',
    calendar: false,
    missions: false,
    team: ['Fabrizio', 'Jade'],
    // Fabrizio en couleur 18H22, Jade en couleur La Petite Maison
    colors: { Fabrizio: '#22365f', Jade: '#9c4e42' },
  },

  // Retours du client : Validé / À revoir + commentaire, envoyés en un récapitulatif.
  feedback: { whatsapp: '' },

  footer: 'Planning soumis à validation. Visuels et wording susceptibles d’évoluer.',
};
