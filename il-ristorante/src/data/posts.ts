// Articles du blog. Ton : charte rédactionnelle 2026 (concret, sensoriel, vouvoiement).
export type Post = { slug: string; cat: string; time: string; title: string; img: string; alt: string; lead: string; body: string[] };

export const posts: Post[] = [
  {
    slug: 'citron-de-sicile',
    cat: 'Produit', time: '4 min',
    title: 'Le citron de Sicile, du zeste au limoncello',
    img: '/img/lemons.webp', alt: 'Citrons coupés en deux',
    lead: 'Une peau épaisse, très parfumée, et un jus moins acide qu’on ne le croit. En Sicile, le citron se mange presque entier.',
    body: [
      'Autour de Syracuse, les citronniers donnent plusieurs récoltes par an. Le Limone di Siracusa est protégé par une IGP : sa peau, riche en huiles essentielles, parfume tout ce qu’elle touche.',
      'C’est cette peau qu’on utilise pour le limoncello. On prélève le zeste sans le blanc, trop amer, puis on le laisse macérer dans l’alcool plusieurs jours avant d’ajouter un sirop de sucre. Il se boit très frais, en fin de repas.',
      'En cuisine, un zeste râpé à la dernière minute réveille des pâtes au beurre, un poisson grillé ou une burrata. Une ou deux touches suffisent.',
    ],
  },
  {
    slug: 'bruschetta',
    cat: 'Recette', time: '3 min',
    title: 'La bruschetta, une affaire de pain grillé',
    img: '/img/bruschetta.webp', alt: 'Bruschetta tomate basilic',
    lead: 'Le mot vient de « bruscare », griller. Avant la tomate, il y a donc le pain.',
    body: [
      'Un pain de campagne à la mie dense, tranché épais, grillé jusqu’à ce qu’il croustille. On le frotte encore chaud avec une gousse d’ail coupée en deux : la croûte râpe l’ail comme une râpe fine.',
      'Puis un filet d’huile d’olive, une pincée de sel. La version la plus connue ajoute des tomates bien mûres coupées en dés et quelques feuilles de basilic, au dernier moment pour que le pain reste croustillant.',
      'À poser au milieu de la table, avec l’aperitivo. On vous garde une place ?',
    ],
  },
  {
    slug: 'gelato',
    cat: 'Dolci', time: '3 min',
    title: 'Gelato : pourquoi il est plus dense',
    img: '/img/gelato.webp', alt: 'Vitrine de glaces artisanales',
    lead: 'Moins d’air, moins de froid, souvent moins de matière grasse : trois raisons pour un goût plus franc.',
    body: [
      'Le gelato est turbiné plus lentement qu’une glace industrielle. Il incorpore donc moins d’air, et sa texture est plus dense, presque soyeuse.',
      'Il est aussi servi moins froid. À quelques degrés de plus, la langue ne s’engourdit pas et les arômes se libèrent mieux : la pistache sent la pistache.',
      'Enfin, une base plus riche en lait qu’en crème laisse davantage de place au parfum. Pistache, stracciatella, fior di latte : à vous de choisir.',
    ],
  },
  {
    slug: 'pate-a-pizza',
    cat: 'Gestes', time: '5 min',
    title: 'Étaler une pâte à pizza, sans rouleau',
    img: '/img/dough.webp', alt: 'Pâte à pizza étalée à la main',
    lead: 'Au rouleau, on écrase les bulles. À la main, on les pousse vers le bord. C’est tout le secret du cornicione.',
    body: [
      'La pâte a levé lentement : elle est pleine de petites bulles de gaz. Du bout des doigts, on appuie au centre et on chasse l’air vers l’extérieur, sans toucher le dernier centimètre.',
      'Ce bord préservé, le cornicione, gonfle au four et devient croustillant dehors, alvéolé dedans. On retourne la pâte, on l’étire doucement sur le dos des mains, et on garnit vite.',
      'Un rouleau donnerait une pâte plate et régulière, mais sans relief. Ici, on préfère le geste.',
    ],
  },
  {
    slug: 'etiquette-vin-italien',
    cat: 'Cave', time: '4 min',
    title: 'Du Piémont aux Pouilles, lire une étiquette',
    img: '/img/wine.webp', alt: 'Bouteilles de vin italien',
    lead: 'DOCG, DOC, IGT : trois sigles qui disent d’où vient le vin et comment il a été fait.',
    body: [
      'DOCG, c’est le niveau le plus encadré : zone, cépages, rendements et élevage sont contrôlés, et le vin est dégusté avant d’obtenir l’appellation. Le Barolo ou le Chianti Classico en font partie.',
      'DOC suit des règles proches, sur une zone définie. IGT laisse plus de liberté au vigneron sur les cépages et les assemblages : certains grands vins toscans ont choisi cette mention.',
      'Deux mots à repérer aussi : « Classico », la zone historique d’une appellation, et « Riserva », un vin élevé plus longtemps avant sa sortie.',
    ],
  },
  {
    slug: 'parmigiano-reggiano-36-mois',
    cat: 'Produit', time: '4 min',
    title: 'Parmigiano Reggiano : pourquoi 36 mois',
    img: '/img/parmesan.webp', alt: 'Meules de Parmigiano Reggiano en affinage',
    lead: 'Douze mois au minimum pour avoir droit au nom. Chez nous, on attend trois fois plus.',
    body: [
      'Une meule de Parmigiano Reggiano ne peut pas sortir de cave avant douze mois. À 24 mois, elle est déjà équilibrée. À 36 mois, elle change de caractère.',
      'La pâte devient plus sèche et plus friable. On y croque de petits cristaux blancs, signe d’un long affinage. Le goût est plus intense, avec des notes de fruits secs et d’épices.',
      'C’est ce parmesan que l’on râpe sur vos pâtes, à la dernière minute, pour qu’il garde tout son parfum.',
    ],
  },
];
