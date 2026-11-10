/*
 * Media planning — Jacqueline, table gastronomique, Paris 9e (@jacqueline_restaurant_paris).
 * 3 novembre 2026 : refait sur le modèle La Petite Maison (le feed ouvert à l'arrivée, puis les stories, puis les idées).
 * Plus de rubrique Publications : chaque post s'ouvre en fenêtre depuis le feed, « + » en tête du feed pour en ajouter.
 * Octobre (lancement) : les six posts du lancement, passés en « En ligne ». Novembre : plan complet proposé
 * (13 posts, 14 stories, 3 idées vidéo). Visuels de novembre : cartes « Visuel à venir » (media/nov-*.jpg),
 * l'équipe les remplace depuis l'espace équipe. Plats et produits cités : à valider avec la cuisine.
 * Modifications de l'équipe (photos, légendes, dates, ajouts, stories, idées) : data/suivi.json, via suivi.php.
 */
window.PLAN = {
  client: {
    name: 'Jacqueline',
    logo: 'monogram.svg',
    badge: 'monogram.svg',
    services: ['Lancement', 'Photo', 'Vidéo', 'CM'],
    location: 'Paris 9e',
    instagram: 'jacqueline_restaurant_paris',
  },

  title: 'Media planning',
  period: 'Novembre 2026',
  // Comme La Petite Maison : la page s'ouvre directement sur les logos, sans animation d'ouverture ni au défilement
  introDaily: true,
  intro: false,
  heroCompact: true,
  noScrollAnim: true,
  // Sommaire : le feed d'abord (ouvert à l'arrivée), puis les stories, puis les idées. Lien direct : ?vue=stories…
  menu: true,
  pubsInFeed: true,
  menuOrder: ['feed', 'stories', 'teasing'],
  menuOpen: 'feed',
  storiesByDay: true,
  stats: false,

  // Couleurs du client : marbre rose, veines lie-de-vin
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

  // Un planning par mois. Chaque post a un id : les modifications de l'espace équipe y sont rattachées.
  months: [
    {
      title: 'Le <em>lancement</em>',
      theme: 'Les six premiers rendez-vous, déjà en ligne.',
      month: '2026-10',
      posts: [
        { id: 'jq-01', date: '2026-09-28', type: 'post', media: 'media/lundi-courges.jpg', title: 'Réservations ouvertes', caption: ['Premiers services la semaine prochaine.', 'Réservations ouvertes.'] },
        { id: 'jq-02', date: '2026-09-29', time: '18h45', type: 'post', media: 'media/mardi-verre.jpg', title: 'Une table intime', caption: ['Une table intime, pensée dans le détail.', 'Jacqueline ouvre la semaine prochaine.'] },
        { id: 'jq-03', date: '2026-09-30', type: 'post', media: 'media/mercredi-accords.jpg', title: 'Les accords', caption: ['Des accords précis, au fil des séquences.'] },
        { id: 'jq-04', date: '2026-10-01', type: 'post', media: 'media/jeudi-paris.jpg', title: 'L’automne, point de départ', caption: ['L’automne comme point de départ.', 'Dans les teintes, les matières, dans les menus.', 'Au cœur du 9e arrondissement.'] },
        { id: 'jq-05', date: '2026-10-02', type: 'post', options: ['media/vendredi-1.jpg', 'media/vendredi-2.jpg', 'media/vendredi-3.jpg'], title: 'Iodé', caption: ['Une lecture iodée, franche et maîtrisée.'] },
        { id: 'jq-06', date: '2026-10-03', type: 'post', options: ['media/samedi-1.jpg', 'media/samedi-2.jpg', 'media/samedi-3.jpg'], title: 'L’ouverture approche', caption: ['Jacqueline ouvre la semaine prochaine.', 'Réservations ouvertes.'] },
      ],
    },
    {
      title: 'Novembre, la <em>saison</em>',
      theme: 'Trois rendez-vous par semaine : le produit, le geste, la salle. Une vidéo chaque semaine.',
      month: '2026-11',
      posts: [
        {
          id: 'nov-01', date: '2026-11-04', time: '12h00', type: 'carousel',
          media: ['media/nov-01-1.jpg', 'media/nov-01-2.jpg', 'media/nov-01-3.jpg', 'media/nov-01-4.jpg'],
          title: 'Novembre arrive en cuisine',
          caption: ['Novembre arrive en cuisine.', 'Cèpes, Saint-Jacques, courges, coings : le menu suit la saison.', 'Réservations en bio.'],
          note: 'À shooter : quatre produits bruts, plan serré, sur le marbre de la salle. Produits à valider avec la cuisine.',
        },
        {
          id: 'nov-02', date: '2026-11-06', time: '18h30', type: 'post',
          media: 'media/nov-02.jpg',
          title: 'La salle',
          caption: ['Une salle dessinée par Pierre Gonalons.', 'Des teintes, des matières, une lumière pensée pour le soir.'],
          note: 'À shooter : la salle vide juste avant le service, lumière du soir. Identifier @pierregonalons.',
        },
        {
          id: 'nov-03', date: '2026-11-08', time: '19h00', type: 'reel',
          poster: 'media/nov-03.jpg',
          title: 'Le geste',
          caption: ['Précision.', 'Une assiette, quelques gestes, rien de plus.'],
          note: 'Vidéo : voir l’idée 01 « Le geste ». Dressage en plans très serrés, 15 secondes, le son de la cuisine.',
        },
        {
          id: 'nov-04', date: '2026-11-10', time: '12h00', type: 'post',
          media: 'media/nov-04.jpg',
          title: 'La Saint-Jacques',
          caption: ['La Saint-Jacques est de retour.', 'Servie juste nacrée, au menu de novembre.'],
          note: 'À shooter : l’assiette Saint-Jacques en plongée, sur nappe. Plat à valider avec la cuisine.',
        },
        {
          id: 'nov-05', date: '2026-11-12', time: '18h30', type: 'carousel',
          media: ['media/nov-05-1.jpg', 'media/nov-05-2.jpg', 'media/nov-05-3.jpg'],
          title: 'Les accords de novembre',
          caption: ['Chaque séquence a son verre.', 'Les accords de novembre, choisis au fil du menu.'],
          note: 'À shooter : trois verres servis, chacun avec son assiette, mains du sommelier dans le cadre.',
        },
        {
          id: 'nov-06', date: '2026-11-14', time: '11h00', type: 'post',
          media: 'media/nov-06.jpg',
          title: 'Samedi soir',
          caption: ['Samedi soir chez Jacqueline.', 'Quelques tables restent pour ce soir. Réservation en bio.'],
          note: 'À shooter : une table pour deux dressée, bougie allumée. Ne publier que s’il reste des tables.',
        },
        {
          id: 'nov-07', date: '2026-11-17', time: '17h30', type: 'reel',
          poster: 'media/nov-07.jpg',
          title: 'Avant le service',
          caption: ['17h. La mise en place.', 'Ce que l’on ne voit pas, et qui fait tout.'],
          note: 'Vidéo : voir l’idée 02 « Avant le service ». Coulisses de la mise en place, cuisine et salle.',
        },
        {
          id: 'nov-08', date: '2026-11-19', time: '12h00', type: 'post',
          media: 'media/nov-08.jpg',
          title: 'Les sous-bois',
          caption: ['Les champignons des sous-bois.', 'Une assiette d’automne, généreuse et simple.'],
          note: 'À shooter : l’assiette champignons, lumière naturelle. Plat à valider avec la cuisine.',
        },
        {
          id: 'nov-09', date: '2026-11-21', time: '18h30', type: 'carousel',
          media: ['media/nov-09-1.jpg', 'media/nov-09-2.jpg', 'media/nov-09-3.jpg', 'media/nov-09-4.jpg'],
          title: 'Les détails',
          caption: ['Le lin, le verre, le métal, le marbre.', 'Une table se lit aussi dans ses détails.'],
          note: 'Suite des « textures » du lancement : quatre détails de la table en gros plan.',
        },
        {
          id: 'nov-10', date: '2026-11-24', time: '12h00', type: 'post',
          media: 'media/nov-10.jpg',
          title: 'Le dessert',
          caption: ['Le coing, la châtaigne.', 'Le dessert de novembre.'],
          note: 'À shooter : le dessert du menu, en plan serré. Plat à valider avec la cuisine.',
        },
        {
          id: 'nov-11', date: '2026-11-26', time: '19h00', type: 'reel',
          poster: 'media/nov-11.jpg',
          title: 'Une soirée chez Jacqueline',
          caption: ['De la première coupe au dernier café.', 'Une soirée chez Jacqueline.'],
          note: 'Vidéo : voir l’idée 03 « Une soirée ». 20 à 25 secondes, de l’arrivée au dessert.',
        },
        {
          id: 'nov-12', date: '2026-11-28', time: '11h00', type: 'post',
          media: 'media/nov-12.jpg',
          title: 'Décembre se réserve',
          caption: ['Décembre se réserve dès maintenant.', 'Dîners entre proches, tables de fin d’année : réservation en bio.'],
          note: 'À shooter : une grande table dressée. Ajouter les groupes ou la privatisation seulement si c’est proposé.',
        },
        {
          id: 'nov-13', date: '2026-11-30', time: '18h30', type: 'carousel',
          media: ['media/nov-13-1.jpg', 'media/nov-13-2.jpg', 'media/nov-13-3.jpg', 'media/nov-13-4.jpg', 'media/nov-13-5.jpg'],
          title: 'Novembre chez Jacqueline',
          caption: ['Novembre chez Jacqueline.', 'Merci d’avoir été à table avec nous ce mois-ci.'],
          note: 'Les meilleures images du mois, prises pendant les tournages.',
        },
      ],
    },
  ],

  // Stories de novembre, rangées jour par jour. Visuel, jour, heure et texte se modifient depuis l'espace équipe.
  // Stories : l'équipe les ajoute elle-même depuis la page (10 novembre : stories proposées retirées)
  stories: [],

  // Idées vidéo du mois : l'équipe peut réécrire chaque idée ou l'argumenter depuis l'espace équipe
  teasing: {
    kicker: 'Novembre',
    title: 'Idées <em>vidéo</em>',
    lead: 'Trois vidéos pour le mois, une par semaine à partir du 8 novembre. Chaque idée se modifie ou s’argumente depuis l’espace équipe. Date de tournage à fixer avec la cuisine.',
    ideas: [
      {
        id: 'v1',
        publish: '2026-11-08',
        rhythm: 'Ouvre le mois : la précision, en 15 secondes.',
        title: 'Le geste',
        text: [
          'Une seule assiette, du plan de travail vide jusqu’à l’envoi en salle.',
          'Uniquement des plans très serrés : la main, la pince, la sauce, le dernier détail posé. On ne voit jamais le visage.',
          'Pas de musique, le son de la cuisine amplifié. Fin sur l’assiette qui part en salle.',
        ],
        details: ['Quelle assiette ?', 'Musique légère, ou le son seul ?'],
      },
      {
        id: 'v2',
        publish: '2026-11-17',
        rhythm: 'Coulisses, la semaine du milieu du mois.',
        title: 'Avant le service',
        text: [
          '17h, la maison se prépare : les nappes, les verres qu’on essuie, la cuisine qui met en place.',
          'Une alternance de plans fixes entre la salle et la cuisine, rythmée par une horloge ou l’heure à l’écran.',
          'Fin : la porte s’ouvre, premier client, le service commence.',
        ],
        details: ['Montrer l’équipe de face, ou seulement les mains ?', 'Combien de plans ?'],
      },
      {
        id: 'v3',
        publish: '2026-11-26',
        rhythm: 'Avant décembre : donner envie de réserver.',
        title: 'Une soirée chez Jacqueline',
        text: [
          'Une soirée racontée du point de vue d’une table pour deux : l’arrivée, la première coupe, les séquences du menu, les accords, le dessert.',
          'Plans fixes et lents, lumière du soir, conversations feutrées en fond.',
          'Fin : « Jacqueline. Paris 9e. » et les réservations de décembre.',
        ],
        details: ['Avec des figurants, ou de vrais clients d’accord pour être filmés ?', 'Durée : 20 ou 30 secondes ?'],
      },
    ],
  },

  // Feed du compte au 28 septembre (avant le lancement), affiché après les publications prévues
  feedExisting: [
    'media/live-1.jpg', 'media/live-2.jpg', 'media/live-3.jpg', 'media/live-4.jpg', 'media/live-5.jpg',
    'media/live-6.jpg', 'media/live-7.jpg', 'media/live-8.jpg', 'media/live-9.jpg', 'media/live-10.jpg',
  ],

  // Modifications des posts, stories, inspirations et idées : partagées entre tous les visiteurs via suivi.php.
  // Sans PHP (aperçu), data/suivi.json est lu tel quel. Passages, calendrier et missions retirés comme sur La Petite Maison.
  suivi: {
    api: 'suivi.php',
    data: 'data/suivi.json',
    calendar: false,
    missions: false,
    passages: false,
    team: ['Fabrizio', 'Manon', 'Clément'],
    // Fabrizio en couleurs 18H22, Manon et Clément aux couleurs du client
    colors: { Fabrizio: '#22365f', Manon: '#a35a4a', 'Clément': '#7d5a3c' },
  },

  // Retours du client : Validé / À revoir + commentaire, envoyés en un récapitulatif.
  feedback: { whatsapp: '' },

  footer: 'Planning soumis à validation. Visuels et wording susceptibles d’évoluer.',
};
