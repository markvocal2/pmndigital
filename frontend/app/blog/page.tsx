import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicArticles, getPublicCategories, getPublicSettings } from '@/lib/cms';
import { BlogList } from '@/components/blog/BlogList';

// force-dynamic so the article list is fetched at request time (backend is up) — avoids the
// build-time SSG fetch (backend unreachable during CI) producing an empty initial page.
export const dynamic = 'force-dynamic';
const SITE = 'https://pmndigital.co';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings();
  const name = s?.siteName || 'PMN Digital';
  return {
    title: 'บทความ',
    description: `บทความและความรู้ด้านระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์ จาก ${name}`,
    alternates: { canonical: `${SITE}/blog` },
    openGraph: { title: `บทความ · ${name}`, url: `${SITE}/blog`, type: 'website' },
  };
}

export default async function BlogIndex() {
  const [{ items, total }, categories, settings] = await Promise.all([
    getPublicArticles('limit=20&sort=latest'),
    getPublicCategories(),
    getPublicSettings(),
  ]);
  const name = settings?.siteName || 'PMN Digital';
  const logo = settings?.logoDarkUrl || '/assets/logo-white.png';
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `บทความ · ${name}`,
    url: `${SITE}/blog`,
    publisher: { '@type': 'Organization', name },
    blogPost: items.slice(0, 12).map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE}/blog/${encodeURIComponent(a.slug)}`,
      datePublished: a.publishedAt || undefined,
    })),
  };
  return (
    <div style={{ minHeight: '100vh', background: '#05070E', color: '#EAEEF6', fontFamily: "'IBM Plex Sans','IBM Plex Sans Thai',sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Link href="/"><img src={logo} alt={name} style={{ height: settings?.logoHeight || 28, width: 'auto' }} /></Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-blue-200">← กลับหน้าหลัก</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#9FC0FF]">Articles</div>
          <h1 className="text-4xl font-bold tracking-tight">บทความ &amp; ความรู้</h1>
          <p className="mt-3 max-w-2xl text-[#A7B0C4]">อัปเดตแนวคิด เทคนิค และกรณีศึกษาด้านระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์เฉพาะทาง</p>
        </div>
        <BlogList initial={items} total={total} categories={categories} />
      </main>
    </div>
  );
}
