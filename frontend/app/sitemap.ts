import type { MetadataRoute } from 'next';
import { getAllArticles } from '@/lib/site/data';

const SITE = 'https://pmndigital.co';
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await getAllArticles('latest');
  const articles: MetadataRoute.Sitemap = items
    .filter((a) => !a.noindex)
    .map((a) => ({
      url: `${SITE}/blog/${encodeURIComponent(a.slug)}`,
      lastModified: a.updatedAt ? new Date(a.updatedAt) : undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  const page = (path: string, priority: number, changeFrequency: 'weekly' | 'monthly' = 'monthly') => ({
    url: `${SITE}${path}`,
    changeFrequency,
    priority,
  });
  return [
    page('', 1, 'weekly'),
    page('/services', 0.9),
    page('/portfolio', 0.8),
    page('/pricing', 0.8),
    page('/contact', 0.7),
    page('/blog', 0.8, 'weekly'),
    page('/status', 0.3, 'weekly'),
    ...articles,
  ];
}
