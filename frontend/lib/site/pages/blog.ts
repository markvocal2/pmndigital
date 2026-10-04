import { getPublicArticle, getRelatedArticles, isVideoUrl, youtubeId, type ArticleComment } from '@/lib/cms';
import { publicBackendFetch } from '@/lib/api-client';
import { renderMarkdown, plainText } from '@/lib/md';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import {
  catOf,
  coverMedia,
  dateFull,
  dateShort,
  excerptOf,
  getAllArticles,
  getCats,
  indexRow,
  loadCtx,
  num,
  OTHER_CAT,
  OTHER_FILTER_LABEL,
  pad2,
} from '../data';
import { html, raw, type Raw } from '../html';
import { commentForm, phero } from '../sections';
import { ARW, ico, renderPage, SITE } from '../shell';

export async function renderBlogIndex(): Promise<string> {
  const [c, all, cats] = await Promise.all([loadCtx(), getAllArticles('latest'), getCats()]);
  const feat = all.slice(0, 3).map(
    (a) => html`<a class="feat__item" href="/blog/${encodeURIComponent(a.slug)}" data-cursor="อ่าน">
  <div class="card__media" data-wipe>${coverMedia(a.coverImageUrl, a.title)}</div>
  <h3>${a.title}</h3>
  <p class="card__cat caps"><span>${catOf(a, cats).name}</span><span class="data">${dateShort(a.publishedAt)}</span></p>
  <p>${excerptOf(a)}</p>
</a>`,
  );
  const groups = [...cats.map((x) => ({ slug: x.slug, name: x.name })), { slug: OTHER_CAT.slug, name: OTHER_FILTER_LABEL }]
    .map((g) => ({ ...g, n: all.filter((a) => catOf(a, cats).slug === g.slug).length }))
    .filter((g) => g.n > 0);
  const filters = [
    html`<button type="button" data-cat-filter="all" aria-pressed="true">ทั้งหมด<span class="count">${all.length}</span></button>`,
    ...groups.map((g) => html`<button type="button" data-cat-filter="${g.slug}" aria-pressed="false">${g.name}<span class="count">${g.n}</span></button>`),
  ];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'บทความ · PMN Digital',
    url: `${SITE}/blog`,
    publisher: { '@type': 'Organization', name: 'PMN Digital' },
    blogPost: all.slice(0, 12).map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE}/blog/${encodeURIComponent(a.slug)}`,
      datePublished: a.publishedAt || undefined,
    })),
  };
  const main = html`
