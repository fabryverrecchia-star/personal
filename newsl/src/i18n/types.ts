export type Lang = 'fr' | 'en' | 'ru' | 'ar';

export const LANGS: Lang[] = ['fr', 'en', 'ru', 'ar'];
export const DEFAULT_LANG: Lang = 'fr';

export interface Experience {
  id: string;
  title: string;
  where: string;
  text: string;
  image: string;
}

export interface Act {
  title: string;
  image: string;
}

export interface Venue {
  name: string;
  mood: string;
  line: string;
}

export interface Dict {
  meta: { title: string; description: string; locale: string };
  langName: string;
  nav: { experiences: string; casting: string; maison: string; contact: string; menu: string; close: string };
  sound: { label: string; on: string; off: string };
  hero: { eyebrow: string; tagline: string; sub: string; scroll: string };
  manifesto: { label: string; text: string; words: string[] };
  experiences: { label: string; title: string; intro: string; items: Experience[]; drag: string };
  casting: { label: string; title: string; intro: string; acts: Act[] };
  venues: { label: string; title: string; intro: string; items: Venue[]; brands: string };
  method: { label: string; title: string; steps: { title: string; text: string }[] };
  contact: {
    label: string;
    title: string;
    intro: string;
    fields: {
      name: string;
      email: string;
      phone: string;
      date: string;
      place: string;
      guests: string;
      occasion: string;
      message: string;
    };
    occasions: string[];
    submit: string;
    note: string;
    sent: string;
    direct: string;
  };
  footer: { rights: string; legal: string; privacy: string; credits: string };
}
