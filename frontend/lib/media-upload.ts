'use client';

import { useEffect } from 'react';
import { uploadMediaChunkAction } from './cms-actions';

/** Clip formats the site can play back; keep in step with the file inputs' accept lists. */
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const MEDIA_ACCEPT = ['image/*', ...VIDEO_TYPES].join(',');
const UNSUPPORTED_MSG = 'รองรับเฉพาะรูปภาพ และวิดีโอ MP4 / WebM / MOV';

/**
 * Image (and, when allowed, video) files from a drop or paste, in order. Until 17 Oct 2026 the
 * editor, cover field and media library only took files from the file picker: a clip dragged
 * onto them was ignored, and the browser then opened it in place of the half-written article.
 */
export function pickMediaFiles(
  dt: DataTransfer | null,
  allowVideo = true,
): { files: File[]; rejected: string | null } {
  const all = dt ? Array.from(dt.files) : [];
  const files = all.filter((f) => f.type.startsWith('image/') || (allowVideo && VIDEO_TYPES.includes(f.type)));
  const rejected = all.length > files.length ? (allowVideo ? UNSUPPORTED_MSG : 'ช่องนี้รับเฉพาะรูปภาพ') : null;
  return { files, rejected };
}

/** Stop a file dropped outside a drop target from navigating away from the form. */
export function useBlockFileDropNavigation() {
  useEffect(() => {
    const stop = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    };
    window.addEventListener('dragover', stop);
    window.addEventListener('drop', stop);
    return () => {
      window.removeEventListener('dragover', stop);
      window.removeEventListener('drop', stop);
    };
  }, []);
}

/** Largest file the CMS accepts (keep in step with MAX_BYTES in backend cms.service.ts). */
export const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = '1GB';

/*
 * Every admin upload goes up in 8 MB pieces. One request per piece stays under the
 * 10 MB body Next's proxy passes through and Cloudflare's 100 MB request cap, so clip
 * size is bounded only by MAX_UPLOAD_BYTES. Each piece is retried a few times before
 * giving up; the backend acknowledges a repeated piece without writing it twice.
 */
const CHUNK = 8 * 1024 * 1024;
const RETRIES = 3;

export function tooLargeMessage(file: File): string | null {
  return file.size > MAX_UPLOAD_BYTES
    ? `ไฟล์ใหญ่เกินไป (${(file.size / 1048576).toFixed(1)}MB) — สูงสุด ${MAX_UPLOAD_LABEL}`
    : null;
}

/** Upload a file to the media library; resolves to its public url. `onProgress` gets 0–100. */
export async function uploadMedia(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const big = tooLargeMessage(file);
  if (big) throw new Error(big);
  if (file.size === 0) throw new Error('ไฟล์ว่างเปล่า');
  const uploadId = crypto.randomUUID();
  onProgress?.(0);
  for (let offset = 0; offset < file.size; offset += CHUNK) {
    const piece = file.slice(offset, Math.min(offset + CHUNK, file.size));
    const last = offset + CHUNK >= file.size;
    let error = '';
    for (let attempt = 0; attempt < RETRIES; attempt++) {
      const fd = new FormData();
      fd.set('uploadId', uploadId);
      fd.set('offset', String(offset));
      fd.set('size', String(file.size));
      fd.set('last', last ? '1' : '0');
      fd.set('name', file.name);
      fd.set('type', file.type || 'application/octet-stream');
      fd.set('chunk', piece, file.name);
      let res: Awaited<ReturnType<typeof uploadMediaChunkAction>> | null = null;
      try {
        res = await uploadMediaChunkAction(fd);
      } catch {
        error = 'การเชื่อมต่อขาดระหว่างอัปโหลด';
      }
      if (res?.ok) {
        onProgress?.(Math.round(((offset + piece.size) / file.size) * 100));
        if (!last) {
          error = '';
          break;
        }
        if (res.data.url) return res.data.url;
        throw new Error('อัปโหลดไม่สำเร็จ — ไม่ได้รับลิงก์ไฟล์');
      }
      if (res && !res.ok) {
        error = res.error;
        // the server rejected the piece itself (size, order): retrying the same bytes will not help
        if (/ใหญ่เกินไป|invalid|out of order|incomplete/i.test(error)) break;
      }
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
    if (error) throw new Error(error);
  }
  throw new Error('อัปโหลดไม่สำเร็จ');
}
