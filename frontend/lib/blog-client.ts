'use client';

import type { Article, ArticleComment, Paged, ServerStatus, StatusPage } from './cms';

export async function fetchServerStatus(): Promise<ServerStatus | null> {
  try {
    const r = await fetch('/api/public/server-status', { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json()) as ServerStatus;
  } catch {
    return null;
  }
}

export async function fetchStatusPage(): Promise<StatusPage | null> {
  try {
    const r = await fetch('/api/public/status-page', { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json()) as StatusPage;
  } catch {
    return null;
  }
}

/**
 * Client-side public API helpers. These hit the same-origin `/api/public/*`
 * path which Caddy proxies to the NestJS backend (no auth required).
 */

export async function fetchArticles(params: {
  page?: number;
  limit?: number;
  category?: string;
  sort?: string;
}): Promise<Paged<Article>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.category) qs.set('category', params.category);
  if (params.sort) qs.set('sort', params.sort);
  const r = await fetch('/api/public/articles?' + qs.toString(), { cache: 'no-store' });
  if (!r.ok) throw new Error('โหลดบทความไม่สำเร็จ');
  return r.json();
}

export async function fetchComments(slug: string): Promise<ArticleComment[]> {
  try {
    const r = await fetch('/api/public/articles/' + encodeURIComponent(slug) + '/comments', {
      cache: 'no-store',
    });
    if (!r.ok) return [];
    const d = (await r.json()) as { items: ArticleComment[] };
    return d.items ?? [];
  } catch {
    return [];
  }
}

export async function postComment(
  slug: string,
  data: { authorName: string; authorEmail?: string; body: string; hp?: string },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch('/api/public/articles/' + encodeURIComponent(slug) + '/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => null);
      const msg = d && Array.isArray(d.message) ? d.message[0] : d?.message;
      return { ok: false, error: msg || 'ส่งความคิดเห็นไม่สำเร็จ' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}

/** Fire-and-forget view counter, deduped per article per browser session. */
export function pingView(slug: string): void {
  try {
    const key = 'pmn_viewed_' + slug;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    fetch('/api/public/articles/' + encodeURIComponent(slug) + '/view', {
      method: 'POST',
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
