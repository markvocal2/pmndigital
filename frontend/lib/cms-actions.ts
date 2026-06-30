'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch, publicBackendFetch, BackendError } from './api-client';
import type { Article, ArticleCategory, HomeContent, Lead, SiteSettings } from './cms';

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function explain(e: unknown): string {
  if (e instanceof BackendError) return e.message;
  if (e instanceof Error) return e.message;
  return 'เกิดข้อผิดพลาด';
}

/* ---------------- settings ---------------- */
export async function updateSettingsAction(
  input: Partial<SiteSettings>,
): Promise<ActionResult<SiteSettings>> {
  try {
    const d = await backendFetch<{ settings: SiteSettings }>('/admin/settings', {
      method: 'PUT',
      body: input,
    });
    revalidatePath('/');
    revalidatePath('/admin/settings');
    return { ok: true, data: d.settings };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

/* ---------------- home content ---------------- */
export async function updateHomeAction(
  input: { data?: Record<string, unknown>; seo?: Record<string, unknown> },
): Promise<ActionResult<HomeContent>> {
  try {
    const d = await backendFetch<{ home: HomeContent }>('/admin/home', {
      method: 'PUT',
      body: input,
    });
    revalidatePath('/');
    revalidatePath('/admin/home');
    return { ok: true, data: d.home };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

/* ---------------- media upload ---------------- */
export async function uploadMediaAction(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    const d = await backendFetch<{ url: string }>('/admin/media', {
      method: 'POST',
      formData,
    });
    return { ok: true, data: d };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

/* ---------------- articles ---------------- */
export type ArticleInput = Partial<Article> & { title: string; slug: string };

export async function saveArticleAction(
  id: number | null,
  input: ArticleInput,
): Promise<ActionResult<Article>> {
  try {
    const d = id
      ? await backendFetch<{ article: Article }>('/admin/articles/' + id, { method: 'PATCH', body: input })
      : await backendFetch<{ article: Article }>('/admin/articles', { method: 'POST', body: input });
    revalidatePath('/admin/articles');
    revalidatePath('/blog');
    revalidatePath('/blog/' + input.slug);
    return { ok: true, data: d.article };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function deleteArticleAction(id: number): Promise<ActionResult> {
  try {
    await backendFetch('/admin/articles/' + id, { method: 'DELETE' });
    revalidatePath('/admin/articles');
    revalidatePath('/blog');
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function createCategoryAction(input: {
  slug: string;
  name: string;
  nameEn?: string;
}): Promise<ActionResult<ArticleCategory>> {
  try {
    const d = await backendFetch<{ category: ArticleCategory }>('/admin/categories', {
      method: 'POST',
      body: input,
    });
    revalidatePath('/admin/articles');
    return { ok: true, data: d.category };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

/* ---------------- leads ---------------- */
export async function setLeadStatusAction(id: number, status: string): Promise<ActionResult<Lead>> {
  try {
    const d = await backendFetch<{ lead: Lead }>('/admin/leads/' + id, {
      method: 'PATCH',
      body: { status },
    });
    revalidatePath('/admin/leads');
    return { ok: true, data: d.lead };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function deleteLeadAction(id: number): Promise<ActionResult> {
  try {
    await backendFetch('/admin/leads/' + id, { method: 'DELETE' });
    revalidatePath('/admin/leads');
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

/* ---------------- public lead submit (no auth) ---------------- */
export type CouponOutcome = { applied: boolean; code?: string; message: string };

export async function submitLeadAction(input: {
  type: 'REGISTER' | 'CONTACT';
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  message?: string;
  source?: string;
  couponCode?: string;
  hp?: string;
}): Promise<ActionResult<{ coupon?: CouponOutcome }>> {
  try {
    const res = await publicBackendFetch<{ ok: boolean; coupon?: CouponOutcome }>('/public/leads', {
      method: 'POST',
      body: input,
    });
    return { ok: true, data: { coupon: res?.coupon } };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function validateCouponAction(
  code: string,
  email?: string,
): Promise<{ valid: boolean; message: string; discountType?: string; discountValue?: number; remaining?: number | null }> {
  try {
    return await publicBackendFetch('/public/coupons/validate', {
      method: 'POST',
      body: { code, email },
    });
  } catch {
    return { valid: false, message: 'ตรวจสอบคูปองไม่สำเร็จ' };
  }
}

/* ---------------- mail / notifications ---------------- */
type MailStatusShape = {
  configured: boolean;
  host: string | null;
  port: number | null;
  secure: boolean;
  user: string | null;
  from: string | null;
};

export async function getMailStatusAction(): Promise<ActionResult<MailStatusShape>> {
  try {
    const data = await backendFetch<MailStatusShape>('/admin/mail/status');
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function sendTestEmailAction(
  to: string,
): Promise<ActionResult<{ sent: boolean; error?: string; messageId?: string }>> {
  try {
    const data = await backendFetch<{ sent: boolean; error?: string; messageId?: string }>(
      '/admin/mail/test',
      { method: 'POST', body: { to } },
    );
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

/* ---------------- admin comment moderation ---------------- */
export async function setCommentStatusAction(
  id: number,
  status: 'PENDING' | 'APPROVED' | 'REJECTED',
): Promise<ActionResult> {
  try {
    await backendFetch('/admin/comments/' + id, { method: 'PATCH', body: { status } });
    revalidatePath('/admin/comments');
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function deleteCommentAction(id: number): Promise<ActionResult> {
  try {
    await backendFetch('/admin/comments/' + id, { method: 'DELETE' });
    revalidatePath('/admin/comments');
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

/* ---------------- media library ---------------- */
import type { MediaItem } from './cms';

export async function listMediaAction(): Promise<ActionResult<MediaItem[]>> {
  try {
    const d = await backendFetch<{ items: MediaItem[] }>('/admin/media/list');
    return { ok: true, data: d.items };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function deleteMediaAction(filename: string): Promise<ActionResult> {
  try {
    await backendFetch('/admin/media/' + encodeURIComponent(filename), { method: 'DELETE' });
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

/* ---------------- promotions & coupons (admin) ---------------- */
import type { Coupon, Promotion } from './cms';

export type PromotionInput = Partial<
  Omit<Promotion, 'id' | 'createdAt' | 'updatedAt' | 'live'>
> & { title: string };

function revalidatePromos() {
  revalidatePath('/admin/promotions');
  revalidatePath('/promotions');
  revalidatePath('/');
}

export async function savePromotionAction(
  id: number | null,
  input: PromotionInput,
): Promise<ActionResult<Promotion>> {
  try {
    const d = id
      ? await backendFetch<{ promotion: Promotion }>('/admin/promotions/' + id, { method: 'PATCH', body: input })
      : await backendFetch<{ promotion: Promotion }>('/admin/promotions', { method: 'POST', body: input });
    revalidatePromos();
    return { ok: true, data: d.promotion };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function setPromotionStateAction(
  id: number,
  state: { active?: boolean; featured?: boolean },
): Promise<ActionResult<Promotion>> {
  try {
    const d = await backendFetch<{ promotion: Promotion }>('/admin/promotions/' + id + '/state', {
      method: 'PATCH',
      body: state,
    });
    revalidatePromos();
    return { ok: true, data: d.promotion };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function deletePromotionAction(id: number): Promise<ActionResult> {
  try {
    await backendFetch('/admin/promotions/' + id, { method: 'DELETE' });
    revalidatePromos();
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export type CouponInput = Partial<
  Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'redeemedCount' | 'remaining'>
> & { code: string; discountType: 'PERCENT' | 'FIXED'; discountValue: number };

export async function saveCouponAction(
  id: number | null,
  input: CouponInput,
): Promise<ActionResult<Coupon>> {
  try {
    const d = id
      ? await backendFetch<{ coupon: Coupon }>('/admin/coupons/' + id, { method: 'PATCH', body: input })
      : await backendFetch<{ coupon: Coupon }>('/admin/coupons', { method: 'POST', body: input });
    revalidatePath('/admin/coupons');
    return { ok: true, data: d.coupon };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function setCouponStateAction(
  id: number,
  state: { active?: boolean },
): Promise<ActionResult<Coupon>> {
  try {
    const d = await backendFetch<{ coupon: Coupon }>('/admin/coupons/' + id + '/state', {
      method: 'PATCH',
      body: state,
    });
    revalidatePath('/admin/coupons');
    return { ok: true, data: d.coupon };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function deleteCouponAction(id: number): Promise<ActionResult> {
  try {
    await backendFetch('/admin/coupons/' + id, { method: 'DELETE' });
    revalidatePath('/admin/coupons');
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

/* ---------------- AI integrations (admin) ---------------- */
import type { IntegrationStatus } from './cms';

export async function saveIntegrationAction(
  provider: string,
  input: { mode?: string; apiKey?: string; enabled?: boolean; meta?: Record<string, unknown> },
): Promise<ActionResult<IntegrationStatus>> {
  try {
    const d = await backendFetch<{ integration: IntegrationStatus }>('/admin/integrations/' + provider, {
      method: 'PUT',
      body: input,
    });
    revalidatePath('/admin/integrations');
    return { ok: true, data: d.integration };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function testIntegrationAction(
  provider: string,
): Promise<ActionResult<{ ok: boolean; detail: string }>> {
  try {
    const d = await backendFetch<{ ok: boolean; detail: string }>(
      '/admin/integrations/' + provider + '/test',
      { method: 'POST' },
    );
    revalidatePath('/admin/integrations');
    return { ok: true, data: d };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}

export async function disconnectIntegrationAction(provider: string): Promise<ActionResult> {
  try {
    await backendFetch('/admin/integrations/' + provider, { method: 'DELETE' });
    revalidatePath('/admin/integrations');
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: explain(e) };
  }
}
