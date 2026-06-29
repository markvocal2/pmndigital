import { auth } from '@/auth';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://backend:3001';

export class BackendError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Server-side helper to call the NestJS backend on behalf of the current
 * NextAuth session user. Auto-injects X-User-Id header and forwards JSON.
 */
export async function backendFetch<T = unknown>(
  pathname: string,
  init: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    body?: unknown;
    headers?: Record<string, string>;
    formData?: FormData;
  } = {},
): Promise<T> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new BackendError('Not authenticated', 401, 'UNAUTHENTICATED');
  }
  const isForm = init.formData !== undefined;
  const headers: Record<string, string> = {
    'X-User-Id': session.user.id,
    ...(init.headers ?? {}),
  };
  if (!isForm) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BACKEND_URL}/api${pathname}`, {
    method: init.method ?? 'GET',
    headers,
    body: isForm
      ? init.formData
      : init.body !== undefined
        ? JSON.stringify(init.body)
        : undefined,
    cache: 'no-store',
  });
  return unwrap<T>(res);
}

/**
 * Public (unauthenticated) backend call — for server components rendering
 * public pages (home, blog). No session/X-User-Id required.
 */
export async function publicBackendFetch<T = unknown>(
  pathname: string,
  init: { method?: 'GET' | 'POST'; body?: unknown; revalidate?: number } = {},
): Promise<T> {
  const method = init.method ?? 'GET';
  const cacheOpt =
    method === 'GET' && init.revalidate !== undefined
      ? { next: { revalidate: init.revalidate } }
      : { cache: 'no-store' as const };
  const res = await fetch(`${BACKEND_URL}/api${pathname}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    ...cacheOpt,
  });
  return unwrap<T>(res);
}

async function unwrap<T>(res: Response): Promise<T> {
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  if (!res.ok) {
    const obj =
      typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {};
    const message =
      (typeof obj.message === 'string' ? obj.message : null) ??
      `Backend error (HTTP ${res.status})`;
    const code = typeof obj.code === 'string' ? obj.code : undefined;
    throw new BackendError(message, res.status, code);
  }
  return parsed as T;
}

export interface MeUser {
  id: number;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  name: string | null;
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
  erpCustomerId: number | null;
  erpSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchMe(): Promise<MeUser> {
  const data = await backendFetch<{ user: MeUser }>('/users/me');
  return data.user;
}
