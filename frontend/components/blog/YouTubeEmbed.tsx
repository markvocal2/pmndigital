'use client';

import { useState } from 'react';

/**
 * Click-to-play facade for a YouTube video. The iframe — and the ~1MB of player YouTube
 * pulls in with it — only mounts once the visitor asks for it, so an article carrying a
 * video costs one thumbnail on first paint instead of a third-party player. Playback goes
 * through youtube-nocookie.com.
 */
export function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  // maxres is missing for plenty of uploads; hq always exists, so fall back on error.
  const [thumb, setThumb] = useState(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`);

  return (
    <figure className="my-8">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`เล่นวิดีโอ: ${title}`}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt=""
              onError={() => setThumb(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-black/30 transition group-hover:bg-black/15" />
            <span className="absolute left-1/2 top-1/2 grid h-[68px] w-[68px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#FF0033] shadow-[0_12px_44px_-8px_rgba(255,0,51,0.75)] transition group-hover:scale-110">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden><path d="M8 5v14l11-7z" /></svg>
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-2.5 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
        วิดีโอประกอบบทความ
      </figcaption>
    </figure>
  );
}