${phero({
  lines: ['บทความ & ความรู้'],
  lead: 'อัปเดตแนวคิด เทคนิค และกรณีศึกษาด้านระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์เฉพาะทาง',
  caps: 'Articles',
  meta: `( ${all.length} )${all[0] ? ` · อัปเดตล่าสุด ${dateFull(all[0].publishedAt)}` : ''}`,
  obj: 'obj-receipt.webp',
  objB: 'obj-binder-sm.webp',
})}
${
  all.length
    ? html`<section class="sec s-dark" aria-labelledby="new-title">
  <div class="sec-head"><h2 class="h2" id="new-title" data-line>มาใหม่ล่าสุด</h2></div>
  <div class="feat">${feat}</div>
</section>
<section class="sec s-light" aria-labelledby="idx-title">
  <div class="sec-head"><h2 class="h2" id="idx-title" data-line>ดัชนีบทความ<span class="count">( ${pad2(all.length)} )</span></h2></div>
  <div class="index-tools">
    <div class="filters" role="group" aria-label="กรองตามหมวดหมู่">${filters}</div>
    <div class="filters" role="group" aria-label="เรียงลำดับ"><button type="button" data-sort="new" aria-pressed="true">ล่าสุด</button><span class="filters__sep" aria-hidden="true"></span><button type="button" data-sort="pop" aria-pressed="false">ยอดนิยม</button></div>
  </div>
  <p class="sr-only" id="index-live" aria-live="polite"></p>
  <div class="index" data-index>${all.map((a) => indexRow(a, cats, true))}<p class="index__empty" hidden>ยังไม่มีบทความในหมวดนี้</p></div>
</section>`
    : html`<section class="sec s-light"><p class="mute">ยังไม่มีบทความ</p></section>`
}
`;
  return renderPage({
    ctx: c,
    nav: 'blog',
    title: 'บทความ · PMN Digital',
    description: 'บทความและความรู้ด้านระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์ จาก PMN Digital',
    canonical: '/blog',
    bodyClass: 'page-blog',
    preview: true,
    ld: [ld],
    main,
  });
}

async function getComments(slug: string): Promise<ArticleComment[]> {
  try {
    const d = await publicBackendFetch<{ items: ArticleComment[] }>('/public/articles/' + encodeURIComponent(slug) + '/comments', {
      revalidate: 30,
    });
    return d.items ?? [];
  } catch {
    return [];
  }
}

/** Section headings in the body join the line-reveal motion like the rest of the page. */
const revealHeadings = (h: string) => h.replace(/<h([23])(?![^>]*data-line)(\s[^>]*)?>/gi, (_m, n, attrs = '') => `<h${n}${attrs} data-line>`);

/** Null when the slug is unknown (the route answers 404). */
export async function renderArticle(slug: string): Promise<string | null> {
  const [c, art, cats, related, all, comments] = await Promise.all([
    loadCtx(),
    getPublicArticle(slug),
    getCats(),
    getRelatedArticles(slug, 3),
    getAllArticles('latest'),
    getComments(slug),
  ]);
  if (!art) return null;
  const cat = catOf(art, cats);
  const url = `${SITE}/blog/${encodeURIComponent(art.slug)}`;
  const body = revealHeadings(art.bodyHtml ? sanitizeArticleHtml(art.bodyHtml) : renderMarkdown(art.bodyMarkdown));
  const yt = youtubeId(art.youtubeUrl);
  const desc = art.metaDesc || art.excerpt || plainText(art.bodyMarkdown || art.bodyHtml.replace(/<[^>]+>/g, ' '));
  const share = {
    line: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
    fb: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(art.title)}`,
  };
  // "next" = the next older article, wrapping to the newest at the end of the list
  const at = all.findIndex((a) => a.slug === art.slug);
  const next = all.length > 1 ? all[(at + 1) % all.length] : null;
  const absImg = (u?: string | null) => (!u ? undefined : u.startsWith('http') ? u : SITE + u);
  const ogImage = absImg(art.ogImageUrl || (isVideoUrl(art.coverImageUrl) ? null : art.coverImageUrl)) ?? null;

  const ld: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': art.schemaType || 'Article',
      headline: art.title,
      description: art.metaDesc || art.excerpt || undefined,
      image: !isVideoUrl(art.coverImageUrl) && absImg(art.coverImageUrl) ? [absImg(art.coverImageUrl)] : undefined,
      datePublished: art.publishedAt || undefined,
      dateModified: art.updatedAt,
      author: { '@type': 'Organization', name: 'PMN Digital' },
      publisher: { '@type': 'Organization', name: 'PMN Digital', logo: { '@type': 'ImageObject', url: `${SITE}/assets/logo-white.png` } },
      mainEntityOfPage: url,
      keywords: art.keyphrase || (art.tags.length ? art.tags.join(', ') : undefined),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'หน้าแรก', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'บทความ', item: `${SITE}/blog` },
        { '@type': 'ListItem', position: 3, name: art.title, item: url },
      ],
    },
  ];
  if (art.faq?.length) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: art.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }

  const takeaways: Raw | string = art.takeaways.length
    ? html`<section class="takeaways" aria-labelledby="tk"><h2 id="tk">ประเด็นสำคัญ · Key takeaways</h2><ul>${art.takeaways.map((t) => html`<li>${ico('i-check')}<span>${t}</span></li>`)}</ul></section>`
    : '';
  const tags = art.tags.length ? html`<div class="tags">${art.tags.map((t) => html`<span class="tag">#${t}</span>`)}</div>` : '';
  const faq = art.faq?.length
    ? html`<section class="art-faq faq" aria-labelledby="afq"><h2 id="afq">คำถามที่พบบ่อย</h2>${art.faq.map(
        (f) => html`<details><summary>${f.q}${ico('i-plus')}</summary><div class="faq__a"><p>${f.a}</p></div></details>`,
      )}</section>`
    : '';
  const ytBlock = yt
    ? html`<div class="art-yt"><div class="art-yt__frame"><iframe src="https://www.youtube-nocookie.com/embed/${yt}?rel=0" title="${art.title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div>`
    : '';
  const commentList = comments.length
    ? html`<ol class="comments__list">${comments.map(
        (m) => html`<li class="comment"><p class="comment__who"><b>${m.authorName}</b><span>${dateShort(m.createdAt)}</span></p><p>${m.body}</p></li>`,
      )}</ol>`
    : html`<p class="comments__empty">ยังไม่มีความคิดเห็นที่แสดง — เป็นคนแรกที่ร่วมแสดงความคิดเห็น</p>`;

  const main = html`
<article class="s-light" aria-labelledby="art-title">
  <header class="art-head">
    <nav class="crumbs" aria-label="breadcrumb"><a class="ulink" href="/">หน้าแรก</a><span aria-hidden="true">/</span><a class="ulink" href="/blog">บทความ</a><span aria-hidden="true">/</span><span>${cat.name}</span></nav>
    <h1 class="h1 art-head__title" id="art-title" data-line data-intro>${art.title}</h1>
    <div class="art-meta" data-fade data-intro data-delay=".4">
      <p class="art-meta__facts data"><span>PMN Digital</span>${art.publishedAt ? html`<span>${dateFull(art.publishedAt)}</span>` : ''}<span>${ico('i-clock')}อ่าน ${art.readingMins} นาที</span><span>${ico('i-eye')}${num(art.viewCount)} วิว</span></p>
      <p class="share"><span>แชร์</span>
        <a class="ulink" href="${share.line}" target="_blank" rel="noopener">LINE</a>
        <a class="ulink" href="${share.fb}" target="_blank" rel="noopener">Facebook</a>
        <a class="ulink" href="${share.x}" target="_blank" rel="noopener">X</a></p>
    </div>
  </header>
  ${art.coverImageUrl ? html`<div class="art-cover"><div class="art-cover__frame" data-wipe>${coverMedia(art.coverImageUrl)}</div></div>` : ''}
  ${ytBlock}
  <div class="art-body">
    <aside class="art-aside" aria-label="ความคืบหน้าการอ่าน"><div class="art-aside__sticky"><p class="caps mute">${cat.name}</p><div class="progress" data-progress><i></i></div><p class="data mute">อ่าน ${art.readingMins} นาที</p></div></aside>
    <div class="art-main">
      ${art.excerpt ? html`<p class="art-lead" data-line>${art.excerpt}</p>` : ''}
      ${takeaways}
      <div class="prose">${raw(body)}</div>
      ${tags}
      ${faq}
      <div class="art-cta"><p>สนใจวางระบบให้ธุรกิจของคุณ?</p><a class="badge badge--fill" href="/contact">ปรึกษาทีม PMN Digital ฟรี ${ARW}</a></div>
    </div>
  </div>
</article>
<section class="sec s-light" aria-labelledby="cm-title" style="padding-top:2rem">
  <div class="comments">
    <div class="comments__head"><h2 class="h3" id="cm-title">ความคิดเห็น</h2><p class="mute small">ความคิดเห็นจะแสดงหลังผ่านการอนุมัติจากผู้ดูแลระบบ</p></div>
    <div class="comments__body">
      ${commentList}
      ${commentForm(art.slug, art.title)}
    </div>
  </div>
</section>
${
  related.length
    ? html`<section class="sec s-dark" aria-labelledby="rel-title">
  <div class="sec-head"><h2 class="h2" id="rel-title" data-line>บทความที่เกี่ยวข้อง</h2><div class="sec-head__aside"><a class="arrow-link ulink" href="/blog">บทความทั้งหมด ${ARW}</a></div></div>
  <div class="index index--compact" data-index>${related.map((r) => indexRow(r, cats, false))}</div>
