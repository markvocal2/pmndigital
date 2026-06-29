'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { isVideoUrl } from '@/lib/cms';

/** Themed shimmer placeholder (dark base + blue/cyan sweep). */
export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <span className={`pmn-skel ${className}`} style={style} aria-hidden />;
}

/**
 * <img>/<video> that shows a shimmer skeleton (fills its relative parent)
 * until the media loads. Detects video by extension unless `video` is set.
 */
export function MediaImg({
  src,
  alt = '',
  className = '',
  style,
  video,
  autoPlay = false,
}: {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  video?: boolean;
  autoPlay?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const isVid = video ?? isVideoUrl(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);

  // If the media was already cached / loaded before React attached the load
  // handler (common after SSR hydration), `onLoad` never fires — detect it here.
  useEffect(() => {
    setLoaded(false);
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
      return;
    }
    const vid = vidRef.current;
    if (vid && vid.readyState >= 2) setLoaded(true);
  }, [src]);

  return (
    <>
      {!loaded && (
        <span className="pmn-skel" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit' }} aria-hidden />
      )}
      {isVid ? (
        <video
          ref={vidRef}
          src={src}
          autoPlay={autoPlay}
          muted
          loop
          playsInline
          preload={autoPlay ? 'auto' : 'metadata'}
          className={className}
          style={style}
          onLoadedData={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={className}
          style={style}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
    </>
  );
}
