/* Pages projet détaillées : une entrée par client, clé = titre du projet en minuscules.
   Les blocs s'affichent dans l'ordre. Types : gallery, system, logo, menus, palette, type.
   Les tracés vectoriels (logotypes, sceaux, glyphes) sont dans assets/cases/<client>/vectors.js. */
window.CASES = {
  'jacqueline': {
    title: 'Jacqueline',
    cover: { src: 'assets/cases/jacqueline/cover.webp', w: 1800, h: 1200 },
    place: { fr: 'Table gastronomique, Paris 9e', en: 'Fine dining, Paris 9th', es: 'Alta cocina, París 9', it: 'Alta cucina, Parigi 9' },
    intro: {
      fr: 'Le chef Gustave Migdal ouvre sa table dans le 9e. Nous avons dessiné toute la maison : un logotype en Cirka qui se lit à plat comme en colonne, un monogramme où le J enlace le Q, un bordeaux profond, le cuir des arts de la table, et le décor, imaginé avec Pierre Gonalons.',
      en: 'Chef Gustave Migdal opens his table in the 9th. We designed the whole house: a Cirka logotype that reads flat or in a column, a monogram where the J embraces the Q, a deep burgundy, leather for the tableware, and the interiors, imagined with Pierre Gonalons.',
      es: 'El chef Gustave Migdal abre su mesa en el distrito 9. Diseñamos toda la casa: un logotipo en Cirka que se lee en línea o en columna, un monograma donde la J abraza la Q, un burdeos profundo, el cuero de la mesa y la decoración, imaginada con Pierre Gonalons.',
      it: 'Lo chef Gustave Migdal apre la sua tavola nel 9°. Abbiamo disegnato tutta la casa: un logotipo in Cirka che si legge in riga o in colonna, un monogramma in cui la J abbraccia la Q, un bordeaux profondo, il cuoio della tavola e la decorazione, immaginata con Pierre Gonalons.'
    },
    facts: [
      ['client', 'Jacqueline'],
      ['chef', 'Gustave Migdal'],
      ['place', 'Paris 9e'],
      ['missions', { fr: 'Identité, direction artistique, décoration, arts de la table, photographie, print', en: 'Identity, art direction, interiors, tableware, photography, print', es: 'Identidad, dirección artística, decoración, mesa, fotografía, print', it: 'Identità, direzione artistica, decorazione, tavola, fotografia, print' }],
      ['decor', { fr: 'Avec Pierre Gonalons', en: 'With Pierre Gonalons', es: 'Con Pierre Gonalons', it: 'Con Pierre Gonalons' }],
      ['typeface', 'Cirka, Afacad Flux']
    ],
    blocks: [
      { type: 'collab', label: 'decor', bg: '#2a221f', with: 'Pierre Gonalons',
        title: { fr: 'Décoration', en: 'Interiors', es: 'Decoración', it: 'Decorazione' },
        text: { fr: 'Un projet mené à deux, du plafond de globes au marbre des tables.', en: 'A project led together, from the ceiling of globes to the marble tables.', es: 'Un proyecto a cuatro manos, del techo de globos al mármol de las mesas.', it: 'Un progetto a quattro mani, dal soffitto di globi al marmo dei tavoli.' },
        statement: { fr: 'Banquettes de velours rose, marbres veinés, une pluie de globes de verre : la salle a été pensée avec l’architecte d’intérieur Pierre Gonalons, comme une suite du monogramme.', en: 'Pink velvet banquettes, veined marbles, a rain of glass globes: the room was conceived with interior architect Pierre Gonalons, as an extension of the monogram.', es: 'Banquetas de terciopelo rosa, mármoles veteados, una lluvia de globos de cristal: la sala se pensó con el interiorista Pierre Gonalons, como una prolongación del monograma.', it: 'Banquette di velluto rosa, marmi venati, una pioggia di globi di vetro: la sala è stata pensata con l’architetto d’interni Pierre Gonalons, come un prolungamento del monogramma.' },
        rows: [
          [{ src: 'assets/cases/jacqueline/salle.webp', w: 1200, h: 1800 }, { src: 'assets/cases/jacqueline/plafond.webp', w: 1200, h: 1800 }],
          [{ src: 'assets/cases/jacqueline/banquette.webp', w: 1800, h: 917 }],
          [{ src: 'assets/cases/jacqueline/table.webp', w: 1200, h: 1800 }, { src: 'assets/cases/jacqueline/angle.webp', w: 1200, h: 1800 }],
          [{ src: 'assets/cases/jacqueline/devanture.webp', w: 1200, h: 1800 }, { src: 'assets/cases/jacqueline/enseigne.webp', w: 1200, h: 1800 }]
        ] },
      { type: 'jlogo', label: 'logo', bg: '#efe8dc', ink: '#62241f', color: '#62241f',
        title: { fr: 'Construction du logotype', en: 'Building the logotype', es: 'Construcción del logotipo', it: 'Costruzione del logotipo' },
        steps: [
          { fr: 'Le logotype, en Cirka', en: 'The logotype, set in Cirka', es: 'El logotipo, en Cirka', it: 'Il logotipo, in Cirka' },
          { fr: 'La composition verticale, pour l’enseigne', en: 'The vertical composition, for the sign', es: 'La composición vertical, para el rótulo', it: 'La composizione verticale, per l’insegna' },
          { fr: 'Le monogramme : le J enlace le Q', en: 'The monogram: the J embraces the Q', es: 'El monograma: la J abraza la Q', it: 'Il monogramma: la J abbraccia la Q' }
        ] },
      { type: 'jsys', label: 'system', bg: '#ffffff',
        text: { fr: 'Quatre couleurs pour le logotype, un monogramme pour signer, des colonnes de lettres pour les murs et les portes.', en: 'Four colourways for the logotype, a monogram to sign, columns of letters for walls and doors.', es: 'Cuatro colores para el logotipo, un monograma para firmar, columnas de letras para muros y puertas.', it: 'Quattro colori per il logotipo, un monogramma per firmare, colonne di lettere per muri e porte.' },
        plates: {
          wordmark: { fr: 'Logotype, quatre déclinaisons', en: 'Logotype, four colourways', es: 'Logotipo, cuatro versiones', it: 'Logotipo, quattro declinazioni' },
          mono: { fr: 'Monogramme', en: 'Monogram', es: 'Monograma', it: 'Monogramma' },
          stacks: { fr: 'Compositions verticales', en: 'Vertical compositions', es: 'Composiciones verticales', it: 'Composizioni verticali' }
        } },
      { type: 'gallery', label: 'mood', bg: '#f4efe6',
        title: { fr: 'En cuisine', en: 'In the kitchen', es: 'En la cocina', it: 'In cucina' },
        text: { fr: 'La cuisine de Gustave Migdal, photographiée par le studio pour l’ouverture.', en: 'Gustave Migdal’s cooking, photographed by the studio for the opening.', es: 'La cocina de Gustave Migdal, fotografiada por el estudio para la apertura.', it: 'La cucina di Gustave Migdal, fotografata dallo studio per l’apertura.' },
        rows: [
          [{ src: 'assets/cases/jacqueline/verse.webp', w: 1200, h: 1800 }, { src: 'assets/cases/jacqueline/vert.webp', w: 1200, h: 1800 }],
          [{ src: 'assets/cases/jacqueline/plat.webp', w: 1800, h: 1509 }],
          [{ src: 'assets/cases/jacqueline/boeuf.webp', w: 1293, h: 1800 }, { src: 'assets/cases/jacqueline/tomate.webp', w: 1305, h: 1800 }],
          [{ src: 'assets/cases/jacqueline/chef.webp', w: 1301, h: 1800 }],
          [{ src: 'assets/cases/jacqueline/ecume.webp', w: 1133, h: 1800 }, { src: 'assets/cases/jacqueline/dressage.webp', w: 1200, h: 1800 }],
          [{ src: 'assets/cases/jacqueline/choco.webp', w: 1731, h: 1800 }],
          [{ src: 'assets/cases/jacqueline/huitre.webp', w: 1383, h: 1800 }, { src: 'assets/cases/jacqueline/rouge.webp', w: 1207, h: 1800 }]
        ] },
      { type: 'gallery', label: 'print', bg: '#62241f', ink: '#efe2d6',
        title: { fr: 'Arts de la table et print', en: 'Tableware and print', es: 'Mesa y print', it: 'Tavola e print' },
        text: { fr: 'Porte-menus et sous-verres en cuir frappé du monogramme, carte sur plateau ondulé.', en: 'Menu covers and coasters in leather stamped with the monogram, the menu on a wavy tray.', es: 'Portamenús y posavasos de cuero con el monograma grabado, la carta sobre bandeja ondulada.', it: 'Portamenù e sottobicchieri in cuoio impressi col monogramma, il menu su vassoio ondulato.' },
        rows: [
          [{ src: 'assets/cases/jacqueline/cuir.webp', w: 1200, h: 1800 }, { src: 'assets/cases/jacqueline/cuir2.webp', w: 1200, h: 1800 }],
          [{ src: 'assets/cases/jacqueline/sous-main.webp', w: 1800, h: 1200 }],
          [{ src: 'assets/projects/p12.webp', w: 710, h: 960 }, { src: 'assets/cases/jacqueline/coaster.webp', w: 1200, h: 1800 }],
          [{ src: 'assets/cases/jacqueline/cuir3.webp', w: 1200, h: 1800 }, { src: 'assets/cases/jacqueline/cuir4.webp', w: 1200, h: 1800 }]
        ] },
      { type: 'palette', label: 'palette', bg: '#ffffff', even: true,
        text: { fr: 'Le bordeaux signe, le lin et le laiton éclairent.', en: 'Burgundy signs, linen and brass bring the light.', es: 'El burdeos firma, el lino y el latón iluminan.', it: 'Il bordeaux firma, il lino e l’ottone illuminano.' },
        colors: [
          { name: 'Bordeaux', hex: '#62241F', use: 'signature', share: 22 },
          { name: 'Vieux rose', hex: '#BA968A', use: 'warm', share: 16 },
          { name: 'Lin', hex: '#D7CEB9', use: 'base', share: 22 },
          { name: 'Laiton', hex: '#B09164', use: 'accent', share: 14 },
          { name: 'Brun', hex: '#2A221F', use: 'text', share: 14 },
          { name: 'Noir', hex: '#000000', use: 'deep', share: 12 }
        ] },
      { type: 'jtype', label: 'type', bg: '#ffffff',
        text: { fr: 'Une capitale fine et cambrée pour la signature, une linéale souple pour lire.', en: 'A fine, arched capital for the signature, a supple sans for reading.', es: 'Una capital fina y arqueada para la firma, una palo seco flexible para leer.', it: 'Una capitale sottile e arcuata per la firma, un bastoni morbido per leggere.' },
        primary: { fr: 'Typographie principale', en: 'Primary typeface', es: 'Tipografía principal', it: 'Tipografia principale' },
        secondary: { fr: 'Typographie secondaire', en: 'Secondary typeface', es: 'Tipografía secundaria', it: 'Tipografia secondaria' } }
    ]
  },
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
        [{ src: 'assets/projects/p17.webp', w: 619, h: 1100 }, { src: 'assets/projects/p03.webp', w: 880, h: 1100 }]
      ] },
      { type: 'logo', label: 'logo', src: 'assets/cases/agata/logo.svg', bg: '#ede3bf', ink: '#1b374f', color: '#c1413a' },
      { type: 'system', label: 'system', bg: '#ffffff', photos: {
        fleur: { src: 'assets/cases/agata/fleur-photo.webp', w: 1049, h: 1200 },
        coupe: { src: 'assets/cases/agata/coupe-photo.webp', w: 1400, h: 1212 }
      }, rows: [
        [{ src: 'assets/cases/agata/signes.webp', w: 1800, h: 991 }],
        [{ src: 'assets/cases/agata/enseigne.webp', w: 746, h: 851 }, { src: 'assets/cases/agata/pivoine.webp', w: 1800, h: 995 }]
      ] },
      { type: 'menus', label: 'menus', bg: '#1b374f', items: [{ src: 'assets/cases/agata/menu-fr.webp', w: 732, h: 1500 }, { src: 'assets/cases/agata/menu-en.webp', w: 732, h: 1500 }] },
      { type: 'gallery', label: 'print', bg: '#ffffff', rows: [
        [{ src: 'assets/cases/agata/print.webp', w: 2000, h: 851 }],
        [{ src: 'assets/cases/agata/date.webp', w: 513, h: 900 }, { src: 'assets/cases/agata/book.webp', w: 1048, h: 1400 }],
        [{ src: 'assets/cases/agata/tote.webp', w: 1733, h: 1080 }, { src: 'assets/cases/agata/facade.webp', w: 1800, h: 1000 }]
      ] },
      { type: 'palette', label: 'palette', bg: '#ffffff', colors: [
        { name: 'Lemon Meringue', hex: '#EDE3BF', use: 'base', share: 40 },
        { name: 'Sicilian Maxi. G/Yellow', hex: '#D8DF7F', use: 'light', share: 12 },
        { name: 'Parisian Red', hex: '#C1413A', use: 'signature', share: 22 },
        { name: 'Indigo', hex: '#1B374F', use: 'text', share: 16 },
        { name: 'Terracotta', hex: '#C0644E', use: 'warm', share: 10 }
      ] },
      { type: 'type', label: 'type', bg: '#ffffff', photo: { src: 'assets/cases/agata/typo-photo.webp', w: 710, h: 1061 }, credit: 'New Tropical Studio' }
    ]
  }
};
