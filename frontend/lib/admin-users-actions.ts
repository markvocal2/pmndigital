'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch, BackendError } from './api-client';
import type { AdminUser, UserRole } from './admin-users';

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function explain(e: unknown): string {
  if (e instanceof BackendError) return e.message;
  if (e instanceof Error) return e.message;
  return 'เกิดข้อผิดพลาด';
}

export interface CreateUserInput {
  email: string;
  password: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

export async function createUserAction(
  input: CreateUserInput,
): Promise<ActionResult<AdminUser>> {
  try {
    const d = await backendFetch<{ user: AdminUser }>('/admin/users', {
      method: 'POST',
      body: input,
    });
    revalidatePath('/admin/users');
    return { ok: true, data: d.user };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export interface UpdateUserInput {
  email?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

export async function updateUserAction(
  id: number,
  input: UpdateUserInput,
): Promise<ActionResult<AdminUser>> {
  try {
    const d = await backendFetch<{ user: AdminUser }>('/admin/users/' + id, {
      method: 'PATCH',
      body: input,
    });
    revalidatePath('/admin/users');
    return { ok: true, data: d.user };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function resetUserPasswordAction(
  id: number,
  newPassword: string,
): Promise<ActionResult> {
  try {
    await backendFetch('/admin/users/' + id + '/password', {
      method: 'POST',
      body: { newPassword },
    });
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function deleteUserAction(id: number): Promise<ActionResult> {
  try {
    await backendFetch('/admin/users/' + id, { method: 'DELETE' });
    revalidatePath('/admin/users');
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}