</section>`
    : ''
}
${
  next
    ? html`<a class="next s-light" href="/blog/${encodeURIComponent(next.slug)}" data-next>
  <span class="next__title">${next.title}</span>
  <span class="next__k caps"><span>บทความถัดไป · ${dateShort(next.publishedAt)}</span><span>เลื่อนต่อเพื่อไปต่อ หรือคลิก</span></span>
  <span class="next__bar" aria-hidden="true"><i></i></span>
</a>`
    : ''
}
`;
  // view counter: once per article per browser session (same contract as the old React page)
  const tail = raw(`<script>
(function(){try{var s=${JSON.stringify(art.slug).replace(/</g, '\\u003c')},k='pmn_viewed_'+s;if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1');
var p=new URLSearchParams(location.search);
fetch('/api/public/articles/'+encodeURIComponent(s)+'/view',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,
body:JSON.stringify({referrer:document.referrer||undefined,path:location.pathname,utmSource:p.get('utm_source')||undefined,utmMedium:p.get('utm_medium')||undefined,utmCampaign:p.get('utm_campaign')||undefined})}).catch(function(){});}catch(e){}})();
</script>
`);
  return renderPage({
    ctx: c,
    nav: 'blog',
    title: `${art.metaTitle || art.title} · PMN Digital`,
    description: desc,
    canonical: art.canonicalUrl || url,
    ogType: 'article',
    ogImage,
    noindex: art.noindex,
    ld,
    bodyClass: 'page-article',
    preview: true,
    main,
    tail,
  });
}

export async function renderNotFound(): Promise<string> {
  const c = await loadCtx();
  const main = html`
${phero({
  lines: ['ไม่พบหน้าที่คุณต้องการ'],
  lead: 'ลิงก์อาจถูกย้ายหรือพิมพ์ผิด ลองกลับไปที่หน้าแรก หรือดูบทความทั้งหมดของเรา',
  caps: '404',
  meta: 'Page not found',
  obj: 'obj-binder-sm.webp',
})}
<section class="sec s-dark sec--tight"><div class="footer__btns"><a class="badge badge--fill" href="/">กลับหน้าแรก ${ARW}</a><a class="badge" href="/blog">บทความทั้งหมด ${ARW}</a></div></section>
`;
  return renderPage({
    ctx: c,
    nav: null,
    title: 'ไม่พบหน้า · PMN Digital',
    description: 'ไม่พบหน้าที่คุณต้องการ',
    noindex: true,
    bodyClass: 'page-404',
    main,
  });
}
