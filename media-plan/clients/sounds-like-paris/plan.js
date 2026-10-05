/*
 * Media planning — Sounds Like Paris (Soundslike, agence de musique live). Planning du mois : octobre 2026.
 * Visuels provisoires aux couleurs de la marque : l'équipe les remplace depuis l'espace équipe
 * (photo et légende de chaque post et de chaque campagne sponsorisée).
 * Passages, missions, modifications et budget : data/suivi.json, via suivi.php.
 */
window.PLAN = {
  client: {
    name: 'Sounds Like Paris',
    logo: 'logo.svg',
    badge: 'logo.svg',
    services: ['Live music', 'Photo', 'Vidéo', 'CM', 'Ads'],
    location: 'Paris',
    // Logo « sounds like » en minuscules fines : trait d'écriture adapté, pas de grand trait final
    writeStroke: 12,
    writeFlourish: false,
    instagram: 'soundslike.paris',
  },

  title: 'Media planning',
  period: 'Octobre 2026',
  brandText: 'Do you know what <em>sound</em> music makes&nbsp;?',
  intro:
    'Les plus belles adresses de Paris ont une <em>bande-son</em>. Un mois pour la faire entendre : les lieux, les formats, les artistes, et les soirées qu’on organise sur mesure.',

  // Couleurs du site (DA Instagram) : vert nuit, ivoire champagne, or. Bascule en fondu après l'ouverture 18H22.
  theme: {
    bg: '#10261d',
    'bg-deep': '#0b1c15',
    ink: '#ece2cc',
    'ink-soft': 'rgba(236, 226, 204, 0.72)',
    'ink-faint': 'rgba(236, 226, 204, 0.18)',
    bar: 'rgba(16, 38, 29, 0.9)',
    tint: 'rgba(236, 226, 204, 0.05)',
    paper: '#0c1f17',
    gold: '#c6a062',
  },
  // Typographie du client pour le texte ; titres et haut de page restent en 18H22
  fonts: {
    css: 'fonts/fonts.css',
    text: "'Jost Sounds', Jost, 'Futura', 'Helvetica Neue', sans-serif",
  },

  // Un planning par mois. Chaque post a un id : ses modifications (photo, légende) y sont rattachées.
  months: [
    {
      title: 'Octobre, <em>la saison</em> du live',
      theme: 'Deux rendez-vous par semaine : un lieu, un format, un visage. Les reels pour l’ambiance, les carrousels pour l’offre.',
      posts: [
        {
          id: 'oct-01',
          date: '2026-10-08',
          time: '18h30',
          type: 'post',
          media: 'media/manifeste.jpg',
          title: 'Paris s’écoute',
          caption: [
            'Il y a des lieux qu’on regarde. Et des lieux qu’on écoute.',
            'Soundslike, la musique live des plus belles adresses de Paris.',
          ],
          hashtags: ['#soundslike', '#livemusic', '#paris'],
        },
        {
          id: 'oct-02',
          date: '2026-10-10',
          time: '19h00',
          type: 'reel',
          poster: 'media/reel-fouquets.jpg',
          title: 'Le week-end, en live',
          caption: ['Un duo, une voix, les Champs-Élysées.', 'Chaque week-end, la musique prend place à table.'],
          hashtags: ['#soundslike', '#fouquets', '#duo'],
        },
        {
          id: 'oct-03',
          date: '2026-10-14',
          time: '12h30',
          type: 'carousel',
          media: ['media/formats-1.jpg', 'media/formats-2.jpg', 'media/formats-3.jpg', 'media/formats-4.jpg', 'media/formats-5.jpg'],
          title: 'Nos formats',
          caption: [
            'Cabaret, ambiance, rooftop, cocktail lounge, party band.',
            'Cinq façons de faire sonner un lieu. Laquelle est la vôtre ?',
          ],
        },
        {
          id: 'oct-04',
          date: '2026-10-17',
          time: '18h30',
          type: 'post',
          media: 'media/ambassadeurs.jpg',
          title: 'Place de la Concorde',
          caption: ['Le soir tombe sur la Concorde, le piano prend le relais.', 'Live au Bar des Ambassadeurs, Hôtel de Crillon.'],
          note: 'Photo du live à prendre au prochain passage.',
        },
        {
          id: 'oct-05',
          date: '2026-10-21',
          time: '12h30',
          type: 'post',
          media: 'media/artistes.jpg',
          title: 'Les visages',
          caption: ['Derrière chaque soirée, une voix, des mains, une histoire.', 'Cette semaine, on vous présente l’un de nos artistes.'],
          note: 'Portrait d’artiste : choix de l’artiste à valider.',
        },
        {
          id: 'oct-06',
          date: '2026-10-24',
          time: '19h00',
          type: 'reel',
          poster: 'media/reel-backstage.jpg',
          title: 'Avant la première note',
          caption: ['Balances, accords, derniers regards.', 'Les coulisses d’un soir de live.'],
        },
        {
          id: 'oct-07',
          date: '2026-10-28',
          time: '12h30',
          type: 'carousel',
          media: ['media/prive-1.jpg', 'media/prive-2.jpg', 'media/prive-3.jpg'],
          title: 'Événements privés',
          caption: ['Mariages, lancements, dîners privés.', 'La musique sur mesure, de la première coupe au dernier morceau.'],
        },
        {
          id: 'oct-08',
          date: '2026-10-31',
          time: '18h00',
          type: 'post',
          media: 'media/halloween.jpg',
          title: 'Le 31, ça bascule',
          caption: ['Ce soir, le party band prend les commandes.', 'Bon Halloween.'],
        },
      ],
    },
  ],

  // Feed actuel du compte @soundslike.paris (du plus récent au plus ancien), affiché après le planning
  feedExisting: ['media/live-1.jpg', 'media/live-2.jpg', 'media/live-3.jpg', 'media/live-4.jpg', 'media/live-5.jpg', 'media/live-6.jpg', 'media/live-7.jpg', 'media/live-8.jpg', 'media/live-9.jpg'],

  // Campagnes sponsorisées (Meta : Instagram et Facebook), deux par mois.
  // Budget indicatif mensuel ; chaque campagne a sa part. Le dépensé est estimé au prorata des jours
  // tant que l'équipe n'a pas saisi le montant réel dans l'espace équipe.
  ads: {
    budget: 380,
    platform: 'Meta · Instagram & Facebook',
    campaigns: [
      {
        id: 'ad-oct-1',
        start: '2026-10-12',
        end: '2026-10-25',
        media: 'media/ad-prive.jpg',
        title: 'Événements privés',
        objective: 'Messages',
        audience: 'Paris + 30 km · 28-55 ans · mariage, événementiel, hôtellerie de luxe',
        cta: 'Envoyer un message',
        budget: 190,
        caption: [
          'Votre soirée mérite sa bande-son.',
          'Mariages, lancements, dîners privés : nos artistes jouent pour vous. Écrivez-nous.',
        ],
      },
      {
        id: 'ad-oct-2',
        start: '2026-10-16',
        end: '2026-10-31',
        media: 'media/ad-live.jpg',
        title: 'Live dans les palaces',
        objective: 'Notoriété',
        audience: 'Paris · 25-50 ans · cocktails, jazz, hôtels de luxe, sorties',
        cta: 'En savoir plus',
        budget: 190,
        caption: [
          'Les plus belles adresses de Paris s’écoutent.',
          'Duos, pianos, party bands : retrouvez nos artistes chaque soir.',
        ],
      },
    ],
  },

  // Passages (shootings, tournages, rendez-vous), missions en cours et modifications de l'équipe :
  // partagés entre tous les visiteurs via suivi.php. Sans PHP (aperçu), data/suivi.json est lu tel quel.
  suivi: {
    api: 'suivi.php',
    data: 'data/suivi.json',
    team: ['Fabrizio', 'Jade'],
    // Fabrizio en couleurs 18H22, Jade aux couleurs du client
    colors: { Fabrizio: '#22365f', Jade: '#a8834a' },
  },

  // Retours du client : Validé / À revoir + commentaire, envoyés en un récapitulatif.
  feedback: { whatsapp: '' },

  footer: 'Planning soumis à validation. Visuels provisoires, wording et budgets susceptibles d’évoluer.',
};
