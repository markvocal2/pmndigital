'use client';

import { useEffect, useState } from 'react';
import { MediaImg } from '@/components/ui/Skeleton';
import { isVideoUrl } from '@/lib/cms';

/**
 * Article header: the cover image is used as a faint, blurred background that spans the
 * whole header (behind the title AND the image), with the FULL uncropped cover shown as a
 * rounded card floating on top. Click the cover to view it full-screen (images only).
 */
export function CoverStage({
  src,
  alt,
  title,
  category,
}: {
  src: string;
  alt: string;
  title: string;
  category?: string | null;
}) {
  const [zoom, setZoom] = useState(false);
  const isVid = isVideoUrl(src);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [zoom]);

  const fgClass =
    'relative z-10 mx-auto max-h-full max-w-full object-contain rounded-2xl shadow-[0_28px_80px_-26px_rgba(0,0,0,0.9)] ring-1 ring-white/12';

  return (
    <section className="relative overflow-hidden">
      {/* faint blurred cover — fills the WHOLE header (title zone + image zone) */}
      {!isVid && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-125 object-cover"
          style={{ filter: 'blur(44px) brightness(0.36) saturate(0.8)' }}
        />
      )}
      {/* darken the top (title legibility) + blend the bottom into the page */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05070E]/90 via-[#05070E]/55 to-[#05070E]" />
      {/* soft blue glow behind the floating cover */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 z-0 h-[60%] w-[70%] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(circle,rgba(37,99,235,.14),transparent 70%)', filter: 'blur(30px)' }} />

      <div className="relative z-10">
        {/* TITLE */}
        <div className="mx-auto max-w-[820px] px-6 pt-10 text-center md:pt-14">
          {category && (
            <div className="mb-4 inline-block rounded-full bg-blue-500/90 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-white">
              {category}
            </div>
          )}
          <h1 className="text-3xl font-bold leading-[1.12] tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)] sm:text-[44px]">
            {title}
          </h1>
        </div>

        {/* FULL cover — rounded card floating on the blurred background */}
        <div className="mt-8 flex h-[clamp(220px,38vh,360px)] items-center justify-center px-4 pb-3 sm:h-[clamp(300px,42vh,520px)] sm:px-8 md:mt-10">
          {isVid ? (
            <MediaImg src={src} alt={alt} autoPlay className={fgClass} />
          ) : (
            <button
              type="button"
              onClick={() => setZoom(true)}
              aria-label="ดูภาพเต็ม"
              className="group relative flex h-full w-full cursor-zoom-in items-center justify-center"
            >
              <MediaImg src={src} alt={alt} className={fgClass} />
              <span className="absolute bottom-4 right-4 z-20 rounded-full bg-black/55 px-3 py-1.5 text-[11px] text-white/85 opacity-0 backdrop-blur transition group-hover:opacity-100">
                ⤢ ดูภาพเต็ม
              </span>
            </button>
          )}
        </div>
      </div>

      {/* brand hairline at the very bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[2px] bg-gradient-to-r from-transparent via-blue-500/55 to-transparent" />

      {/* lightbox */}
      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070E]/92 p-4 backdrop-blur"
        >
          <button
            type="button"
            aria-label="ปิด"
            onClick={() => setZoom(false)}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </section>
  );
}
