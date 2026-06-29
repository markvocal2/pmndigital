import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicArticle, getPublicSettings } from '@/lib/cms';
import { renderMarkdown, plainText } from '@/lib/md';

export const revalidate = 60;
const SITE = 'https://pmndigital.co';
const abs = (u?: string | null) => (!u ? undefined : u.startsWith('http') ? u : SITE + u);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const art = await getPublicArticle(slug);
  if (!art) return { title: 'ไม่พบบทความ' };
  const title = art.metaTitle || art.title;
  const description = art.metaDesc || art.excerpt || plainText(art.bodyMarkdown);
  const img = abs(art.ogImageUrl || art.coverImageUrl);
  return {
    title,
    description,
    keywords: art.keyphrase ? [art.keyphrase, ...art.tags] : art.tags,
    alternates: { canonical: art.canonicalUrl || `${SITE}/blog/${encodeURIComponent(art.slug)}` },
    robots: art.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${SITE}/blog/${encodeURIComponent(art.slug)}`,
      images: img ? [img] : undefined,
      publishedTime: art.publishedAt || undefined,
      modifiedTime: art.updatedAt,
      tags: art.tags,
    },
    twitter: { card: 'summary_large_image', title, description, images: img ? [img] : undefined },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [art, settings] = await Promise.all([getPublicArticle(slug), getPublicSettings()]);
  if (!art) notFound();
  const name = settings?.siteName || 'PMN Digital';
  const logo = settings?.logoDarkUrl || '/assets/logo-white.png';
  const url = `${SITE}/blog/${encodeURIComponent(art.slug)}`;
  const html = renderMarkdown(art.bodyMarkdown);

  const ld: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': art.schemaType || 'Article',
      headline: art.title,
      description: art.metaDesc || art.excerpt || undefined,
      image: abs(art.coverImageUrl) ? [abs(art.coverImageUrl)] : undefined,
      datePublished: art.publishedAt || undefined,
      dateModified: art.updatedAt,
      author: { '@type': 'Organization', name },
      publisher: { '@type': 'Organization', name, logo: abs(settings?.logoDarkUrl) ? { '@type': 'ImageObject', url: abs(settings?.logoDarkUrl) } : undefined },
      mainEntityOfPage: url,
      keywords: art.keyphrase || (art.tags.length ? art.tags.join(', ') : undefined),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'หน้าแรก', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'บทความ', item: `${SITE}/blog` },
        { '@type': 'ListItem', position: 3, name: art.title, item: url },
      ],
    },
  ];
  if (art.faq && art.faq.length) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: art.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#05070E', color: '#EAEEF6', fontFamily: "'IBM Plex Sans','IBM Plex Sans Thai',sans-serif" }}>
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />
      ))}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Link href="/"><img src={logo} alt={name} style={{ height: 28, width: 'auto' }} /></Link>
          <Link href="/blog" className="text-sm text-slate-400 hover:text-blue-200">← บทความทั้งหมด</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <nav className="mb-4 text-xs text-slate-500"><Link href="/" className="hover:text-blue-200">หน้าแรก</Link> / <Link href="/blog" className="hover:text-blue-200">บทความ</Link></nav>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{art.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {art.publishedAt && <span>{new Date(art.publishedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
          <span>· อ่าน {art.readingMins} นาที</span>
          {art.tags.map((t) => <span key={t} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[#9FC0FF]">{t}</span>)}
        </div>
        {art.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={art.coverImageUrl} alt={art.title} className="mt-6 w-full rounded-2xl border border-white/10 object-cover" />
        )}

        {art.takeaways.length > 0 && (
          <aside className="mt-8 rounded-2xl border border-blue-400/25 bg-blue-500/[0.06] p-5">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#7FD7FF]">ประเด็นสำคัญ · Key takeaways</div>
            <ul className="space-y-1.5">
              {art.takeaways.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#C7D0E0]"><span className="text-[#60A5FA]">✓</span>{t}</li>
              ))}
            </ul>
          </aside>
        )}

        <article
          className="mt-8 text-[15.5px] leading-[1.85] text-[#C7D0E0] [&_a]:text-blue-300 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-blue-400/40 [&_blockquote]:pl-4 [&_blockquote]:text-slate-400 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-100 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-100 [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_p]:mb-4 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-black/40 [&_pre]:p-4 [&_ul]:list-disc [&_ul]:space-y-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {art.faq && art.faq.length > 0 && (
          <section className="mt-12 border-t border-white/10 pt-8">
            <h2 className="mb-5 text-xl font-bold">คำถามที่พบบ่อย</h2>
            <div className="space-y-3">
              {art.faq.map((f, i) => (
                <details key={i} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <summary className="cursor-pointer text-[15px] font-medium text-slate-100">{f.q}</summary>
                  <p className="mt-2 text-sm leading-relaxed text-[#A7B0C4]">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/[0.1] to-transparent p-6 text-center">
          <p className="mb-3 text-[#C7D0E0]">สนใจวางระบบให้ธุรกิจของคุณ?</p>
          <Link href="/" className="inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500">ปรึกษาทีม {name} ฟรี →</Link>
        </div>
      </main>
    </div>
  );
}
