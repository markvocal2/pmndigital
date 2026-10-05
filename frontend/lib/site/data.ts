import {
  getPublicArticles,
  getPublicCategories,
  getPublicHome,
  getPublicSettings,
  isVideoUrl,
  type Article,
  type ArticleCategory,
  type SiteSettings,
} from '@/lib/cms';
import { defaultHomeContent, mergeHome, type HomeData } from '@/lib/home-content';
import { esc, html, raw, type Raw } from './html';

export interface SiteCtx {
  home: HomeData;
  settings: SiteSettings | null;
  email: string;
  footerDesc: Raw;
  /** Home SEO overrides from /admin/home. */
  seo: { metaTitle?: string; metaDesc?: string; ogImage?: string };
}

export async function loadCtx(): Promise<SiteCtx> {
  const [settings, homeRow] = await Promise.all([getPublicSettings(), getPublicHome()]);
  const home = mergeHome(homeRow?.data);
  const email = home.contact.email || settings?.contactEmail || 'support@pmndigital.co';
  const footerDesc = raw(esc(home.footer.desc));
  const seo = (homeRow?.seo ?? {}) as SiteCtx['seo'];
  return { home, settings, email, footerDesc, seo };
}

/**
 * The design rewrote a few default CMS strings. While the CMS still holds the untouched default we show
 * the design's version; once an editor changes it in /admin/home, their text wins.
 */
export function designOr<T>(cms: T, cmsDefault: T, design: T): T {
  return cms === cmsDefault ? design : cms;
}

/* ---------------- formatting ---------------- */
const TZ = 'Asia/Bangkok';
/** "28 ก.ย. 69" */
export const dateShort = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', timeZone: TZ }) : '';
/** "28 กันยายน 2569" */
export const dateFull = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }) : '';
/** "3 ต.ค. 2569" */
export const dateMid = (s?: string | number | Date | null) =>
  s ? new Date(s).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }) : '';
export const num = (n: number) => n.toLocaleString('en-US');
export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Stat value as the odometer string: 120 + "+" → "120+", 99.9 + "%" → "99.9%". */
export const statStr = (s: { target: number; suffix: string }) => `${s.target}${s.suffix}`;

/* ---------------- blog ---------------- */
export interface Cat {
  slug: string;
  name: string;
}
/** Uncategorised articles: labelled plainly "บทความ"; the index filter calls the group "อื่น ๆ". */
export const OTHER_CAT: Cat = { slug: 'other', name: 'บทความ' };
export const OTHER_FILTER_LABEL = 'อื่น ๆ';

export function catOf(a: Article, cats: ArticleCategory[]): Cat {
  const c = cats.find((x) => x.id === a.categoryId);
  return c ? { slug: c.slug, name: c.name } : OTHER_CAT;
}

/** Every live article, newest first (the API pages at 50). */
export async function getAllArticles(sort: 'latest' | 'views' = 'latest'): Promise<Article[]> {
  const first = await getPublicArticles(`limit=50&page=1&sort=${sort}`);
  const out = [...first.items];
  const pages = Math.ceil(first.total / (first.limit || 50));
  for (let p = 2; p <= Math.min(pages, 20); p++) {
    out.push(...(await getPublicArticles(`limit=50&page=${p}&sort=${sort}`)).items);
  }
  return out;
}

export const getCats = () => getPublicCategories();

/** Cover → `<video>` or `<img>` for a media frame, with the design's motion hooks. */
export function coverMedia(url: string | null | undefined, alt = ''): Raw {
  if (!url) return raw('');
  if (isVideoUrl(url)) {
    return html`<video src="${url}#t=0.1" muted loop playsinline preload="metadata" data-autoplay data-parallax-img aria-hidden="true"></video>`;
  }
  return html`<img src="${url}" alt="${alt}" loading="lazy" decoding="async" data-parallax-img>`;
}

export function excerptOf(a: Article, max = 150): string {
  const src = (a.excerpt || a.bodyHtml.replace(/<[^>]+>/g, ' ') || a.bodyMarkdown || '').replace(/\s+/g, ' ').trim();
  return src.length > max ? src.slice(0, max) + '…' : src;
}

