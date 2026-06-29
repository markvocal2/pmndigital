'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { Article } from '@/lib/cms';
import { isVideoUrl } from '@/lib/cms';

const MONO = "'IBM Plex Mono', monospace";

function fmtDate(s: string | null): string {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

const clamp = (lines: number): CSSProperties => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

function ArticleCard({ a }: { a: Article }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={`/blog/${encodeURIComponent(a.slug)}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.08)',
        background: 'rgba(255,255,255,.025)',
        transform: hover ? 'translateY(-6px)' : 'none',
        borderColor: hover ? 'rgba(96,165,250,.4)' : 'rgba(255,255,255,.08)',
        transition: 'transform .35s cubic-bezier(.22,.7,.2,1), border-color .35s',
        height: '100%',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16 / 10', overflow: 'hidden', background: 'linear-gradient(135deg,#10203f,#0a1426)' }}>
        {a.coverImageUrl ? (
          isVideoUrl(a.coverImageUrl) ? (
            <video
              src={a.coverImageUrl}
              muted
              loop
              playsInline
              preload="metadata"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hover ? 'scale(1.06)' : 'none', transition: 'transform .5s' }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.coverImageUrl}
              alt={a.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hover ? 'scale(1.06)' : 'none', transition: 'transform .5s' }}
            />
          )
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(96,165,250,.4)', fontSize: 40, fontWeight: 700, fontFamily: MONO }}>
            {a.title.slice(0, 1)}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '18px 18px 20px', flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: 16.5, lineHeight: 1.35, fontWeight: 600, color: '#EAEEF6', ...clamp(2) }}>{a.title}</h3>
        {a.excerpt && <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#9aa6bd', fontWeight: 300, flex: 1, ...clamp(2) }}>{a.excerpt}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: 11.5, color: '#6f7b94', fontFamily: MONO }}>
          {a.publishedAt && <span>{fmtDate(a.publishedAt)}</span>}
          <span>{a.readingMins} นาที</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
            {a.viewCount.toLocaleString()}
          </span>
        </div>
      </div>
    </a>
  );
}

export function ArticlesCarousel({ articles }: { articles: Article[] }) {
  const [perView, setPerView] = useState(4);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setPerView(w < 640 ? 1 : w < 1024 ? 2 : w < 1280 ? 3 : 4);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const maxIndex = Math.max(0, articles.length - perView);
  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (paused || articles.length <= perView) return;
    const t = setInterval(() => setIndex((i) => (i >= maxIndex ? 0 : i + 1)), 4800);
    return () => clearInterval(t);
  }, [paused, maxIndex, perView, articles.length]);

  if (!articles.length) return null;

  const gap = 18;
  const basis = `calc((100% - ${(perView - 1) * gap}px) / ${perView})`;
  const step = `calc((100% - ${(perView - 1) * gap}px) / ${perView} + ${gap}px)`;
  const canPrev = index > 0;
  const canNext = index < maxIndex;

  const arrow = (enabled: boolean): CSSProperties => ({
    width: 42,
    height: 42,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,.14)',
    background: enabled ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)',
    color: enabled ? '#EAEEF6' : '#4a5468',
    cursor: enabled ? 'pointer' : 'default',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    transition: 'background .2s, border-color .2s',
  });

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            gap: `${gap}px`,
            transform: `translateX(calc(-1 * ${index} * ${step}))`,
            transition: 'transform .6s cubic-bezier(.22,.7,.2,1)',
          }}
        >
          {articles.map((a) => (
            <div key={a.id} style={{ flex: `0 0 ${basis}`, minWidth: 0 }}>
              <ArticleCard a={a} />
            </div>
          ))}
        </div>
      </div>

      {articles.length > perView && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 30 }}>
          <button aria-label="ก่อนหน้า" onClick={() => canPrev && setIndex((i) => i - 1)} disabled={!canPrev} style={arrow(canPrev)}>←</button>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                aria-label={`ไปสไลด์ ${i + 1}`}
                onClick={() => setIndex(i)}
                style={{
                  width: i === index ? 22 : 8,
                  height: 8,
                  borderRadius: 99,
                  border: 'none',
                  cursor: 'pointer',
                  background: i === index ? '#2563EB' : 'rgba(255,255,255,.18)',
                  transition: 'width .3s, background .3s',
                }}
              />
            ))}
          </div>
          <button aria-label="ถัดไป" onClick={() => canNext && setIndex((i) => i + 1)} disabled={!canNext} style={arrow(canNext)}>→</button>
        </div>
      )}
    </div>
  );
}
