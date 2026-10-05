import { CURTAIN, FOOTER_MARK, LOADER_FRAME, LOADER_LETTERS, LOADER_SUB, NAV_PMN, NAV_SUB } from './brand';
import { html, raw, type Raw } from './html';
import type { SiteCtx } from './data';

export const SITE = 'https://pmndigital.co';
/** Bump when anything under public/assets/{css,js} changes (cache-busting query). */
export const ASSET_V = '202610051';

export type NavKey = 'home' | 'services' | 'portfolio' | 'pricing' | 'contact' | 'blog' | 'status' | null;

export const ARW = raw(
  '<svg class="ico arw" viewBox="0 0 24 14" aria-hidden="true"><line x1="1" y1="7" x2="22.5" y2="7"/><path d="M16.5 1.5L22.5 7l-6 5.5"/></svg>',
);
export const ico = (id: string, extra = '') => raw(`<svg class="ico${extra ? ' ' + extra : ''}" aria-hidden="true"><use href="#${id}"/></svg>`);

const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
<symbol id="i-check" viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></symbol>
<symbol id="i-up" viewBox="0 0 24 24"><path d="M12 4.5l8.5 14h-17z"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"/></symbol>
<symbol id="i-eye" viewBox="0 0 24 24"><path d="M1.5 12S5.5 4.8 12 4.8 22.5 12 22.5 12 18.5 19.2 12 19.2 1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3.2"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></symbol>
<symbol id="i-ok" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><path d="M7.6 12.4l3 3 5.8-6.2"/></symbol>
<symbol id="i-alert" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><path d="M12 7.4v5.6M12 16.5v.1"/></symbol>
<symbol id="i-ur" viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></symbol>
</svg>`;

const MENU: { key: Exclude<NavKey, null>; href: string; en: string; th: string }[] = [
  { key: 'home', href: '/', en: 'Home', th: 'หน้าแรก' },
  { key: 'services', href: '/services', en: 'Services', th: 'บริการ' },
  { key: 'portfolio', href: '/portfolio', en: 'Portfolio', th: 'ผลงาน' },
  { key: 'pricing', href: '/pricing', en: 'Pricing', th: 'ราคา' },
  { key: 'contact', href: '/contact', en: 'Contact', th: 'ติดต่อ' },
  { key: 'blog', href: '/blog', en: 'Blog', th: 'บทความ' },
  { key: 'status', href: '/status', en: 'Status', th: 'สถานะระบบ' },
];

export interface FooterCta {
  title: string;
  lead: string;
  second: { href: string; label: string };
}

export interface PageOpts {
  ctx: SiteCtx;
  nav: NavKey;
  title: string;
  description: string;
  /** Path (e.g. "/services") or absolute URL; omitted = no canonical tag. */
  canonical?: string;
  ogType?: 'website' | 'article';
  ogImage?: string | null;
  noindex?: boolean;
  ld?: Record<string, unknown>[];
  bodyClass: string;
  /** Home only: the stamp/counter intro instead of the page curtain. */
  loader?: boolean;
  /** Pages with media rows that preview on hover (home, blog). */
  preview?: boolean;
  footerCta?: FooterCta;
  main: Raw;
  /** Extra attributes on <body> (already escaped markup, e.g. data-slug). */
  bodyAttrs?: Raw;
  /** Extra scripts after the motion engine (already-safe markup). */
  tail?: Raw;
}

const abs = (u: string) => (u.startsWith('http') ? u : SITE + u);

/** Headless JSON for <script type="application/ld+json"> — "<" is escaped so the payload cannot close the tag. */
const ldJson = (o: unknown) => raw(JSON.stringify(o).replace(/</g, '\\u003c'));

function loaderBlock(count: number): Raw {
  return html`<div class="loader">
  <div class="loader__grid" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
  <div class="loader__stage" aria-hidden="true">
    <div class="loader__badge">
      ${raw(LOADER_FRAME)}
      ${raw(LOADER_LETTERS)}
      ${raw(LOADER_SUB)}
    </div>
    <img class="loader__stamp" src="/assets/img/obj-stamp-sm.webp" alt="" width="560" height="560" decoding="async">
  </div>
  <p class="loader__count" aria-hidden="true" data-target="${count}"><span>โปรเจกต์ที่ส่งมอบ</span><span class="odo-n">000</span></p>
  <button class="loader__skip ulink" type="button">ข้ามอินโทร</button>
