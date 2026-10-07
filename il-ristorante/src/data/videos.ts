// Série vidéo tournée en Émilie-Romagne chez nos producteurs (format vertical 9:16).
// Fichiers : public/videos/<slug>-1080.mp4, -720.mp4, -poster.webp
export type Video = { slug: string; title: string; kicker: string; duration: number };

export const videos: Record<string, Video> = {
  teasing: { slug: '01-ambiance-teasing', kicker: 'Le voyage', title: 'Cap sur l’Émilie-Romagne', duration: 13 },
  parmesanQuestion: { slug: '02-question-producteur-parmesan', kicker: 'Parmigiano Reggiano', title: 'Pourquoi il est unique, par son producteur', duration: 45 },
  jambonFabrication: { slug: '03-jambon-de-parme-fabrication', kicker: 'Prosciutto di Parma', title: 'Du séchoir à la couronne ducale', duration: 20 },
  service: { slug: '04-service-qualite', kicker: 'À table', title: 'Raviolis, gnocco fritto et spritz', duration: 19 },
  parmesanFabrication: { slug: '05b-parmesan-fabrication-edit', kicker: 'Parmigiano Reggiano', title: 'De l’étable à vos tagliatelles', duration: 34 },
  conclusion: { slug: '06-conclusion', kicker: 'Grazie', title: 'Parme, ses places et ses collines', duration: 35 },
  jambonQuestion: { slug: '07-producteur-jambon-question-1', kicker: 'Prosciutto di Parma', title: 'Romeo, producteur de jambon de Parme', duration: 30 },
};

export const series = [videos.teasing, videos.parmesanFabrication, videos.parmesanQuestion, videos.jambonFabrication, videos.jambonQuestion, videos.service, videos.conclusion];
export const src = (v: Video, q: '1080' | '720') => `/videos/${v.slug}-${q}.mp4`;
export const poster = (v: Video) => `/videos/${v.slug}-poster.webp`;
