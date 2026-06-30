'use client';

import { useEffect, useState } from 'react';
import { MediaImg } from '@/components/ui/Skeleton';
import { isVideoUrl } from '@/lib/cms';

/**
 * Full-bleed article cover "stage": shows the ENTIRE cover uncropped (object-contain)
 * inside a height-capped band, with the same image blurred behind to fill the
 * letterbox/pillarbox dead space. Click to view the full image (images only).
 */
export function CoverStage({ src, alt }: { src: string; alt: string }) {
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
    <div className="relative w-full overflow-hidden h-[clamp(220px,38vh,360px)] sm:h-[clamp(300px,42vh,520px)]">
      {/* blurred backdrop fills the dead space with an on-brand wash (images only) */}
      {!isVid && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-125 object-cover"
          style={{ filter: 'blur(52px) brightness(0.28) saturate(0.7)' }}
        />
      )}
      <div className="absolute inset-0 bg-[#05070E]/74" />

      {/* foreground = the full image, never cropped */}
      {isVid ? (
        <div className="relative z-10 flex h-full w-full items-center justify-center px-4 py-5 sm:px-8 sm:py-7">
          <MediaImg src={src} alt={alt} autoPlay className={fgClass} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label="ดูภาพเต็ม"
          className="group relative z-10 flex h-full w-full cursor-zoom-in items-center justify-center px-4 py-5 sm:px-8 sm:py-7"
        >
          <MediaImg src={src} alt={alt} className={fgClass} />
          <span className="absolute bottom-4 right-4 z-20 rounded-full bg-black/55 px-3 py-1.5 text-[11px] text-white/85 opacity-0 backdrop-blur transition group-hover:opacity-100">
            ⤢ ดูภาพเต็ม
          </span>
        </button>
      )}

      {/* blend into the page + brand hairline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-b from-transparent to-[#05070E]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[2px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

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
    </div>
  );
}
