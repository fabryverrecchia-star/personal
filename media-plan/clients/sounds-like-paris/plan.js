/*
 * Media planning — Sounds Like Paris (Soundslike, agence de musique live). Nouveau planning du 6 novembre 2026 :
 * 9 posts du 9 au 28 novembre, sur le modèle La Petite Maison (ouverture directe sur les logos, sommaire, feed d'abord,
 * chaque post s'ouvre en fenêtre depuis le feed, « + » pour en ajouter). Pas de stories ni de teasing.
 * Rendez-vous fixe : « Sound of the week », chaque lundi (n° 1 : Tanya).
 * Feed actuel = 10 vignettes reprises de la grille Instagram du 6 novembre (feedExisting).
 * Visuels provisoires aux couleurs de la marque : l'équipe les remplace depuis l'espace équipe (code MANCLEM).
 */
window.PLAN = {
  client: {
    name: 'Sounds Like Paris',
    logo: 'logo.svg',
    badge: 'logo.svg',
    services: ['Live music', 'Photo', 'Vidéo', 'CM', 'Ads'],
    location: 'Paris',
    writeStroke: 12,
    writeFlourish: false,
    instagram: 'soundslike.paris',
  },

  title: 'Media planning',
  period: 'Novembre 2026',
  // Comme La Petite Maison : la page s'ouvre directement sur les logos, sans animation d'ouverture ni au défilement
  intro: false,
  heroCompact: true,
  noScrollAnim: true,
  // Sommaire : le feed (ouvert à l'arrivée), puis les campagnes sponsorisées. Lien direct : ?vue=feed, ?vue=ads
  menu: true,
  pubsInFeed: true,
  menuOrder: ['feed', 'ads'],
  menuOpen: 'feed',
  // Ni stories ni teasing pour ce client
  stories: false,
  stats: false,

  // Couleurs du site (DA Instagram) : vert nuit, ivoire champagne, or
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
  fonts: {
    css: 'fonts/fonts.css',
    text: "'Jost Sounds', Jost, 'Futura', 'Helvetica Neue', sans-serif",
  },

  // Rythme : le lundi « Sound of the week », le mercredi une photo ou un carrousel, le samedi un reel.
  // Comme sur la grille actuelle : des voix en live, des détails (mains, clavier), des lieux la nuit, des portraits.
  months: [
    {
      title: 'Novembre, <em>la saison</em> du live',
      theme: '9 publications en trois semaines : le son du lundi, une voix ou un détail le mercredi, un reel d’ambiance le samedi.',
      month: '2026-11',
      posts: [
        {
          id: 'sotw-01',
          date: '2026-11-09',
          time: '12h30',
          type: 'carousel',
          media: ['media/sotw-tanya.jpg', 'media/artistes.jpg'],
          title: 'Sound of the week · Tanya',
          caption: [
            'Sound of the week, n° 1.',
            'Cette semaine, c’est Tanya. Le titre qu’on garde en tête jusqu’à lundi prochain.',
            'Montez le son.',
          ],
          hashtags: ['#soundoftheweek', '#soundslike', '#livemusic', '#paris'],
          note: 'Rendez-vous fixe chaque lundi. Slide 1 : la pochette, slide 2 : Tanya en live. Titre du morceau à confirmer.',
        },
        {
          id: 'nov-01',
          date: '2026-11-11',
          time: '18h30',
          type: 'post',
          media: 'media/artistes.jpg',
          title: 'La voix du soir',
          caption: ['Une robe, une voix, la salle qui se tait.', 'Chaque soir, la musique live des plus belles adresses de Paris.'],
          hashtags: ['#soundslike', '#livemusic', '#paris'],
          note: 'Photo de chanteuse en live, lumière de scène, comme la robe à sequins de la grille.',
        },
        {
          id: 'nov-02',
          date: '2026-11-14',
          time: '19h00',
          type: 'reel',
          poster: 'media/reel-fouquets.jpg',
          title: 'Le live passe à table',
          caption: ['Les guitares entre les tables, la salle qui chante.', 'Le live ne reste pas sur scène.'],
          hashtags: ['#soundslike', '#liveband', '#dinner'],
          note: 'Les musiciens jouent de table en table, plans serrés sur les convives.',
        },
        {
          id: 'sotw-02',
          date: '2026-11-16',
          time: '12h30',
          type: 'carousel',
          media: ['media/sotw.jpg'],
          title: 'Sound of the week · n° 2',
          caption: ['Sound of the week, n° 2.', 'Le son de la semaine, choisi par nos artistes.'],
          hashtags: ['#soundoftheweek', '#soundslike'],
          note: 'Artiste et titre à choisir. Même gabarit que le n° 1.',
        },
        {
          id: 'nov-03',
          date: '2026-11-18',
          time: '18h30',
          type: 'post',
          media: 'media/ambassadeurs.jpg',
          title: 'Le détail qui s’entend',
          caption: ['Une main, un clavier, la première note.', 'Tout commence ici.'],
          hashtags: ['#soundslike', '#piano', '#paris'],
          note: 'Gros plan sur les mains du pianiste, lumière chaude et flou de bougies.',
        },
        {
          id: 'nov-04',
          date: '2026-11-21',
          time: '19h00',
          type: 'reel',
          poster: 'media/reel-backstage.jpg',
          title: 'Un artiste, une chanson',
          caption: ['Sa chanson pour faire lever la salle.', 'Un artiste, un titre, une soirée.'],
          hashtags: ['#soundslike', '#artist', '#livemusic'],
          note: 'Portrait d’artiste en noir et blanc, comme le chanteur à la veste brodée de la grille.',
        },
        {
          id: 'sotw-03',
          date: '2026-11-23',
          time: '12h30',
          type: 'carousel',
          media: ['media/sotw.jpg'],
          title: 'Sound of the week · n° 3',
          caption: ['Sound of the week, n° 3.', 'Le son de la semaine, choisi par nos artistes.'],
          hashtags: ['#soundoftheweek', '#soundslike'],
          note: 'Artiste et titre à choisir.',
        },
        {
          id: 'nov-05',
          date: '2026-11-25',
          time: '12h30',
          type: 'carousel',
          media: ['media/prive-1.jpg', 'media/prive-2.jpg', 'media/prive-3.jpg'],
          title: 'Vos fêtes de fin d’année',
          caption: [
            'Soirées d’entreprise, dîners privés, réveillons.',
            'Il reste quelques dates en décembre. Écrivez-nous.',
          ],
          hashtags: ['#soundslike', '#privateevent', '#paris'],
          note: 'Photos d’événements privés de nuit, comme la scène en coquillage dans le jardin.',
        },
        {
          id: 'nov-06',
          date: '2026-11-28',
          time: '19h00',
          type: 'reel',
          poster: 'media/reel-fouquets.jpg',
          title: 'Soirée Sounds Like',
          caption: ['Le party band, la piste, et personne ne rentre tôt.', 'Merci à tous pour cette soirée.'],
          hashtags: ['#soundslike', '#partyband', '#paris'],
          note: 'Récap d’une soirée : foule qui danse, logo sounds like en lumière.',
        },
      ],
    },
  ],

  // Feed actuel de @soundslike.paris au 6 novembre (10 posts, les trois premiers épinglés), affiché après les publications prévues
  feedExisting: ['media/live-01.jpg', 'media/live-02.jpg', 'media/live-03.jpg', 'media/live-04.jpg', 'media/live-05.jpg', 'media/live-06.jpg', 'media/live-07.jpg', 'media/live-08.jpg', 'media/live-09.jpg', 'media/live-10.jpg'],

  // Campagnes sponsorisées (Meta : Instagram et Facebook), deux par mois, budget indicatif 380 € par mois
  ads: {
    budget: 380,
    platform: 'Meta · Instagram & Facebook',
    campaigns: [
      {
        id: 'ad-nov-1',
        start: '2026-11-09',
        end: '2026-11-29',
        media: 'media/ad-prive.jpg',
        title: 'Fêtes de fin d’année',
        objective: 'Messages',
        audience: 'Paris + 30 km · 28-55 ans · entreprises, événementiel, hôtellerie de luxe',
        cta: 'Envoyer un message',
        budget: 190,
        caption: ['Votre soirée de fin d’année mérite sa bande-son.', 'Soirées d’entreprise, dîners privés : nos artistes jouent pour vous. Écrivez-nous.'],
      },
      {
        id: 'ad-nov-2',
        start: '2026-11-16',
        end: '2026-11-30',
        media: 'media/ad-live.jpg',
        title: 'Live dans les palaces',
        objective: 'Notoriété',
        audience: 'Paris · 25-50 ans · cocktails, jazz, hôtels de luxe, sorties',
        cta: 'En savoir plus',
        budget: 190,
        caption: ['Les plus belles adresses de Paris s’écoutent.', 'Duos, pianos, party bands : retrouvez nos artistes chaque soir.'],
      },
    ],
  },

  // Modifications des posts et des campagnes, inspirations : partagées entre tous les visiteurs via suivi.php.
  // Comme La Petite Maison : ni calendrier ni missions.
  suivi: {
    api: 'suivi.php',
    data: 'data/suivi.json',
    calendar: false,
    missions: false,
    passages: false,
    team: ['Fabrizio', 'Manon', 'Clément'],
    colors: { Fabrizio: '#22365f', Manon: '#a8834a', 'Clément': '#6f9480' },
  },

  feedback: { whatsapp: '' },

  footer: 'Planning soumis à validation. Visuels provisoires, wording et budgets susceptibles d’évoluer.',
};
