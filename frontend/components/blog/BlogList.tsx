'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Article, ArticleCategory } from '@/lib/cms';
import { isVideoUrl } from '@/lib/cms';
import { fetchArticles } from '@/lib/blog-client';

const PAGE_SIZE = 20;

const SORTS = [
  { key: 'latest', label: 'ใหม่สุด' },
  { key: 'views', label: 'ยอดวิวมากสุด' },
  { key: 'views_asc', label: 'ยอดวิวน้อยสุด' },
  { key: 'oldest', label: 'เก่าสุด' },
];

function fmtDate(s: string | null) {
  if (!s) return '';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function EyeViews({ n }: { n: number }) {
  return (
    <span className="ml-auto inline-flex items-center gap-1.5">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
      {n.toLocaleString()}
    </span>
  );
}

export function BlogList({
  initial,
  total: totalInit,
  categories,
}: {
  initial: Article[];
  total: number;
  categories: ArticleCategory[];
}) {
  const [items, setItems] = useState<Article[]>(initial);
  const [total, setTotal] = useState(totalInit);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('latest');
  const [busy, setBusy] = useState(false);
  const first = useRef(true);

  const catName = (id: number | null) => categories.find((c) => c.id === id)?.name;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let alive = true;
    setBusy(true);
    setPage(1);
    fetchArticles({ page: 1, limit: PAGE_SIZE, category: category === 'all' ? undefined : category, sort })
      .then((r) => {
        if (!alive) return;
        setItems(r.items);
        setTotal(r.total);
      })
      .catch(() => {
        if (alive) {
          setItems([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [category, sort]);

  async function loadMore() {
    const next = page + 1;
    setBusy(true);
    try {
      const r = await fetchArticles({ page: next, limit: PAGE_SIZE, category: category === 'all' ? undefined : category, sort });
      setItems((prev) => [...prev, ...r.items]);
      setPage(next);
      setTotal(r.total);
    } finally {
      setBusy(false);
    }
  }

  const hasMore = items.length < total;
  const pill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm transition ${active ? 'bg-blue-500/20 font-semibold text-blue-100 ring-1 ring-blue-400/40' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`;

  return (
    <div>
      {/* filters */}
      <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setCategory('all')} className={pill(category === 'all')}>ทั้งหมด</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCategory(c.slug)} className={pill(category === c.slug)}>{c.name}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">เรียงโดย</span>
          {SORTS.map((s) => (
            <button key={s.key} onClick={() => setSort(s.key)} className={pill(sort === s.key)}>{s.label}</button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-16 text-center text-slate-500">{busy ? 'กำลังโหลด…' : 'ยังไม่มีบทความในหมวดนี้'}</p>
      ) : (
        <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${busy ? 'opacity-60 transition' : ''}`}>
          {items.map((a) => (
            <Link
              key={a.id}
              href={`/blog/${encodeURIComponent(a.slug)}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] transition hover:-translate-y-1 hover:border-blue-400/40"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#10203f] to-[#0a1426]">
                {a.coverImageUrl ? (
                  isVideoUrl(a.coverImageUrl) ? (
                    <video src={a.coverImageUrl} muted loop playsInline preload="metadata" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.coverImageUrl} alt={a.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  )
                ) : (
                  <div className="grid h-full place-items-center font-mono text-3xl font-bold text-blue-400/30">{a.title.slice(0, 1)}</div>
                )}
                {catName(a.categoryId) && (
                  <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-blue-100 backdrop-blur">{catName(a.categoryId)}</span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h2 className="line-clamp-2 text-lg font-semibold leading-snug">{a.title}</h2>
                {a.excerpt && <p className="line-clamp-2 flex-1 text-sm text-[#8B95AC]">{a.excerpt}</p>}
                <div className="mt-2 flex items-center gap-3 font-mono text-[11.5px] text-slate-500">
                  {a.publishedAt && <span>{fmtDate(a.publishedAt)}</span>}
                  <span>{a.readingMins} นาที</span>
                  <EyeViews n={a.viewCount} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={loadMore}
            disabled={busy}
            className="rounded-full border border-white/15 bg-white/[0.04] px-8 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            {busy ? 'กำลังโหลด…' : `โหลดเพิ่ม (${total - items.length} บทความ)`}
          </button>
        </div>
      )}
    </div>
  );
}
