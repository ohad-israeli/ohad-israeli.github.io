import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const projects = (await getCollection('projects', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  return rss({
    title: 'Ohad Israeli — projects',
    description: 'Projects in data streaming, Kafka, and distributed systems.',
    site: context.site ?? 'https://ohad-israeli.github.io',
    items: projects.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: `/projects/${p.id}/`,
      categories: p.data.tags,
    })),
  });
}
