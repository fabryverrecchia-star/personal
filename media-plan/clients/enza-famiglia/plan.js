/*
 * Media planning — Enza Famiglia (Louvre, La Défense). Base La Petite Maison : planning au mois.
 * Aucun post prévu dans le fichier : l'équipe les ajoute depuis la page (Espace équipe → Publications).
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
  intro:
    'Trattoria, pizzeria, aperitivo. Ici, le feed tel qu’il est aujourd’hui, les <em>prochaines publications</em> des deux adresses, du Louvre à La Défense, et vos retours avant chaque mise en ligne.',

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
      title: 'Novembre, la <em>famiglia</em>',
      theme: 'Le feed en ligne aujourd’hui, et les prochaines publications du Louvre et de La Défense.',
      month: '2026-11',
      // Vide : l'équipe ajoute les publications depuis l'espace équipe (Publications → Ajouter une publication)
      posts: [],
    },
  ],

  // Feed actuel de @enzafamiglia (du plus récent au plus ancien), affiché après le planning
  feedExisting: [
    'media/live-1.jpg', 'media/live-2.jpg', 'media/live-3.jpg', 'media/live-4.jpg', 'media/live-5.jpg', 'media/live-6.jpg',
    'media/live-7.jpg', 'media/live-8.jpg', 'media/live-9.jpg', 'media/live-10.jpg', 'media/live-11.jpg',
  ],

  // Passages (shootings, tournages, rendez-vous), missions en cours et modifications des posts : partagés entre
  // tous les visiteurs via suivi.php. Sans PHP (aperçu), data/suivi.json est lu tel quel.
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
