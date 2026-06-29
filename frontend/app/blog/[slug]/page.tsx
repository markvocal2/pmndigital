import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicArticle, getPublicCategories, getRelatedArticles, getPublicSettings } from '@/lib/cms';
import { renderMarkdown, plainText } from '@/lib/md';
import { Comments } from '@/components/blog/Comments';

export const revalidate = 60;
const SITE = 'https://pmndigital.co';
const abs = (u?: string | null) => (!u ? undefined : u.startsWith('http') ? u : SITE + u);
const fmtFull = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
const fmtShort = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '';

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
  const [art, settings, categories, related] = await Promise.all([
    getPublicArticle(slug),
    getPublicSettings(),
    getPublicCategories(),
    getRelatedArticles(slug, 3),
  ]);
  if (!art) notFound();
  const name = settings?.siteName || 'PMN Digital';
  const logo = settings?.logoDarkUrl || '/assets/logo-white.png';
  const url = `${SITE}/blog/${encodeURIComponent(art.slug)}`;
  const html = renderMarkdown(art.bodyMarkdown);
  const catName = categories.find((c) => c.id === art.categoryId)?.name;

  const share = {
    line: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
    fb: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(art.title)}`,
  };

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

  const ShareLink = ({ href, label }: { href: string; label: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-xs text-slate-300 transition hover:border-blue-400/40 hover:text-white">
      {label}
    </a>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#05070E', color: '#EAEEF6', fontFamily: "'IBM Plex Sans','IBM Plex Sans Thai',sans-serif" }}>
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />
      ))}

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#05070E]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Link href="/"><img src={logo} alt={name} style={{ height: 26, width: 'auto' }} /></Link>
          <Link href="/blog" className="text-sm text-slate-400 hover:text-blue-200">← บทความทั้งหมด</Link>
        </div>
      </header>

      {/* HERO */}
      {art.coverImageUrl ? (
        <div className="relative h-[46vh] min-h-[340px] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={art.coverImageUrl} alt={art.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070E] via-[#05070E]/75 to-[#05070E]/25" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-[820px] px-6 pb-9">
              {catName && <div className="mb-3 inline-block rounded-full bg-blue-500/25 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-blue-100 ring-1 ring-blue-400/30">{catName}</div>}
              <h1 className="text-3xl font-bold leading-[1.12] tracking-tight sm:text-[44px]">{art.title}</h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden border-b border-white/[0.06] py-16">
          <div className="pointer-events-none absolute -top-32 left-1/2 h-[460px] w-[760px] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(circle,rgba(37,99,235,.28),transparent 65%)', filter: 'blur(40px)' }} />
          <div className="relative mx-auto max-w-[820px] px-6">
            {catName && <div className="mb-3 inline-block rounded-full bg-blue-500/20 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-blue-100 ring-1 ring-blue-400/30">{catName}</div>}
            <h1 className="text-3xl font-bold leading-[1.12] tracking-tight sm:text-[46px]">{art.title}</h1>
          </div>
        </div>
      )}

      {/* meta + deck */}
      <div className="mx-auto max-w-[720px] px-6 pt-8">
        {art.excerpt && <p className="mb-6 text-lg leading-relaxed text-[#AEB8CC] sm:text-xl">{art.excerpt}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-white/10 py-4 font-mono text-[12.5px] text-slate-400">
          <span className="font-semibold text-slate-200">{name}</span>
          {art.publishedAt && <span>{fmtFull(art.publishedAt)}</span>}
          <span>อ่าน {art.readingMins} นาที</span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
            {art.viewCount.toLocaleString()} วิว
          </span>
          <span className="ml-auto flex items-center gap-2">
            <span className="text-slate-500">แชร์:</span>
            <ShareLink href={share.line} label="LINE" />
            <ShareLink href={share.fb} label="Facebook" />
            <ShareLink href={share.x} label="X" />
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-[720px] px-6 pt-8">
        {art.takeaways.length > 0 && (
          <aside className="mb-8 rounded-2xl border border-blue-400/25 bg-blue-500/[0.06] p-5">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#7FD7FF]">ประเด็นสำคัญ · Key takeaways</div>
            <ul className="space-y-1.5">
              {art.takeaways.map((t, i) => (
                <li key={i} className="flex gap-2 text-[15px] text-[#C7D0E0]"><span className="text-[#60A5FA]">✓</span>{t}</li>
              ))}
            </ul>
          </aside>
        )}

        <article
          className="text-[17px] leading-[1.92] text-[#CBD3E1] [&_a]:text-blue-300 [&_a]:underline [&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-400/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-400 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[14px] [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-[26px] [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-white [&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-100 [&_li]:ml-5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_p]:mb-5 [&_pre]:my-5 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-black/40 [&_pre]:p-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-1.5"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {art.tags.length > 0 && (
          <div className="mt-9 flex flex-wrap gap-2">
            {art.tags.map((t) => (
              <span key={t} className="rounded-full bg-white/[0.06] px-3 py-1 font-mono text-[11.5px] text-[#9FC0FF]">#{t}</span>
            ))}
          </div>
        )}

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

        <div className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/[0.12] to-transparent p-6 text-center">
          <p className="mb-3 text-[#C7D0E0]">สนใจวางระบบให้ธุรกิจของคุณ?</p>
          <Link href="/" className="inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500">ปรึกษาทีม {name} ฟรี →</Link>
        </div>
      </main>

      {/* related */}
      {related.length > 0 && (
        <section className="mx-auto mt-14 max-w-6xl px-6">
          <div className="mb-6 border-t border-white/10 pt-8">
            <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#9FC0FF]">Related</div>
            <h2 className="text-2xl font-bold">บทความที่เกี่ยวข้อง</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} href={`/blog/${encodeURIComponent(r.slug)}`} className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] transition hover:-translate-y-1 hover:border-blue-400/40">
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#10203f] to-[#0a1426]">
                  {r.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.coverImageUrl} alt={r.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full place-items-center font-mono text-3xl font-bold text-blue-400/30">{r.title.slice(0, 1)}</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">{r.title}</h3>
                  <div className="mt-auto flex items-center gap-3 font-mono text-[11px] text-slate-500">
                    {r.publishedAt && <span>{fmtShort(r.publishedAt)}</span>}
                    <span className="ml-auto inline-flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
                      {r.viewCount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Comments slug={art.slug} />
      <div className="h-20" />
    </div>
  );
}
