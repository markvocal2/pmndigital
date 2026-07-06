import { backendFetch } from './api-client';

export type UserRole = 'USER' | 'ADMIN';

export interface AdminUser {
  id: number;
  email: string;
  role: UserRole;
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

export interface PagedUsers {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export async function adminListUsers(
  params: { q?: string; page?: number; limit?: number } = {},
): Promise<PagedUsers> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const s = qs.toString();
  return backendFetch<PagedUsers>('/admin/users' + (s ? '?' + s : ''));
}

export async function adminGetUser(id: number): Promise<AdminUser> {
  return (await backendFetch<{ user: AdminUser }>('/admin/users/' + id)).user;
}
