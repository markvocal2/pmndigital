'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Article, ArticleCategory } from '@/lib/cms';
import { MediaImg } from '@/components/ui/Skeleton';

function fmtDate(s: string | null) {
  if (!s) return '';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function EyeViews({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {n.toLocaleString()}
    </span>
  );
}

/**
 * One card. Art fills it; the title/meta panel is revealed on hover — but only where
 * hovering exists (see .pmn-card-info in globals.css), so touch devices and narrow
 * screens keep the title visible at all times instead of showing a mystery thumbnail.
 */
function ArticleCard({ a, category }: { a: Article; category?: string }) {
  return (
    <Link
      href={`/blog/${encodeURIComponent(a.slug)}`}
      className="pmn-card group relative w-[74vw] flex-none snap-start overflow-hidden rounded-xl ring-1 ring-white/10 transition duration-300 hover:z-10 hover:ring-blue-400/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 sm:w-[46vw] md:w-[calc((100%-1.5rem)/3)] lg:w-[calc((100%-2.25rem)/4)] lg:hover:-translate-y-1"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[#10203f] to-[#0a1426]">
        {a.coverImageUrl ? (
          <MediaImg
            src={a.coverImageUrl}
            alt={a.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="grid h-full place-items-center font-mono text-3xl font-bold text-blue-400/30">{a.title.slice(0, 1)}</div>
        )}

        {category && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-wider text-blue-100 backdrop-blur">
            {category}
          </span>
        )}

        <div className="pmn-card-info absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/92 via-black/65 to-transparent px-3 pb-2.5 pt-8">
          <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-slate-50">{a.title}</h3>
          <div className="mt-1.5 flex items-center gap-3 font-mono text-[10.5px] text-slate-400">
            {a.publishedAt && <span>{fmtDate(a.publishedAt)}</span>}
            <span>{a.readingMins} นาที</span>
            <span className="ml-auto"><EyeViews n={a.viewCount} /></span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * A Netflix-style row: native horizontal scrolling (so touch flicks and shift+wheel work
 * for free, and it degrades to a plain scroller without JS) plus arrow buttons on desktop.
 * Snapping is mandatory on touch where flicks land between cards, and disabled from lg up
 * where the arrows drive it — mandatory snap fights programmatic smooth scrolling.
 */
export function ArticleRow({
  title,
  items,
  categories,
}: {
  title: string;
  items: Article[];
  categories: ArticleCategory[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    // Card widths are viewport-relative, so the overflow only settles after layout —
    // and changes again on resize.
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, items.length]);

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.9), behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  const arrow =
    'grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-base text-slate-200 transition hover:bg-white/[0.14] disabled:pointer-events-none disabled:opacity-25';

  return (
    <section className="mb-9" aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-100 sm:text-xl">{title}</h2>
        <div className="hidden items-center gap-2 lg:flex">
          <button type="button" onClick={() => nudge(-1)} disabled={atStart} aria-label={`เลื่อนซ้าย: ${title}`} className={arrow}>‹</button>
          <button type="button" onClick={() => nudge(1)} disabled={atEnd} aria-label={`เลื่อนขวา: ${title}`} className={arrow}>›</button>
        </div>
      </div>

      <div
        ref={ref}
        onScroll={update}
        className="pmn-row-scroll -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-6 py-3 scroll-px-6 lg:snap-none"
      >
        {items.map((a) => (
          <ArticleCard key={a.id} a={a} category={categories.find((c) => c.id === a.categoryId)?.name} />
        ))}
      </div>
    </section>
  );
}