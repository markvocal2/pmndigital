import type { MetadataRoute } from 'next';
import { getPublicArticles } from '@/lib/cms';

const SITE = 'https://pmndigital.co';
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { items } = await getPublicArticles('limit=500');
  const articles: MetadataRoute.Sitemap = items.map((a) => ({
    url: `${SITE}/blog/${a.slug}`,
    lastModified: a.updatedAt ? new Date(a.updatedAt) : undefined,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));
  return [
    { url: SITE, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    ...articles,
  ];
}