</div>
`;
}

export function renderPage(o: PageOpts): string {
  const { ctx } = o;
  const email = ctx.email;
  const canonical = o.canonical ? abs(o.canonical) : null;
  const og = abs(o.ogImage || '/assets/img/og.jpg');
  const cta = o.footerCta ?? {
    title: ctx.home.ctaBand.title,
    lead: ctx.home.ctaBand.subtitle,
    second: { href: '/contact', label: 'ติดต่อทีมงาน' },
  };
  const menuDesk = MENU.map(
    (m, i) =>
      html`<li><a href="${m.href}"${o.nav === m.key ? raw(' aria-current="page"') : ''}><span>${m.en}</span><span class="data">${String(i + 1).padStart(2, '0')}</span></a></li>`,
  );
  const menuMob = MENU.map(
    (m) =>
      html`<li><a href="${m.href}"${o.nav === m.key ? raw(' aria-current="page"') : ''}><span>${m.en}</span><span class="data">${m.th}</span></a></li>`,
  );
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PMN Digital',
    legalName: 'PMN Digital Agency Co.,Ltd.',
    url: SITE,
    logo: `${SITE}/assets/logo-white.png`,
    email,
    address: { '@type': 'PostalAddress', addressLocality: 'Bangkok', addressCountry: 'TH' },
  };
  const lds = o.nav === 'home' ? [orgLd, ...(o.ld ?? [])] : (o.ld ?? []);
  const hours = html`จันทร์ – ศุกร์ ${ctx.home.contact.hoursWeekday} · เสาร์ – อาทิตย์ <span class="nw">${ctx.home.contact.hoursWeekend}</span>`;

  const doc = html`<!doctype html>
<html lang="th" class="${o.nav === 'home' ? 'home' : ''}">
<head>
<meta charset="utf-8">
${o.noindex ? raw('<meta name="robots" content="noindex, nofollow">\n') : ''}<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${o.title}</title>
<meta name="description" content="${o.description}">
${canonical ? html`<link rel="canonical" href="${canonical}">\n` : ''}<meta name="theme-color" content="#000000">
<meta property="og:type" content="${o.ogType ?? 'website'}">
<meta property="og:site_name" content="PMN Digital">
<meta property="og:title" content="${o.title}">
<meta property="og:description" content="${o.description}">
${canonical ? html`<meta property="og:url" content="${canonical}">\n` : ''}<meta property="og:image" content="${og}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/img/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/css/fonts.css?v=${ASSET_V}">
<link rel="stylesheet" href="/assets/css/main.css?v=${ASSET_V}">
<script>
(function(){var h=document.documentElement;h.classList.add('js');
if(/[?&]raf=timer/.test(location.search)){window.requestAnimationFrame=function(c){return setTimeout(function(){c(performance.now())},16)};window.cancelAnimationFrame=clearTimeout;}
var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!rm){h.classList.add('anim');}
try{if(!rm&&sessionStorage.getItem('pmn-nav')==='1'){h.classList.add('is-entering');}sessionStorage.removeItem('pmn-nav');
if(${raw(o.loader ? 'true' : 'false')}&&!rm&&!sessionStorage.getItem('pmn-loaded')){h.classList.add('show-loader');}}catch(e){}
setTimeout(function(){if(!window.__pmnBooted){h.classList.remove('anim','is-entering','show-loader');}},4000);})();
</script>
${lds.map((l) => html`<script type="application/ld+json">${ldJson(l)}</script>\n`)}</head>
<body class="${o.bodyClass}"${o.bodyAttrs ?? ''}>
${raw(SPRITE)}
${o.loader ? loaderBlock(ctx.loaderCount) : ''}<a class="skip" href="#main">ข้ามไปยังเนื้อหา</a>
<div class="curtain" aria-hidden="true">${raw(CURTAIN)}</div>
<header class="nav">
  <a class="nav__mark" href="/" aria-label="PMN Digital — หน้าแรก">${raw(NAV_PMN)}<span class="mk-subwrap">${raw(NAV_SUB)}</span></a>
  <div class="nav__right">
    <a class="badge badge--sm nav__cta" href="/#register">รับสิทธิพิเศษ ${ARW}</a>
    <nav class="menu" aria-label="เมนูหลัก">
      <button class="menu__btn" type="button" aria-expanded="false" aria-controls="menu-list"><span class="menu__icon" aria-hidden="true"><i></i><i></i><i></i></span>Menu</button>
      <ul class="menu__list" id="menu-list">${menuDesk}</ul>
    </nav>
    <button class="nav__burger" type="button" aria-expanded="false" aria-controls="mmenu"><span class="menu__icon" aria-hidden="true"><i></i><i></i><i></i></span><span class="nav__burger-label">MENU</span></button>
  </div>
