import { backendFetch, publicBackendFetch } from './api-client';

/* ---------------- types ---------------- */
export interface SiteSettings {
  id: number;
  key: string;
  siteName: string;
  siteNameEn: string | null;
  tagline: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  logoHeight: number;
  faviconUrl: string | null;
  ogDefaultUrl: string | null;
  timezone: string;
  defaultLocale: string;
  themeDefault: string;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  geoLat: number | null;
  geoLng: number | null;
  mapUrl: string | null;
  socials: Record<string, string> | null;
  defaultMetaTitle: string | null;
  defaultMetaDesc: string | null;
  defaultKeywords: string | null;
  gaId: string | null;
  gtmId: string | null;
  maintenanceMode: boolean;
  extra: Record<string, unknown> | null;
  updatedAt: string;
}

export interface HomeContent {
  id: number;
  key: string;
  data: Record<string, unknown>;
  seo: Record<string, unknown> | null;
  updatedAt: string;
}

export interface ArticleFaq {
  q: string;
  a: string;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  bodyMarkdown: string;
  coverImageUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  authorId: number | null;
  categoryId: number | null;
  tags: string[];
  readingMins: number;
  viewCount: number;
  metaTitle: string | null;
  metaDesc: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  noindex: boolean;
  keyphrase: string | null;
  faq: ArticleFaq[] | null;
  takeaways: string[];
  schemaType: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleCategory {
  id: number;
  slug: string;
  name: string;
  nameEn: string | null;
}

export interface Lead {
  id: number;
  type: 'REGISTER' | 'CONTACT';
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  message: string | null;
  status: 'NEW' | 'CONTACTED' | 'CLOSED';
  source: string | null;
  couponCode: string | null;
  couponId: number | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/* ---------------- public reads ---------------- */
export async function getPublicSettings(): Promise<SiteSettings | null> {
  try {
    const d = await publicBackendFetch<{ settings: SiteSettings }>('/public/settings', { revalidate: 30 });
    return d.settings;
  } catch {
    return null;
  }
}
export async function getPublicHome(): Promise<HomeContent | null> {
  try {
    const d = await publicBackendFetch<{ home: HomeContent }>('/public/home');
    return d.home;
  } catch {
    return null;
  }
}
export async function getPublicArticles(qs = ''): Promise<Paged<Article>> {
  try {
    return await publicBackendFetch<Paged<Article>>('/public/articles' + (qs ? '?' + qs : ''), { revalidate: 60 });
  } catch {
    return { items: [], total: 0, page: 1, limit: 12 };
  }
}
export async function getPublicArticle(slug: string): Promise<Article | null> {
  try {
    const d = await publicBackendFetch<{ article: Article }>('/public/articles/' + encodeURIComponent(slug), { revalidate: 60 });
    return d.article;
  } catch {
    return null;
  }
}
export async function getPublicCategories(): Promise<ArticleCategory[]> {
  try {
    const d = await publicBackendFetch<{ items: ArticleCategory[] }>('/public/categories', { revalidate: 120 });
    return d.items;
  } catch {
    return [];
  }
}

/* ---------------- admin reads (require admin session) ---------------- */
export async function adminGetSettings(): Promise<SiteSettings> {
  return (await backendFetch<{ settings: SiteSettings }>('/admin/settings')).settings;
}
export async function adminGetHome(): Promise<HomeContent> {
  return (await backendFetch<{ home: HomeContent }>('/admin/home')).home;
}
export async function adminListArticles(qs = ''): Promise<Paged<Article>> {
  return backendFetch<Paged<Article>>('/admin/articles' + (qs ? '?' + qs : ''));
}
export async function adminGetArticle(id: number): Promise<Article> {
  return (await backendFetch<{ article: Article }>('/admin/articles/' + id)).article;
}
export async function adminListCategories(): Promise<ArticleCategory[]> {
  return (await backendFetch<{ items: ArticleCategory[] }>('/admin/categories')).items;
}
export async function adminListLeads(qs = ''): Promise<Paged<Lead>> {
  return backendFetch<Paged<Lead>>('/admin/leads' + (qs ? '?' + qs : ''));
}

/* ---------------- comments ---------------- */
export interface ArticleComment {
  id: number;
  authorName: string;
  body: string;
  createdAt: string;
}
export interface AdminComment {
  id: number;
  articleId: number;
  article: { title: string; slug: string } | null;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

/* related (server) */
export async function getRelatedArticles(slug: string, limit = 4): Promise<Article[]> {
  try {
    const d = await publicBackendFetch<{ items: Article[] }>(
      '/public/articles/' + encodeURIComponent(slug) + '/related?limit=' + limit,
      { revalidate: 120 },
    );
    return d.items;
  } catch {
    return [];
  }
}

/* admin comments */
export async function adminListComments(qs = ''): Promise<Paged<AdminComment>> {
  return backendFetch<Paged<AdminComment>>('/admin/comments' + (qs ? '?' + qs : ''));
}
export async function adminPendingCommentCount(): Promise<number> {
  try {
    return (await backendFetch<{ count: number }>('/admin/comments/pending-count')).count;
  } catch {
    return 0;
  }
}

/* ---------------- media ---------------- */
export interface MediaItem {
  url: string;
  filename: string;
  size: number;
  mtime: number;
}

/* ---------------- server status ---------------- */
export interface ServerStatus {
  operational: boolean;
  uptimePct: number;
  responseMs: number;
  days: number[];
  updatedAt: string;
}
export async function getServerStatus(): Promise<ServerStatus | null> {
  try {
    return await publicBackendFetch<ServerStatus>('/public/server-status');
  } catch {
    return null;
  }
}

/* ---------------- promotions & coupons ---------------- */
export type DiscountType = 'PERCENT' | 'FIXED' | 'BUNDLE' | 'FREE' | 'OTHER';

export interface Promotion {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  badge: string | null;
  discountType: DiscountType;
  discountValue: number | null;
  originalPrice: number | null;
  finalPrice: number | null;
  priceUnit: string | null;
  imageUrl: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  couponCode: string | null;
  terms: string | null;
  highlightColor: string | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  live?: boolean; // computed in admin list
}

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  maxRedemptions: number | null;
  redeemedCount: number;
  perEmailLimit: number | null;
  minPurchase: number | null;
  promotionId: number | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  remaining?: number | null; // computed in admin list
}

export interface CouponRedemption {
  id: number;
  couponId: number;
  code: string;
  leadId: number | null;
  email: string | null;
  createdAt: string;
}

export async function getPublicPromotions(): Promise<Promotion[]> {
  try {
    return (await publicBackendFetch<{ items: Promotion[] }>('/public/promotions', { revalidate: 30 })).items;
  } catch {
    return [];
  }
}
export async function adminListPromotions(): Promise<Promotion[]> {
  return (await backendFetch<{ items: Promotion[] }>('/admin/promotions')).items;
}
export async function adminGetPromotion(id: number): Promise<Promotion> {
  return (await backendFetch<{ promotion: Promotion }>('/admin/promotions/' + id)).promotion;
}
export async function adminListCoupons(): Promise<Coupon[]> {
  return (await backendFetch<{ items: Coupon[] }>('/admin/coupons')).items;
}
export async function adminGetCoupon(id: number): Promise<Coupon> {
  return (await backendFetch<{ coupon: Coupon }>('/admin/coupons/' + id)).coupon;
}
export async function adminListRedemptions(id: number): Promise<CouponRedemption[]> {
  return (await backendFetch<{ items: CouponRedemption[] }>('/admin/coupons/' + id + '/redemptions')).items;
}

/** True if a cover/media URL points to a video file. */
export function isVideoUrl(u?: string | null): boolean {
  return !!u && /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u);
}
