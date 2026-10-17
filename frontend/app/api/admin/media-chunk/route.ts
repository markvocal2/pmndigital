import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { backendFetch, BackendError } from '@/lib/api-client';

/*
 * One piece of a chunked media upload (see lib/media-upload.ts), sent as raw bytes with the
 * metadata in the query string.
 *
 * This used to be a Server Action. Cloudflare's managed rule "React - Leaking Server Functions
 * (CVE-2025-55183)" inspects Server Action bodies and blocked some clips outright (403, the
 * page sat at 0%) — the bytes of an ordinary mp4 happened to match. A plain POST with an
 * octet-stream body is not a Server Function call, so that rule leaves it alone (17 Oct 2026).
 */
export const dynamic = 'force-dynamic';

const MAX_PIECE = 9 * 1024 * 1024; // client sends 8 MB pieces

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ ok: false, error: 'ไม่มีสิทธิ์อัปโหลด' }, { status: 403 });

  const q = req.nextUrl.searchParams;
  const body = await req.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > MAX_PIECE) {
    return NextResponse.json({ ok: false, error: 'invalid chunk size' }, { status: 400 });
  }

  const fd = new FormData();
  for (const key of ['uploadId', 'offset', 'size', 'last', 'name', 'type']) fd.set(key, q.get(key) ?? '');
  fd.set('chunk', new Blob([body], { type: 'application/octet-stream' }), q.get('name') || 'upload');

  try {
    const data = await backendFetch<{ received: number; url?: string }>('/admin/media/chunk', {
      method: 'POST',
      formData: fd,
      // the last piece assembles the file and streams it to Drive: ~1 min per GB measured, allow 10
      timeoutMs: 10 * 60_000,
    });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const status = e instanceof BackendError ? e.status : 502;
    const error = e instanceof Error && e.message ? e.message : 'อัปโหลดไม่สำเร็จ';
    return NextResponse.json({ ok: false, error }, { status: status >= 400 && status < 600 ? status : 502 });
  }
}
