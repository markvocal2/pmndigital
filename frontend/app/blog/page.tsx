import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicArticles, getPublicCategories, getPublicSettings } from '@/lib/cms';
import { ArticleRow } from '@/components/blog/ArticleRow';
import { BlogHero } from '@/components/blog/BlogHero';

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
  const [latest, popular, categories, settings] = await Promise.all([
    getPublicArticles('limit=20&sort=latest'),
    getPublicArticles('limit=12&sort=views'),
    getPublicCategories(),
    getPublicSettings(),
  ]);
  const items = latest.items;

  // One row per category, fetched in parallel; empty ones are dropped rather than
  // rendered as a bare heading.
  const catRows = (
    await Promise.all(
      categories.map(async (c) => ({
        key: c.slug,
        name: c.name,
        items: (await getPublicArticles(`limit=12&sort=latest&category=${encodeURIComponent(c.slug)}`)).items,
      })),
    )
  ).filter((r) => r.items.length > 0);

  const name = settings?.siteName || 'PMN Digital';
  const logo = settings?.logoDarkUrl || '/assets/logo-white.png';
  const hasHero = items.length > 0;
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
      {/* The hero runs up behind the header so the two read as one panel, Netflix-style: no
          seam, just a soft top-down scrim keeping the logo and link legible over the art.
          With no articles there is no hero to sit on, so it falls back to the bordered bar. */}
      <div className={hasHero ? 'relative' : undefined}>
        <header
          className={
            hasHero
              ? 'absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-[#05070E]/92 via-[#05070E]/45 to-transparent'
              : 'border-b border-white/10'
          }
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Link href="/"><img src={logo} alt={name} style={{ height: settings?.logoHeight || 28, width: 'auto' }} /></Link>
            <Link
              href="/"
              className={`text-sm hover:text-blue-200 ${hasHero ? 'text-slate-200/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]' : 'text-slate-400'}`}
            >
              ← กลับหน้าหลัก
            </Link>
          </div>
        </header>

        {hasHero && <BlogHero items={items} categories={categories} />}
      </div>

      <main id="articles" className="mx-auto max-w-6xl px-6 py-12 md:py-14">
        <div className="mb-8">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#9FC0FF]">Articles</div>
          <h1 className="text-4xl font-bold tracking-tight">บทความ &amp; ความรู้</h1>
          <p className="mt-3 max-w-2xl text-[#A7B0C4]">อัปเดตแนวคิด เทคนิค และกรณีศึกษาด้านระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์เฉพาะทาง</p>
        </div>

        {items.length === 0 ? (
          <p className="py-16 text-center text-slate-500">ยังไม่มีบทความ</p>
        ) : (
          <>
            <ArticleRow title="มาใหม่ล่าสุด" items={items} categories={categories} />
            {popular.items.length >= 3 && <ArticleRow title="ยอดนิยม" items={popular.items} categories={categories} />}
            {catRows.map((r) => (
              <ArticleRow key={r.key} title={r.name} items={r.items} categories={categories} />
            ))}
          </>
        )}
      </main>
    </div>
  );
}