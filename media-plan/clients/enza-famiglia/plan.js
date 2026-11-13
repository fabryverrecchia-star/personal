/*
 * Media planning — Enza Famiglia (Louvre, La Défense). Même design et mêmes fonctions que La Petite Maison
 * (13 novembre) : ouverture sur les logos, sommaire, feed avec « + », fenêtre du post, stories par jour.
 * 13 novembre : les 12 derniers posts du compte (captures du feed), marqués validés. Dates provisoires, dans l'ordre du feed.
 * Chaque post a un id : photo, vidéo, couverture, légende et date se modifient depuis l'espace équipe.
 * Passages, missions, stories, inspirations et modifications : data/suivi.json, via suivi.php.
 * Le feed s'exporte en PDF : page 1 le calendrier (jours et titres), page 2 l'aperçu du feed.
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
    instagram: 'enzafamiglia',
  },

  title: 'Media planning',
  period: 'Novembre 2026',
  // Comme La Petite Maison : la page s'ouvre directement sur les logos, sans animation d'ouverture ni au défilement
  introDaily: true,
  intro: false,
  heroCompact: true,
  noScrollAnim: true,
  // Sommaire : le feed d'abord (ouvert à l'arrivée), puis les stories et les missions. Lien direct : ?vue=feed…
  menu: true,
  pubsInFeed: true,
  menuOrder: ['feed', 'stories', 'missions'],
  menuOpen: 'feed',
  storiesByDay: true,
  stats: false,

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

  // Un planning par mois. Posts déjà en ligne (captures du 13 novembre), validés : dates à confirmer, modifiables
  // depuis l'espace équipe, comme le visuel (remplacer la capture par le fichier d'origine).
  months: [
    {
      title: 'Octobre',
      month: '2026-10',
      posts: [
        { id: 'p12', date: '2026-10-19', type: 'reel', poster: 'media/post-12.jpg', title: 'Reel Aperitivo & DJ set avec DJ Bouby', theme: 'events', validated: true },
        { id: 'p11', date: '2026-10-22', type: 'reel', poster: 'media/post-11.jpg', title: 'Reel pizza au four', theme: 'food', validated: true },
        { id: 'p10', date: '2026-10-25', type: 'carousel', media: ['media/post-10.jpg'], title: 'Mozzarella et tomates', theme: 'food', validated: true },
        { id: 'p09', date: '2026-10-28', type: 'carousel', media: ['media/post-09.jpg'], title: 'Le cocktail rouge', theme: 'bar', validated: true },
        { id: 'p08', date: '2026-10-31', type: 'reel', poster: 'media/post-08.jpg', title: 'Reel Halloween', theme: 'events', validated: true },
      ],
    },
    {
      title: 'Novembre, la <em>famiglia</em>',
      month: '2026-11',
      posts: [
        { id: 'p07', date: '2026-11-01', type: 'carousel', media: ['media/post-07.jpg'], title: 'Ravioli al ragù', theme: 'food', validated: true },
        { id: 'p06', date: '2026-11-03', type: 'carousel', media: ['media/post-06.jpg'], title: 'La famiglia devant Enza', theme: 'service', validated: true },
        { id: 'p05', date: '2026-11-04', type: 'carousel', media: ['media/post-05.jpg'], title: 'La Selezione Tartufo, Louvre', theme: 'food', validated: true },
        { id: 'p04', date: '2026-11-06', type: 'reel', poster: 'media/post-04.jpg', title: 'Reel penne, guanciale et pecorino', theme: 'food', validated: true },
        { id: 'p03', date: '2026-11-08', type: 'post', media: ['media/post-03.jpg'], title: 'Menu di Autunno, Enza Famiglia Louvre', theme: 'food', validated: true },
        { id: 'p02', date: '2026-11-10', type: 'post', media: ['media/post-02.jpg'], title: 'Le petit-déjeuner Enza', theme: 'food', validated: true },
        { id: 'p01', date: '2026-11-12', type: 'post', media: ['media/post-01.jpg'], title: 'Penne, guanciale et pecorino', theme: 'food', validated: true },
      ],
    },
  ],

  // Feed de @enzafamiglia au 28 septembre (du plus récent au plus ancien), affiché après les publications
  feedExisting: [
    'media/live-1.jpg', 'media/live-2.jpg', 'media/live-3.jpg', 'media/live-4.jpg', 'media/live-5.jpg', 'media/live-6.jpg',
    'media/live-7.jpg', 'media/live-8.jpg', 'media/live-9.jpg', 'media/live-10.jpg', 'media/live-11.jpg',
  ],

  // Passages (shootings, tournages, rendez-vous), missions en cours et modifications des posts : partagés entre
  // tous les visiteurs via suivi.php. Sans PHP (aperçu), data/suivi.json est lu tel quel.
  suivi: {
    api: 'suivi.php',
    data: 'data/suivi.json',
    calendar: false,
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

  // Thématiques : une étiquette de couleur par post (choisie dans « Modifier la publication »),
  // reprise sur la fiche du post et dans le calendrier du PDF
  themes: [
    { id: 'food', label: 'Food/Cuisine', bg: '#f6d199', fg: '#7a3a22' },
    { id: 'bar', label: 'Bar & Mixologie', bg: '#b8d9e1', fg: '#1d3c4a' },
    { id: 'service', label: 'Service/Ambiance', bg: '#f1bdbd', fg: '#7c2c2e' },
    { id: 'design', label: 'Design/Lifestyle', bg: '#b3d69b', fg: '#22401c' },
    { id: 'mood', label: 'Mood/Inspi', bg: '#ababab', fg: '#2e2a2a' },
    { id: 'events', label: 'Events', bg: '#6f2f31', fg: '#f3893f' },
  ],

  // Retours du client : Validé / À revoir + commentaire, envoyés en un récapitulatif.
  feedback: { whatsapp: '' },

  // Export du feed en PDF (bouton sous l'aperçu du feed)
  pdf: true,

  footer: 'Planning soumis à validation. Visuels et wording susceptibles d’évoluer.',
};