/** One row of the article index (blog list, home "latest", related). */
export function indexRow(a: Article, cats: ArticleCategory[], withThumb: boolean): Raw {
  const c = catOf(a, cats);
  const video = isVideoUrl(a.coverImageUrl) ? a.coverImageUrl : '';
  const img = !video && a.coverImageUrl ? a.coverImageUrl : '';
  const thumb = !withThumb
    ? ''
    : video
      ? html`<span class="index__thumb" aria-hidden="true"><video src="${video}#t=0.1" muted loop playsinline preload="metadata" aria-hidden="true"></video></span>`
      : img
        ? html`<span class="index__thumb" aria-hidden="true"><img src="${img}" alt="" loading="lazy"></span>`
        : '';
  return html`<a class="index__row" href="/blog/${encodeURIComponent(a.slug)}" data-cat="${c.slug}" data-date="${a.publishedAt ?? ''}" data-views="${a.viewCount}" data-video="${video}" data-img="${img}">
  <span class="index__date data">${dateShort(a.publishedAt)}</span>
  <span class="index__cat">${c.name}</span>
  <span class="index__title">${a.title}</span>
  <span class="index__views data">${num(a.viewCount)} วิว</span>
  ${raw('<svg class="ico arw" viewBox="0 0 24 14" aria-hidden="true"><line x1="1" y1="7" x2="22.5" y2="7"/><path d="M16.5 1.5L22.5 7l-6 5.5"/></svg>')}
  ${thumb}
</a>`;
}

/* ---------------- portfolio ---------------- */
/** Projects in display order: the design leads with distribution before logistics while the list is the default. */
export function portfolioWorks(home: HomeData): HomeData['portfolio']['allWork'] {
  const all = home.portfolio.allWork;
  // compare by content: jsonb hands the keys back in its own order
  const sig = (l: typeof all) => JSON.stringify(l.map((w) => [w.cat, w.tag, w.t, w.d, w.m]));
  if (sig(all) !== sig(defaultHomeContent.portfolio.allWork)) return all;
  return [0, 1, 2, 4, 3, 5].map((i) => all[i]);
}

/* ---------------- portfolio art ---------------- */
/* 3D illustrations explaining each kind of system (stated on the page), matched to a project by industry. */
const WORK_ART: { re: RegExp; src: string; w: number; h: number; alt: string }[] = [
  { re: /manufactur|ผลิต/i, src: '/assets/img/work-manufacturing.webp', w: 1800, h: 1200, alt: 'ภาพประกอบ 3D: สายการผลิตในโรงงานกับจอ dashboard การผลิตแบบเรียลไทม์' },
  { re: /retail|ค้าปลีก/i, src: '/assets/img/work-retail.webp', w: 1200, h: 1600, alt: 'ภาพประกอบ 3D: ลูกค้าใช้แอปสมาชิกสะสมแต้มที่เคาน์เตอร์ร้านค้า' },
  { re: /fintech|finance|bank|การเงิน|database/i, src: '/assets/img/work-fintech.webp', w: 1800, h: 1350, alt: 'ภาพประกอบ 3D: ฐานข้อมูลส่งข้อมูลเร็วขึ้นจนเข็มวัดความเร็วขึ้นสุด' },
  { re: /distribut|คลัง|กระจาย/i, src: '/assets/img/work-distribution.webp', w: 1200, h: 1600, alt: 'ภาพประกอบ 3D: คลังสินค้าที่สแกนบาร์โค้ดและดูสต็อกทุกสาขาบนแผนที่' },
  { re: /logistic|ขนส่ง/i, src: '/assets/img/work-logistics.webp', w: 1800, h: 1200, alt: 'ภาพประกอบ 3D: รถขนส่งบนแผนที่เมืองกับจอติดตามสถานะแบบเรียลไทม์' },
  { re: /health|medical|แพทย์|เวช/i, src: '/assets/img/work-healthcare.webp', w: 1800, h: 1350, alt: 'ภาพประกอบ 3D: คลินิกที่ผู้ป่วยจองคิวผ่านแท็บเล็ต' },
];
export function workArt(tag: string, title: string, i: number) {
  return WORK_ART.find((a) => a.re.test(tag) || a.re.test(title)) ?? WORK_ART[i % WORK_ART.length];
}

/* ---------------- client logos ---------------- */
/* Trimmed copies of the CMS logos. `h` = height the logo gets in its cell (--h), balanced by eye in the design
   so wide wordmarks and square seals read at the same weight. Unknown names fall back to the CMS URL. */
