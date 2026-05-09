'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch, BackendError, MeUser } from './api-client';

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function explain(e: unknown): string {
  if (e instanceof BackendError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Unexpected error';
}

export async function updateProfileAction(input: {
  firstName?: string;
  lastName?: string;
  displayName?: string;
}): Promise<ActionResult<MeUser>> {
  try {
    const data = await backendFetch<{ user: MeUser }>('/users/me', {
      method: 'PATCH',
      body: input,
    });
    revalidatePath('/profile/general');
    revalidatePath('/');
    return { ok: true, data: data.user };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function changePasswordAction(input: {
  oldPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  try {
    await backendFetch('/users/me/password', {
      method: 'POST',
      body: input,
    });
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function deleteAvatarAction(): Promise<ActionResult<MeUser>> {
  try {
    const data = await backendFetch<{ user: MeUser }>('/users/me/avatar', {
      method: 'DELETE',
    });
    revalidatePath('/profile/general');
    revalidatePath('/');
    return { ok: true, data: data.user };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

/** 2FA */

export async function setup2faAction(): Promise<
  ActionResult<{ secret: string; otpauthUrl: string; qrDataUrl: string }>
> {
  try {
    const data = await backendFetch<{
      secret: string;
      otpauthUrl: string;
      qrDataUrl: string;
    }>('/auth/2fa/setup', { method: 'POST' });
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function verifyEnable2faAction(
  code: string,
): Promise<ActionResult<{ backupCodes: string[] }>> {
  try {
    const data = await backendFetch<{ backupCodes: string[] }>(
      '/auth/2fa/verify',
      { method: 'POST', body: { code } },
    );
    revalidatePath('/profile/security');
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function disable2faAction(input: {
  password: string;
  code?: string;
}): Promise<ActionResult> {
  try {
    await backendFetch('/auth/2fa/disable', {
      method: 'POST',
      body: input,
    });
    revalidatePath('/profile/security');
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

/** Avatar via FormData (passed from client component, server action streams to backend) */
export async function uploadAvatarAction(
  formData: FormData,
): Promise<ActionResult<MeUser>> {
  try {
    const data = await backendFetch<{ user: MeUser }>('/users/me/avatar', {
      method: 'POST',
      formData,
    });
    revalidatePath('/profile/general');
    revalidatePath('/');
    return { ok: true, data: data.user };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}
