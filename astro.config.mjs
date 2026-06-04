// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// User site served at the domain root (https://ohad-israeli.github.io).
export default defineConfig({
  site: 'https://ohad-israeli.github.io',
  integrations: [mdx(), sitemap()],
  markdown: {
    // Dark Shiki theme to match the dev-focused design.
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
