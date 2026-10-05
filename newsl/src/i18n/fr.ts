import type { Dict } from './types';

const fr: Dict = {
  meta: {
    title: 'Soundslike — Expériences musicales privées sur-mesure',
    description:
      "Maison de création musicale parisienne. Soirées privées, mariages, maisons de luxe, villas et yachts : nous composons des expériences musicales sur-mesure, en toute discrétion.",
    locale: 'fr_FR',
  },
  langName: 'Français',
  nav: {
    experiences: 'Expériences',
    casting: 'Casting',
    maison: 'La Maison',
    contact: 'Demande privée',
    menu: 'Menu',
    close: 'Fermer',
  },
  sound: { label: 'Son', on: 'Son activé', off: 'Son coupé' },
  hero: {
    eyebrow: 'Maison de création musicale — Paris',
    tagline: 'Sounds like you.',
    sub: 'Des expériences musicales sur-mesure pour les soirées privées les plus exigeantes.',
    scroll: 'Défiler',
  },
  manifesto: {
    label: 'Manifeste',
    text: "Nous ne programmons pas des artistes. Nous composons des soirées. Une voix au moment précis où l'on lève son verre, un piano qui s'efface quand la conversation s'élève, un orchestre qui surgit à minuit. Chaque note est écrite pour vous, vos invités, votre lieu — et ne sera jamais rejouée.",
    words: ['Élégance', 'Émotion', 'Discrétion', 'Excellence'],
  },
  experiences: {
    label: 'Expériences',
    title: 'Cinq façons de recevoir',
    intro: 'Chaque projet est unique. Voici les scènes que nous connaissons le mieux.',
    drag: 'Faire défiler',
    items: [
      {
        id: 'privees',
        title: 'Soirées privées',
        where: 'Hôtels particuliers · Appartements · Rooftops',
        text: "Un dîner pour douze ou une nuit pour trois cents. La musique épouse le rythme de vos invités, du premier verre à la dernière danse.",
        image: 'trio-robe-rouge',
      },
      {
        id: 'mariages',
        title: 'Mariages',
        where: 'Châteaux · Domaines · Palaces',
        text: "De la cérémonie au bal, une direction musicale unique : quatuor à cordes, voix soul, orchestre de soirée — une seule signature.",
        image: 'guitariste-noeud',
        video: 'mariage',
      },
      {
        id: 'maisons',
        title: 'Maisons & marques',
        where: 'Lancements · Dîners de gala · Défilés',
        text: "Pour les maisons de luxe, nous composons une identité sonore à l'image de leur univers, jusque dans le moindre détail.",
        image: 'chanteuse-paillettes',
      },
      {
        id: 'villas',
        title: 'Villas & yachts',
        where: 'Saint-Tropez · Mykonos · Courchevel · Dubaï',
        text: "Nos artistes vous rejoignent où que vous soyez. Logistique, technique, discrétion : tout est pris en charge.",
        image: 'percussions',
      },
      {
        id: 'celebrations',
        title: 'Célébrations',
        where: 'Anniversaires · Fiançailles · Surprises',
        text: "Une chanson qui vous ressemble, une apparition inattendue, un moment que vos proches raconteront longtemps.",
        image: 'pianiste-chandelles',
      },
    ],
  },
  casting: {
    label: 'Casting',
    title: 'Des artistes choisis un à un',
    intro:
      "Pianistes chanteurs, divas soul, formations jazz, revues cabaret : nous réunissons les plus beaux talents de la scène parisienne et internationale, et composons pour chaque soirée la formation idéale.",
    acts: [
      { title: 'Piano & voix', image: 'pianiste-bar' },
      { title: 'Trio jazz', image: 'trio-jazz-bistrot' },
      { title: 'Voix soul', image: 'chanteuse-bar' },
      { title: 'Performer', image: 'artiste-sofa' },
      { title: 'Guitare & voix', image: 'guitariste-salle-doree' },
      { title: 'Revue cabaret', image: 'trois-chanteuses' },
      { title: 'Live band', image: 'concert-velours' },
    ],
  },
  venues: {
    label: 'La Maison',
    title: 'Ils nous confient leurs nuits',
    intro:
      "Depuis des années, les adresses les plus exclusives de Paris nous confient leur programmation musicale. Cette exigence, nous la mettons aujourd'hui au service de vos soirées privées.",
    brands: 'Les maisons qui nous ont fait confiance',
    items: [
      { name: 'Le Crillon', mood: 'Excellence & raffinement', line: "Des formations en parfaite harmonie avec l'expérience parisienne." },
      { name: "Maxim's", mood: 'Les années folles', line: 'Swing, rock’n’blues et esprit Motown.' },
      { name: 'Mondaine', mood: 'Un show extravagant', line: 'Un cabaret contemporain au casting audacieux.' },
      { name: 'Le Piaf', mood: 'La french touch', line: 'Les meilleurs pianistes chanteurs de la capitale.' },
      { name: 'Gigi', mood: "L'élégance à l'italienne", line: 'Jazz et dolce vita.' },
      { name: "L'Abbaye des Vaux-de-Cernay", mood: 'Ambiance & convivialité', line: 'Comme un air de Piaf à la campagne.' },
      { name: 'Darmima', mood: "L'Orient", line: 'Rythmes solaires et voix envoûtantes.' },
      { name: 'Coco', mood: 'Chaleur & convivialité', line: 'Latino et groove, de table en table.' },
    ],
  },
  method: {
    label: 'Sur-mesure',
    title: 'Une partition en quatre temps',
    steps: [
      { title: "L'écoute", text: 'Une conversation confidentielle pour comprendre vos invités, votre lieu, vos souvenirs.' },
      { title: 'La composition', text: "Nous écrivons le fil musical de la soirée, minute par minute, de l'arrivée au dernier verre." },
      { title: 'Le casting', text: 'Nous réunissons les artistes et la technique, et répétons avec eux chaque moment clé.' },
      { title: 'La soirée', text: "Nous orchestrons tout, en coulisses. Vous n'avez plus qu'à recevoir." },
    ],
  },
  contact: {
    label: 'Demande privée',
    title: 'Parlons de votre soirée',
    intro: 'Chaque projet commence par une conversation. Elle reste entre nous.',
    fields: {
      name: 'Nom',
      email: 'E-mail',
      phone: 'Téléphone',
      date: 'Date',
      place: 'Lieu ou ville',
      guests: "Nombre d'invités",
      occasion: 'Occasion',
      message: 'Votre projet',
    },
    occasions: ['Soirée privée', 'Mariage', 'Maison & marque', 'Villa ou yacht', 'Célébration', 'Autre'],
    submit: 'Envoyer la demande',
    note: 'Nous revenons vers vous personnellement, en toute discrétion.',
    sent: 'Votre messagerie va s’ouvrir pour envoyer la demande.',
    direct: 'Ligne directe',
  },
  footer: {
    rights: 'Tous droits réservés',
    legal: 'Mentions légales',
    privacy: 'Confidentialité',
    credits: 'Design & développement',
  },
};

export default fr;
