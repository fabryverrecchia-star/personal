// Toutes les infos de marque / contenu global au même endroit.
export const site = {
  name: 'Fabry Verrecchia',
  role: 'Designer & développeur créatif',
  location: 'France',
  timeZone: 'Europe/Paris',
  email: 'hello@example.com',
  description:
    'Portfolio de Fabry Verrecchia — design et développement d’expériences web sensibles, précises et mémorables.',
  // Les mots entre *astérisques* sont rendus en EB Garamond Italic.
  headline: 'Une esthétique *affinée*, une expérience *sans faille* — conçue avec retenue, construite avec rigueur.',
  intro:
    'J’imagine et je développe des interfaces où le mouvement, la précision et le toucher donnent du sens au contenu.',
  socials: [
    { label: 'Instagram', href: 'https://instagram.com/' },
    { label: 'LinkedIn', href: 'https://linkedin.com/' },
    { label: 'GitHub', href: 'https://github.com/' },
  ],
  nav: [
    { label: 'Projets', href: '/' },
    { label: 'À propos', href: '/about' },
  ],
} as const;
