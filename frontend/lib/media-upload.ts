'use client';

import { uploadMediaChunkAction } from './cms-actions';

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
