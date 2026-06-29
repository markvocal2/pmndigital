import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicArticles, getPublicSettings } from '@/lib/cms';

export const revalidate = 60;
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
  const [{ items }, settings] = await Promise.all([getPublicArticles('limit=24'), getPublicSettings()]);
  const name = settings?.siteName || 'PMN Digital';
  const logo = settings?.logoDarkUrl || '/assets/logo-white.png';
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `บทความ · ${name}`,
    url: `${SITE}/blog`,
    publisher: { '@type': 'Organization', name },
    blogPost: items.slice(0, 12).map((a) => ({ '@type': 'BlogPosting', headline: a.title, url: `${SITE}/blog/${encodeURIComponent(a.slug)}`, datePublished: a.publishedAt || undefined })),
  };
  return (
    <div style={{ minHeight: '100vh', background: '#05070E', color: '#EAEEF6', fontFamily: "'IBM Plex Sans','IBM Plex Sans Thai',sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Link href="/"><img src={logo} alt={name} style={{ height: 28, width: 'auto' }} /></Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-blue-200">← กลับหน้าหลัก</Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#9FC0FF]">Articles</div>
          <h1 className="text-4xl font-bold tracking-tight">บทความ &amp; ความรู้</h1>
          <p className="mt-3 max-w-2xl text-[#A7B0C4]">อัปเดตแนวคิด เทคนิค และกรณีศึกษาด้านระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์เฉพาะทาง</p>
        </div>
        {items.length === 0 ? (
          <p className="text-slate-500">ยังไม่มีบทความเผยแพร่</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <Link key={a.id} href={`/blog/${a.slug}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] transition hover:-translate-y-1 hover:border-blue-400/40">
                <div className="aspect-[16/10] overflow-hidden bg-[#0b1020]">
                  {a.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.coverImageUrl} alt={a.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center font-mono text-xs text-slate-600">PMN · Article</div>
                  )}
                </div>
                <div className="p-5">
                  {a.tags?.[0] && <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#7FB0FF]">{a.tags[0]}</div>}
                  <h2 className="mb-2 text-lg font-semibold leading-snug">{a.title}</h2>
                  {a.excerpt && <p className="line-clamp-3 text-sm text-[#8B95AC]">{a.excerpt}</p>}
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    {a.publishedAt && <span>{new Date(a.publishedAt).toLocaleDateString('th-TH')}</span>}
                    <span>· อ่าน {a.readingMins} นาที</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
