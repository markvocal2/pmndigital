'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Article, ArticleCategory } from '@/lib/cms';
import { MediaImg } from '@/components/ui/Skeleton';

const ROTATE_MS = 7000;
const MAX_SLIDES = 5;

function fmtDate(s: string | null) {
  if (!s) return '';
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
}

function EyeViews({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {n.toLocaleString()}
    </span>
  );
}

/**
 * Netflix-style billboard for /blog. The cover art bleeds to the right edge and a gradient
 * dissolves it into the page background on the left, so the copy sits in the darkened zone
 * with nothing behind it to fight for contrast. Phones run the same trick vertically
 * (art on top, copy over the bottom fade) because a side-by-side split has no room there.
 *
 * Slides crossfade with a plain opacity transition — deliberately NOT a keyframe animation
 * with a fill-mode, which strands content at opacity:0 if it is interrupted.
 */
export function BlogHero({
  items,
  categories,
}: {
  items: Article[];
  categories: ArticleCategory[];
}) {
  // Prefer articles that actually have art; fall back to whatever exists so the hero
  // never disappears on a fresh site.
  const slides = useMemo(() => {
    const withCover = items.filter((a) => a.coverImageUrl);
    return (withCover.length ? withCover : items).slice(0, MAX_SLIDES);
  }, [items]);

  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setI((p) => (p + 1) % slides.length), ROTATE_MS);
    return () => window.clearInterval(t);
  }, [slides.length, paused]);

  if (slides.length === 0) return null;

  const idx = Math.min(i, slides.length - 1);
  const active = slides[idx];
  const catName = (id: number | null) => categories.find((c) => c.id === id)?.name;
  const go = (n: number) => setI(((n % slides.length) + slides.length) % slides.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="บทความแนะนำ"
      className="relative isolate overflow-hidden border-b border-white/[0.07]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* art layers, crossfaded */}
      <div className="absolute inset-0">
        {slides.map((a, n) => (
          <div
            key={a.id}
            aria-hidden={n !== idx}
            className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${n === idx ? 'opacity-100' : 'opacity-0'}`}
          >
            {a.coverImageUrl ? (
              <MediaImg
                src={a.coverImageUrl}
                alt=""
                autoPlay={n === idx}
                className="h-full w-full object-cover"
                style={{ objectPosition: 'center 30%' }}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#12244a] to-[#080d1a]" />
            )}
          </div>
        ))}
      </div>

      {/* The fade. Vertical up to tablet, horizontal from lg. The side-by-side split only
          earns its keep once there is real width — below lg the copy column covers ~75% of
          the viewport, so a left-to-right fade leaves text sitting on bright artwork (and
          plenty of covers have their own words baked in). */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{ background: 'linear-gradient(to top, #05070E 4%, rgba(5,7,14,0.95) 34%, rgba(5,7,14,0.55) 68%, rgba(5,7,14,0.22) 100%)' }}
      />
      <div
        className="absolute inset-0 hidden lg:block"
        style={{ background: 'linear-gradient(to right, #05070E 0%, rgba(5,7,14,0.96) 30%, rgba(5,7,14,0.78) 50%, rgba(5,7,14,0.28) 72%, rgba(5,7,14,0) 94%)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 hidden h-36 lg:block"
        style={{ background: 'linear-gradient(to top, #05070E 0%, rgba(5,7,14,0) 100%)' }}
      />

      {/* copy */}
      <div className="relative mx-auto flex min-h-[clamp(430px,60vh,600px)] max-w-6xl items-end px-6 pb-8 pt-28 lg:items-center lg:pb-14 lg:pt-24">
        <div className="max-w-[36rem]">
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-blue-500/90 px-3 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white">
              บทความแนะนำ
            </span>
            {catName(active.categoryId) && (
              <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-blue-100 backdrop-blur">
                {catName(active.categoryId)}
              </span>
            )}
          </div>

          <h2 className="line-clamp-4 text-[28px] font-bold leading-[1.14] tracking-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)] sm:text-4xl lg:text-[52px]">
            {active.title}
          </h2>

          {active.excerpt && (
            <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-[#B9C3D6] lg:text-[17px]">
              {active.excerpt}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11.5px] text-slate-400">
            {active.publishedAt && <span>{fmtDate(active.publishedAt)}</span>}
            <span>อ่าน {active.readingMins} นาที</span>
            <EyeViews n={active.viewCount} />
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={`/blog/${encodeURIComponent(active.slug)}`}
              className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#0A0F1C] shadow-[0_10px_30px_-12px_rgba(255,255,255,0.5)] transition hover:bg-white/85"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
              อ่านบทความ
            </Link>
            <a
              href="#articles"
              className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/[0.08] px-5 py-3 text-sm font-medium text-slate-100 backdrop-blur transition hover:bg-white/[0.16]"
            >
              ดูบทความทั้งหมด
            </a>
          </div>
        </div>
      </div>

      {/* controls */}
      {slides.length > 1 && (
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 pb-7">
          <div className="flex items-center gap-2">
            {slides.map((a, n) => (
              <button
                key={a.id}
                type="button"
                onClick={() => go(n)}
                aria-label={`บทความแนะนำที่ ${n + 1}: ${a.title}`}
                aria-current={n === idx}
                className={`h-1.5 rounded-full transition-all ${n === idx ? 'w-8 bg-white' : 'w-4 bg-white/30 hover:bg-white/60'}`}
              />
            ))}
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={() => go(idx - 1)}
              aria-label="บทความก่อนหน้า"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-lg text-slate-200 transition hover:bg-white/[0.14]"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(idx + 1)}
              aria-label="บทความถัดไป"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-lg text-slate-200 transition hover:bg-white/[0.14]"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </section>
  );
}