interface ClientArt {
  src: string;
  alt: string;
  w: number;
  h: number;
  hPct: string;
}
const CLIENT_ART: (ClientArt & { re: RegExp })[] = [
  { re: /worldwide/i, src: '/assets/img/clients/worldwide-trade-thai.webp', alt: 'Worldwide Trade Thai', w: 476, h: 140, hPct: '35.1%' },
  { re: /^mwa$|ประปา/i, src: '/assets/img/clients/mwa.webp', alt: 'การประปานครหลวง (MWA)', w: 240, h: 240, hPct: '64.8%' },
  { re: /^dga$/i, src: '/assets/img/clients/dga.webp', alt: 'สำนักงานพัฒนารัฐบาลดิจิทัล (DGA)', w: 240, h: 150, hPct: '51.2%' },
  { re: /สสส|thaihealth/i, src: '/assets/img/clients/thaihealth.svg', alt: 'สสส.', w: 240, h: 207, hPct: '60.1%' },
  { re: /^bde$/i, src: '/assets/img/clients/bde.webp', alt: 'BDE', w: 425, h: 111, hPct: '33.1%' },
  { re: /ฉะเชิงเทรา/i, src: '/assets/img/clients/spm-chachoengsao.webp', alt: 'สพม.ฉะเชิงเทรา', w: 200, h: 239, hPct: '68.0%' },
  { re: /toursure/i, src: '/assets/img/clients/toursure.webp', alt: 'Toursure', w: 480, h: 101, hPct: '29.7%' },
  { re: /kmutnb|มจพ/i, src: '/assets/img/clients/kmutnb.webp', alt: 'มจพ. (KMUTNB)', w: 480, h: 114, hPct: '31.6%' },
  { re: /มจร|mcu/i, src: '/assets/img/clients/mcu.webp', alt: 'มจร.', w: 176, h: 232, hPct: '68.0%' },
  { re: /opendurian/i, src: '/assets/img/clients/opendurian.webp', alt: 'opendurian', w: 435, h: 222, hPct: '46.3%' },
  { re: /mirai/i, src: '/assets/img/clients/mirai.webp', alt: 'mirai', w: 198, h: 198, hPct: '64.8%' },
  { re: /toyota/i, src: '/assets/img/clients/toyota.webp', alt: 'Toyota', w: 427, h: 104, hPct: '32.0%' },
  { re: /กรุงศรี|krungsri/i, src: '/assets/img/clients/krungsri.webp', alt: 'ธนาคารกรุงศรี', w: 480, h: 181, hPct: '39.8%' },
  { re: /huawei/i, src: '/assets/img/clients/huawei.webp', alt: 'Huawei', w: 236, h: 240, hPct: '65.4%' },
];
export function clientArt(l: { name: string; logoUrl: string }): ClientArt {
  const hit = CLIENT_ART.find((c) => c.re.test(l.name.trim()));
  return hit ?? { src: l.logoUrl, alt: l.name, w: 240, h: 120, hPct: '40%' };
}

/* ---------------- tech icons ---------------- */
const TECH_ICON: Record<string, string> = {
  postgresql: 'postgresql',
  mysql: 'mysql',
  mongodb: 'mongodb',
  redis: 'redis',
  'node.js': 'nodedotjs',
  '.net': 'dotnet',
  python: 'python',
  docker: 'docker',
  kubernetes: 'kubernetes',
  react: 'react',
  'next.js': 'nextdotjs',
  'google cloud': 'googlecloud',
};
const TECH_GROUP: Record<string, 'Data' | 'Backend & Ops' | 'Frontend & Cloud'> = {
  postgresql: 'Data',
  mysql: 'Data',
  mongodb: 'Data',
  redis: 'Data',
  'node.js': 'Backend & Ops',
  '.net': 'Backend & Ops',
  python: 'Backend & Ops',
  docker: 'Backend & Ops',
  kubernetes: 'Backend & Ops',
  react: 'Frontend & Cloud',
  'next.js': 'Frontend & Cloud',
  aws: 'Frontend & Cloud',
  'google cloud': 'Frontend & Cloud',
};

/** The three "abacus" rails, grouped from the CMS tech list (unknown tools join Backend & Ops). */
export function techRails(techs: string[]): Raw {
  const groups: Record<string, string[]> = { Data: [], 'Backend & Ops': [], 'Frontend & Cloud': [] };
  for (const t of techs) groups[TECH_GROUP[t.toLowerCase()] ?? 'Backend & Ops'].push(t);
  const rails = Object.entries(groups)
    .filter(([, items]) => items.length)
    .map(([k, items]) => {
      const beads = items.map((t) => {
        const icon = TECH_ICON[t.toLowerCase()];
        return icon
          ? html`<li class="bead chip"><img src="/assets/img/tech/${icon}.svg" alt="" width="20" height="20">${t}</li>`
          : html`<li class="bead chip">${t}</li>`;
      });
      return html`<div class="rail"><p class="rail__k caps">${k}</p><div class="rail__rod"><span class="rail__line" aria-hidden="true"></span><ul class="rail__beads" aria-label="${k}">${beads}</ul></div></div>`;
    });
  return html`<div class="rails__body">${rails}</div>`;
}

/* ---------------- shared sections ---------------- */
export const SERVICE_OPTIONS = ['ระบบฐานข้อมูล (Database)', 'ระบบ ERP', 'ระบบ CRM', 'ซอฟต์แวร์สั่งทำ (Custom)', 'อื่น ๆ', 'ยังไม่แน่ใจ'];
export const SERVICE_ANCHORS = ['database', 'erp', 'crm', 'custom'];
