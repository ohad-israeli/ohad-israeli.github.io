import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One article per project. Add a new project by dropping a .md/.mdx file in
// src/content/projects/ with the frontmatter below — it auto-appears in the
// home and /projects listings and gets its own page at /projects/<filename>.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      // Link to a dedicated supporting repo (code/docs/assets), when one exists.
      // Present -> the article shows a "View code" link; absent -> article-only.
      repo: z.string().url().optional(),
      // Optional live demo / deployed app.
      demo: z.string().url().optional(),
      status: z.enum(['wip', 'active', 'archived']).default('active'),
      cover: image().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects };
