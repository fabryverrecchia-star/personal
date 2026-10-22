/* Pages projet détaillées : une entrée par client, clé = titre du projet en minuscules.
   Les blocs s'affichent dans l'ordre. Types : gallery, logo, menus, palette, type. */
window.CASES = {
  'agata paris': {
    title: 'Agata Paris',
    cover: { src: 'assets/cases/agata/cover.webp', w: 1200, h: 934 },
    place: { fr: 'Pizzeria napoletana, Paris VI · Saint-Germain', en: 'Pizzeria napoletana, Paris VI · Saint-Germain', es: 'Pizzeria napoletana, París VI · Saint-Germain', it: 'Pizzeria napoletana, Parigi VI · Saint-Germain' },
    intro: {
      fr: 'Une pizzeria napolitaine sur la rive gauche. Nous avons dessiné une identité entre Paris et la Méditerranée : un monogramme qui noue l’alpha et le A, une couronne de lettres pour l’enseigne, une palette solaire et une direction artistique florale, de la carte au tote bag.',
      en: 'A Neapolitan pizzeria on the Left Bank. We drew an identity between Paris and the Mediterranean: a monogram knotting the alpha and the A, a crown of letters for the sign, a sunlit palette and a floral art direction, from the menu to the tote bag.',
      es: 'Una pizzería napolitana en la orilla izquierda. Dibujamos una identidad entre París y el Mediterráneo: un monograma que anuda la alfa y la A, una corona de letras para el rótulo, una paleta solar y una dirección artística floral, de la carta a la tote bag.',
      it: 'Una pizzeria napoletana sulla rive gauche. Abbiamo disegnato un’identità tra Parigi e il Mediterraneo: un monogramma che annoda l’alfa e la A, una corona di lettere per l’insegna, una palette solare e una direzione artistica floreale, dal menu alla tote bag.'
    },
    facts: [
      ['client', 'Agata Paris'],
      ['place', '168 boulevard Saint-Germain, Paris 6e'],
      ['missions', { fr: 'Identité, direction artistique, signalétique, print, social media', en: 'Identity, art direction, signage, print, social media', es: 'Identidad, dirección artística, señalética, print, social media', it: 'Identità, direzione artistica, insegne, print, social media' }],
      ['typeface', 'New Tropical Studio']
    ],
    blocks: [
      { type: 'gallery', label: 'mood', bg: '#050c0c', rows: [
        [{ src: 'assets/cases/agata/salle.webp', w: 933, h: 1400 }, { src: 'assets/cases/agata/pizza.webp', w: 800, h: 1066 }],
        [{ src: 'assets/cases/agata/banquette.webp', w: 1346, h: 1500 }],
        [{ src: 'assets/projects/p17.webp', w: 619, h: 1100 }, { src: 'assets/projects/p03.webp', w: 880, h: 1100 }],
        [{ src: 'assets/cases/agata/pivoine.webp', w: 1800, h: 995 }]
      ] },
      { type: 'logo', label: 'logo', src: 'assets/cases/agata/logo.svg', bg: '#ede3bf', ink: '#1b374f', color: '#c1413a' },
      { type: 'gallery', label: 'system', bg: '#ffffff', rows: [
        [{ src: 'assets/cases/agata/logotype.webp', w: 1800, h: 963 }],
        [{ src: 'assets/cases/agata/monogramme.webp', w: 1800, h: 762 }],
        [{ src: 'assets/cases/agata/sceaux.webp', w: 1800, h: 995 }, { src: 'assets/cases/agata/fleur.webp', w: 1800, h: 941 }],
        [{ src: 'assets/cases/agata/signes.webp', w: 1800, h: 991 }],
        [{ src: 'assets/cases/agata/enseigne.webp', w: 746, h: 851 }, { src: 'assets/cases/agata/coupe.webp', w: 1800, h: 954 }]
      ] },
      { type: 'menus', label: 'menus', bg: '#1b374f', items: [{ src: 'assets/cases/agata/menu-fr.webp', w: 732, h: 1500 }, { src: 'assets/cases/agata/menu-en.webp', w: 732, h: 1500 }] },
      { type: 'gallery', label: 'print', bg: '#ffffff', rows: [
        [{ src: 'assets/cases/agata/print.webp', w: 2000, h: 851 }],
        [{ src: 'assets/cases/agata/date.webp', w: 513, h: 900 }, { src: 'assets/cases/agata/book.webp', w: 1048, h: 1400 }],
        [{ src: 'assets/cases/agata/tote.webp', w: 1733, h: 1080 }, { src: 'assets/cases/agata/facade.webp', w: 1800, h: 1000 }],
        [{ src: 'assets/cases/agata/wordmark.webp', w: 1800, h: 663 }]
      ] },
      { type: 'palette', label: 'palette', bg: '#ffffff', colors: [
        { name: 'Lemon Meringue', hex: '#EDE3BF', use: 'base', share: 40 },
        { name: 'Sicilian Maxi. G/Yellow', hex: '#D8DF7F', use: 'light', share: 12 },
        { name: 'Parisian Red', hex: '#C1413A', use: 'signature', share: 22 },
        { name: 'Indigo', hex: '#1B374F', use: 'text', share: 16 },
        { name: 'Terracotta', hex: '#C0644E', use: 'warm', share: 10 }
      ] },
      { type: 'type', label: 'type', bg: '#ffffff', img: { src: 'assets/cases/agata/typo.webp', w: 1800, h: 914 }, credit: 'New Tropical Studio' }
    ]
  }
};