</header>
<div class="mmenu" id="mmenu" aria-hidden="true">
  <nav aria-label="เมนูหลัก (มือถือ)"><ul class="mmenu__list">${menuMob}</ul></nav>
  <div class="mmenu__foot">
    <a class="badge badge--fill" href="/#register">รับสิทธิพิเศษฟรี ${ARW}</a>
    <a href="mailto:${email}" data-no-transition>${email}</a>
    <p>${ctx.home.contact.office}</p>
  </div>
</div>
<main id="main">
${o.main}
</main>
<footer class="footer s-dark">
  <div class="footer__cta">
    <h2 class="display" data-line>${cta.title}</h2>
    <p class="lead" data-line data-delay=".1">${cta.lead}</p>
    <div class="footer__btns" data-fade data-delay=".3"><a class="badge badge--lg badge--fill" href="/#register">รับสิทธิพิเศษฟรี ${ARW}</a><a class="badge badge--lg" href="${cta.second.href}">${cta.second.label} ${ARW}</a><a class="badge badge--lg" href="mailto:${email}" data-no-transition><span>${email}</span></a></div>
  </div>
  <div class="footer__cols">
    <div class="footer__about">
      <p>${ctx.footerDesc}</p>
    </div>
    <nav class="footer__col" aria-label="บริการ"><p class="footer__k">Services</p><a class="ulink" href="/services#database">ระบบฐานข้อมูล</a><a class="ulink" href="/services#erp">ระบบ ERP</a><a class="ulink" href="/services#crm">ระบบ CRM</a><a class="ulink" href="/services#custom">ซอฟต์แวร์สั่งทำ</a></nav>
    <nav class="footer__col" aria-label="บริษัท"><p class="footer__k">Company</p>
      <a class="ulink" href="/portfolio">ผลงาน</a><a class="ulink" href="/pricing">ราคา</a>
      <a class="ulink" href="/contact">ติดต่อเรา</a><a class="ulink" href="/blog">บทความ</a>
      <a class="ulink status-dot" href="/status">สถานะระบบ</a></nav>
    <div class="footer__col footer__col--wide"><p class="footer__k">Contact</p>
      <a class="ulink" href="mailto:${email}" data-no-transition>${email}</a>
      <p>${ctx.home.contact.office}</p>
      <p class="mute">${hours}</p></div>
  </div>
  <div class="footer__mark" aria-hidden="true">${raw(FOOTER_MARK)}</div>
  <div class="footer__credits"><p>© <span data-year>${new Date().getFullYear()}</span> PMN Digital Agency Co.,Ltd. — All rights reserved.</p></div>
</footer>
${o.preview ? raw('<div class="preview" aria-hidden="true"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="" hidden><video muted loop playsinline hidden></video></div>\n') : ''}<div class="cursor" aria-hidden="true"><span class="cursor__in"><span class="cursor__label">อ่าน</span>${ARW}</span></div>
<script src="/assets/vendor/gsap.min.js"></script>
<script src="/assets/vendor/ScrollTrigger.min.js"></script>
<script src="/assets/vendor/SplitText.min.js"></script>
<script src="/assets/vendor/CustomEase.min.js"></script>
<script src="/assets/vendor/Flip.min.js"></script>
<script src="/assets/vendor/lenis.min.js"></script>
<script src="/assets/js/main.js?v=${ASSET_V}"></script>
${o.tail ?? ''}</body>
</html>
`;
  // Every local asset gets the release stamp: artwork keeps its filename across design updates,
  // so without it browsers and the CDN would keep serving yesterday's image.
  return doc.value.replace(/((?:src|href|poster)=")(\/assets\/[^"?#]+)(?=")/g, `$1$2?v=${ASSET_V}`);
}

/** Wrap a rendered page in a Response. */
export function page(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Data underneath is cached for 30–120s by the fetch layer; the HTML itself is per request.
      'Cache-Control': 'no-store',
    },
  });
}
