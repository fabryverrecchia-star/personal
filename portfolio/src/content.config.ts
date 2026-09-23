import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      client: z.string(),
      year: z.number(),
      category: z.string(),
      role: z.array(z.string()).default([]),
      url: z.url().optional(),
      order: z.number().default(0),
      // Image de couverture optionnelle ; sinon un aplat de couleur est affiché.
      cover: image().optional(),
      color: z.string().default('#c9c4b8'),
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects };
