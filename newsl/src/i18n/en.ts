import type { Dict } from './types';

const en: Dict = {
  meta: {
    title: 'Soundslike — Bespoke private music experiences',
    description:
      'A Parisian house of musical creation. Private soirées, weddings, luxury maisons, villas and yachts: we compose bespoke musical experiences, with absolute discretion.',
    locale: 'en_GB',
  },
  langName: 'English',
  nav: {
    experiences: 'Experiences',
    casting: 'Casting',
    maison: 'The House',
    contact: 'Private enquiry',
    menu: 'Menu',
    close: 'Close',
  },
  sound: { label: 'Sound', on: 'Sound on', off: 'Sound off' },
  hero: {
    eyebrow: 'House of musical creation — Paris',
    tagline: 'Sounds like you.',
    sub: 'Bespoke musical experiences for the most discerning private events.',
    scroll: 'Scroll',
  },
  manifesto: {
    label: 'Manifesto',
    text: 'We do not book artists. We compose evenings. A voice at the precise moment glasses are raised, a piano that fades as conversation rises, an orchestra that appears at midnight. Every note is written for you, your guests, your venue — and will never be played again.',
    words: ['Elegance', 'Emotion', 'Discretion', 'Excellence'],
  },
  experiences: {
    label: 'Experiences',
    title: 'Five ways to entertain',
    intro: 'Every project is unique. These are the stages we know best.',
    drag: 'Scroll through',
    items: [
      {
        id: 'privees',
        title: 'Private soirées',
        where: 'Hôtels particuliers · Residences · Rooftops',
        text: 'A dinner for twelve or a night for three hundred. The music follows the rhythm of your guests, from the first glass to the last dance.',
        image: 'trio-robe-rouge',
      },
      {
        id: 'mariages',
        title: 'Weddings',
        where: 'Châteaux · Estates · Palaces',
        text: 'From the ceremony to the ball, one musical direction: string quartet, soul voices, evening orchestra — a single signature.',
        image: 'guitariste-noeud',
      },
      {
        id: 'maisons',
        title: 'Maisons & brands',
        where: 'Launches · Gala dinners · Shows',
        text: 'For luxury maisons, we compose a sound identity that reflects their world, down to the finest detail.',
        image: 'chanteuse-paillettes',
      },
      {
        id: 'villas',
        title: 'Villas & yachts',
        where: 'Saint-Tropez · Mykonos · Courchevel · Dubai',
        text: 'Our artists join you wherever you are. Logistics, production, discretion: everything is taken care of.',
        image: 'percussions',
      },
      {
        id: 'celebrations',
        title: 'Celebrations',
        where: 'Birthdays · Engagements · Surprises',
        text: 'A song that feels like you, an unexpected appearance, a moment your loved ones will talk about for years.',
        image: 'pianiste-chandelles',
      },
    ],
  },
  casting: {
    label: 'Casting',
    title: 'Artists chosen one by one',
    intro:
      'Singing pianists, soul divas, jazz ensembles, cabaret revues: we bring together the finest talents of the Parisian and international stage, and compose the ideal line-up for every evening.',
    acts: [
      { title: 'Piano & voice', image: 'pianiste-bar' },
      { title: 'Jazz trio', image: 'trio-jazz-bistrot' },
      { title: 'Soul voice', image: 'chanteuse-bar' },
      { title: 'Performer', image: 'artiste-sofa' },
      { title: 'Guitar & voice', image: 'guitariste-salle-doree' },
      { title: 'Cabaret revue', image: 'trois-chanteuses' },
      { title: 'Live band', image: 'concert-velours' },
    ],
  },
  venues: {
    label: 'The House',
    title: 'They entrust us with their nights',
    intro:
      "For years, Paris's most exclusive addresses have entrusted us with their music. Today we bring that same standard to your private events.",
    brands: 'Maisons that have placed their trust in us',
    items: [
      { name: 'Le Crillon', mood: 'Excellence & refinement', line: 'Ensembles in perfect harmony with the Parisian experience.' },
      { name: "Maxim's", mood: 'The Roaring Twenties', line: 'Swing, rock’n’blues and Motown spirit.' },
      { name: 'Mondaine', mood: 'An extravagant show', line: 'A contemporary cabaret with a daring cast.' },
      { name: 'Le Piaf', mood: 'The French touch', line: "The capital's finest singing pianists." },
      { name: 'Gigi', mood: 'Italian elegance', line: 'Jazz and dolce vita.' },
      { name: "L'Abbaye des Vaux-de-Cernay", mood: 'Warmth & conviviality', line: 'A touch of Piaf in the countryside.' },
      { name: 'Darmima', mood: 'The Orient', line: 'Sun-soaked rhythms and spellbinding voices.' },
      { name: 'Coco', mood: 'Warmth & conviviality', line: 'Latin and groove, from table to table.' },
    ],
  },
  method: {
    label: 'Bespoke',
    title: 'A score in four movements',
    steps: [
      { title: 'Listening', text: 'A confidential conversation to understand your guests, your venue, your memories.' },
      { title: 'Composition', text: 'We write the musical thread of the evening, minute by minute, from arrival to the last glass.' },
      { title: 'Casting', text: 'We bring together artists and production, and rehearse every key moment with them.' },
      { title: 'The evening', text: 'We orchestrate everything behind the scenes. All you have to do is receive.' },
    ],
  },
  contact: {
    label: 'Private enquiry',
    title: "Let's talk about your evening",
    intro: 'Every project begins with a conversation. It stays between us.',
    fields: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      date: 'Date',
      place: 'Venue or city',
      guests: 'Number of guests',
      occasion: 'Occasion',
      message: 'Your project',
    },
    occasions: ['Private soirée', 'Wedding', 'Maison & brand', 'Villa or yacht', 'Celebration', 'Other'],
    submit: 'Send enquiry',
    note: 'We will get back to you personally, with complete discretion.',
    sent: 'Your email app will open to send the enquiry.',
    direct: 'Direct line',
  },
  footer: {
    rights: 'All rights reserved',
    legal: 'Legal notice',
    privacy: 'Privacy',
    credits: 'Design & development',
  },
};

export default en;
