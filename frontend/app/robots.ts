import type { MetadataRoute } from 'next';

const SITE = 'https://pmndigital.co';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/profile', '/login', '/register'] },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
