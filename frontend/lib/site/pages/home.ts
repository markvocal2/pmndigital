import { getPublicPromotions, getServerStatus, type ServerStatus, type Promotion } from '@/lib/cms';
import { HERO_MARK } from '../brand';
import {
  clientArt,
  dateMid,
  getAllArticles,
  getCats,
  indexRow,
  loadCtx,
  num,
  pad2,
  portfolioWorks,
  SERVICE_ANCHORS,
  statStr,
  type SiteCtx,
} from '../data';
import { html, noBreaks, raw, withBreaks, type Raw } from '../html';
import { discountSwitch, plans, processSection, proof, railsBlock, registerForm, worksGrid } from '../sections';
import { ARW, ico, renderPage } from '../shell';

const SVC_OBJ: Record<string, string> = { db: 'obj-database-sm.webp', erp: 'obj-abacus-sm.webp', crm: 'obj-rolodex-sm.webp', code: 'obj-tape-sm.webp' };
const SVC_ANCHOR: Record<string, string> = { db: 'database', erp: 'erp', crm: 'crm', code: 'custom' };

function hero(c: SiteCtx): Raw {
  const h = c.home.hero;
  const s = c.home.stats;
  const proofLine = s.length >= 2 ? `${statStr(s[1])} องค์กร · ${statStr(s[0])} โปรเจกต์` : h.statNote;
  return html`<section class="hero" data-hero aria-label="PMN Digital">
  <div class="hero__media" aria-hidden="true"><video src="/assets/video/hero-order-loop.mp4" poster="/assets/img/scene-order.webp" muted loop playsinline preload="auto"></video></div>
  <canvas class="hero__paper" aria-hidden="true"></canvas>
  <div class="hero__ui">
    <div class="hero__intro">
      <h1 class="hero__title" data-line data-intro>${h.title1} ${h.highlight} <span class="nw">${h.title2}</span></h1>
      <p class="hero__lead" data-line data-intro data-delay=".15">${h.subtitle}</p>
      <div class="hero__ctas" data-fade data-intro data-delay=".55"><a class="badge badge--fill" href="#register">${h.ctaPrimary} ${ARW}</a></div>
    </div>
    <p class="hero__hint caps" aria-hidden="true">${ico('i-ur')}<span class="hint-mouse">ลากเมาส์ ดูระบบใต้กระดาษ</span><span class="hint-touch">ปัดนิ้วไปด้านข้าง ดูระบบใต้กระดาษ</span></p>
    <div class="hero__mark">${raw(HERO_MARK)}</div>
    <div class="hero__foot" data-fade data-intro data-delay="1">
      <p class="caps nw">Digital systems agency — Bangkok<span class="hide-sm"> · 100% online</span></p>
      <div class="hero__proof"><p class="data">${proofLine}</p><a class="badge badge--sm" href="/services">ดูบริการ ${ARW}</a></div>
    </div>
  </div>
</section>`;
}

const REEL = raw(`<section class="reel-sec s-dark" data-reel-sec aria-labelledby="reel-title">
  <div class="reel-sec__head"><h2 class="display reel-sec__statement" id="reel-title" data-line><span class="nw">จัดข้อมูล</span>​<span class="nw">ให้เป็นระเบียบ</span> <span class="nw">แล้วสร้างระบบ</span>​<span class="nw">ที่ทีมของคุณ</span>​<span class="nw">ใช้ได้จริงทุกวัน</span></h2></div>
  <div class="reel-sec__track">
    <div class="reel-sec__sticky">
      <div class="reel"><video src="/assets/video/reel-chaos-to-order.mp4" poster="/assets/img/scene-chaos.webp" muted playsinline preload="metadata" aria-hidden="true"></video></div>
      <div class="reel-sec__caption"><p class="mute">PMN ออกแบบ พัฒนา ติดตั้ง และดูแลให้แบบจบในทีมเดียว</p><div class="reel__meter" aria-hidden="true"><span class="caps mute">จัดระเบียบแล้ว</span><span class="odo-n">100</span></div></div>
    </div>
  </div>
</section>`);

function clients(c: SiteCtx): Raw {
  const logos = c.home.trustedLogos.filter((l) => l.logoUrl);
  if (!logos.length) return raw('');
  const [th, en] = c.home.trustedLabel.split(/\s+—\s+/);
  const items = logos.map((l) => {
    const a = clientArt(l);
    const img = html`<img src="${a.src}" alt="${a.alt}" width="240" height="120" loading="lazy" decoding="async">`;
    return l.url ? html`<li class="client"><a href="${l.url}" target="_blank" rel="noopener" data-no-transition>${img}</a></li>` : html`<li class="client">${img}</li>`;
  });
  return html`<section class="sec sec--tight s-dark clients" aria-labelledby="clients-title">
  <div class="clients__head"><h2 class="h3" id="clients-title" data-line>${th}</h2><p class="caps mute">${en ? en.charAt(0) + en.slice(1).toLowerCase() : 'Trusted by our clients'} <span class="data">( ${pad2(logos.length)} )</span></p></div>
  <ul class="clients__grid">${items}</ul>
</section>`;
}

function services(c: SiteCtx): Raw {
  const rows = c.home.services.map((s, i) => {
    const anchor = SVC_ANCHOR[s.icon] ?? SERVICE_ANCHORS[i] ?? '';
    const obj = SVC_OBJ[s.icon] ?? Object.values(SVC_OBJ)[i % 4];
    return html`<li><a class="svc__row" href="/services${anchor ? '#' + anchor : ''}">
  <span class="svc__th">${s.th}</span>
  <span class="svc__en caps">${s.t}</span>
  <span class="svc__desc">${s.d}</span>
  <span class="svc__obj" aria-hidden="true"><img src="/assets/img/${obj}" alt="" width="560" height="560" loading="lazy" decoding="async"></span>
</a></li>`;
  });
  return html`<section class="sec s-dark" id="services" aria-labelledby="svc-title">
  <div class="sec-head"><h2 class="h2" id="svc-title" data-line>บริการที่เราดำเนินการให้<span class="count">( ${pad2(c.home.services.length)} )</span></h2><div class="sec-head__aside"><a class="arrow-link ulink" href="/services">ดูบริการทั้งหมด ${ARW}</a></div></div>
  <ol class="svc-list">${rows}</ol>
</section>`;
}

function why(c: SiteCtx): Raw {
  const w = c.home.why;
  const values = w.bento.map(
    (b) => html`<li class="value"><span class="value__dot" data-scale data-delay=".2"></span><h3>${b.h}</h3><p>${b.d}</p></li>`,
  );
  return html`<section class="sec s-dark why" id="why" aria-labelledby="why-title">
  <div class="why__top">
    <h2 class="h2" id="why-title" data-line>${withBreaks(w.title)}</h2>
    <p class="why__manifesto" data-line>${w.subtitle}</p>
  </div>
  <div class="why__imgs" aria-hidden="true">
    <div class="why__img why__img--a" data-parallax="-100" data-scrub="1"><img src="/assets/img/obj-abacus.webp" alt="" width="1200" height="1200" loading="lazy" decoding="async"></div>
    <div class="why__img why__img--b" data-parallax="-60" data-scrub="2"><img src="/assets/img/obj-receipt.webp" alt="" width="1200" height="1200" loading="lazy" decoding="async"></div>
    <div class="why__img why__img--c" data-parallax="-160" data-scrub="2.5"><img src="/assets/img/obj-stamp-sm.webp" alt="" width="560" height="560" loading="lazy" decoding="async"></div>
  </div>
  <div class="values">
    <ul class="values__list">${values}</ul>
  </div>
  ${railsBlock(c.home, w.techTitle, w.techDesc)}
</section>`;
}

/* The steel-factory case study, told as paperwork being stamped "solved". */
const CHAOS = raw(`<section class="chaos" data-chaos aria-labelledby="chaos-title">
  <div class="chaos__stage">
    <div class="chaos__bg" aria-hidden="true"><img src="/assets/img/scene-paper.webp" alt="" width="2200" height="1238" loading="lazy" decoding="async"></div>
    <h2 class="sr-only" id="chaos-title">จากเอกสารกระดาษ สู่ระบบดิจิทัล — กรณีศึกษาโรงงานเหล็ก</h2>
    <ol class="chaos__table" aria-label="ปัญหาเดิม ที่ระบบแก้แล้ว"><li class="slip"><span class="slip__t">ใบงานกระดาษหายบ่อย</span><span class="slip__stamp">แก้แล้ว</span></li><li class="slip"><span class="slip__t">คีย์ข้อมูลซ้ำหลายรอบ</span><span class="slip__stamp">แก้แล้ว</span></li><li class="slip"><span class="slip__t">รายงานล่าช้าหลายวัน</span><span class="slip__stamp">แก้แล้ว</span></li><li class="slip"><span class="slip__t">ตัวเลขไม่ตรง</span><span class="slip__stamp">แก้แล้ว</span></li><li class="slip"><span class="slip__t">ผู้บริหารไม่เห็นภาพรวมการผลิต</span><span class="slip__stamp">แก้แล้ว</span></li><li class="slip"><span class="slip__t">เอกสารกระดาษนับพันใบต่อเดือน</span><span class="slip__stamp">แก้แล้ว</span></li></ol>
    <div class="chaos__final">
      <p class="chaos__line">หลังใช้ระบบ ใบงานอยู่ในมือถือ ผู้บริหารดู dashboard ได้ทันที และเวลางานเอกสารลดลง <span data-odo="40%" data-odo-scrub>40%</span></p>
      <a class="arrow-link ulink chaos__more" href="/blog/case-steel-factory">กรณีศึกษา: โรงงานเหล็ก <svg class="ico arw" viewBox="0 0 24 14" aria-hidden="true"><line x1="1" y1="7" x2="22.5" y2="7"/><path d="M16.5 1.5L22.5 7l-6 5.5"/></svg></a>
    </div>
  </div>
</section>`);

function works(c: SiteCtx): Raw {
  const all = portfolioWorks(c.home);
  return html`<section class="sec s-dark" id="work" aria-labelledby="work-title">
  <div class="sec-head"><h2 class="h2" id="work-title" data-line>ผลงานล่าสุด</h2><div class="sec-head__aside"><a class="arrow-link ulink" href="/portfolio">ดูผลงานทั้งหมด <span class="data">( ${pad2(all.length)} )</span> ${ARW}</a></div></div>
  ${worksGrid(all.slice(0, 4), 'works-home')}
  <div class="works-foot"><p class="illus-note">ภาพประกอบเป็นงานศิลป์เชิงสัญลักษณ์ ไม่ใช่ภาพหน้าจอระบบของลูกค้า</p><a class="badge" href="/portfolio">ดูผลงานทั้งหมด ${ARW}</a></div>
</section>`;
}

function backupText(s: ServerStatus): string {
  if (s.backupOk) {
    const h = s.backupAgeHours;
    if (h == null) return 'ครบทุกระบบ';
    return h < 1 ? 'ไม่ถึง 1 ชม.' : h < 24 ? `${Math.round(h)} ชม. ก่อน` : `${Math.floor(h / 24)} วันก่อน`;
  }
  return s.backupStacks > 0 ? `${s.backupStacks} ระบบ` : 'ครบทุกระบบ';
}

function consoleSec(s: ServerStatus | null): Raw {
  if (!s) return raw('');
  const status = s.operational ? 'Operational' : 'Degraded';
  const up = `${s.uptimePct.toFixed(2)}%`;
  const days = s.days.length ? s.days : [s.uptimePct];
  const bars = days.map((d) => html`<i data-h="${Math.max(0.08, Math.min(1, d / 100)).toFixed(2).replace(/\.?0+$/, '')}"></i>`);
  const allUp = days.every((d) => d >= 100);
  const when = dateMid(s.updatedAt);
  const f2 = (p: number) => (Math.max(0, Math.min(100, p)) / 100).toFixed(2).replace(/^0/, '');
  return html`<section class="console-sec" data-console aria-labelledby="console-title">
  <div class="console-sec__stage">
    <div class="room">
      <img src="/assets/img/scene-room.webp" alt="" width="2560" height="1440" loading="lazy" decoding="async" aria-hidden="true">
      <div class="room__screen">
        <div class="console">
          <div class="console__bar"><span class="console__id">pmn-console <span class="console__live"><i></i>LIVE</span></span><div class="console__tabs" role="tablist" aria-label="สถานะระบบของ PMN"><button type="button" role="tab" id="ct-stable" aria-controls="cp-stable" aria-selected="true" tabindex="0">เสถียร</button><button type="button" role="tab" id="ct-speed" aria-controls="cp-speed" aria-selected="false" tabindex="-1">ความเร็ว</button><button type="button" role="tab" id="ct-scale" aria-controls="cp-scale" aria-selected="false" tabindex="-1">สเกล</button><button type="button" role="tab" id="ct-secure" aria-controls="cp-secure" aria-selected="false" tabindex="-1">ปลอดภัย</button></div></div>
          <div class="console__body">
<div class="cpanel is-on" role="tabpanel" id="cp-stable" aria-labelledby="ct-stable">
  <div class="cpanel__big"><span class="cpanel__label">Uptime</span><span class="cpanel__value">${up}</span><span class="cpanel__text">ความพร้อมใช้งาน ${days.length} วันล่าสุด${allUp ? ' ไม่มีช่วงหยุดให้บริการ' : ''}</span></div>
  <div class="cpanel__stats"><div class="cpanel__stat"><span class="cpanel__label">Response</span><b>${s.responseMs}ms</b></div><div class="cpanel__stat"><span class="cpanel__label">Status</span><b>${status}</b></div></div>
  <div class="cpanel__bars" aria-label="ความพร้อมใช้งาน ${days.length} วัน ${up}">${bars}</div>
</div>
<div class="cpanel" role="tabpanel" id="cp-speed" aria-labelledby="ct-speed">
  <div class="cpanel__big"><span class="cpanel__label">Response</span><span class="cpanel__value">${s.responseMs}<small style="font-size:.4em">ms</small></span><span class="cpanel__text">ตอบสนองเร็ว และยังเหลือกำลังอีกมากพร้อมรองรับการเติบโตของธุรกิจคุณ</span></div>
  <div class="cpanel__stats"><div class="cpanel__stat"><span class="cpanel__label">CPU ว่าง</span><b>${Math.round(s.cpuHeadroomPct)}%</b></div><div class="cpanel__stat"><span class="cpanel__label">RAM ว่าง</span><b>${Math.round(s.memHeadroomPct)}%</b></div></div>
  <div class="cpanel__meter"><span class="cpanel__label">กำลังเหลือรองรับโหลด</span><div><i data-w="${f2(s.cpuHeadroomPct)}"></i></div><div><i data-w="${f2(s.memHeadroomPct)}"></i></div></div>
</div>
<div class="cpanel" role="tabpanel" id="cp-scale" aria-labelledby="ct-scale">
  <div class="cpanel__big"><span class="cpanel__label">ต่อเนื่อง</span><span class="cpanel__value">${num(s.continuousDays)} วัน</span><span class="cpanel__text">ทุกบริการถูกมอนิเตอร์ตลอด 24 ชม. รันต่อเนื่องไม่สะดุดมากว่า ${num(s.continuousDays)} วัน</span></div>
  <div class="cpanel__stats"><div class="cpanel__stat"><span class="cpanel__label">บริการ</span><b>${s.servicesHealthy}/${s.servicesTotal}</b></div><div class="cpanel__stat"><span class="cpanel__label">Status</span><b>${status}</b></div></div>
  <div class="cpanel__bars">${bars}</div>
</div>
<div class="cpanel" role="tabpanel" id="cp-secure" aria-labelledby="ct-secure">
  <div class="cpanel__big"><span class="cpanel__label">บล็อกภัย</span><span class="cpanel__value">${num(s.threatsBlocked)}</span><span class="cpanel__text">เฝ้าระวังและบล็อกภัยคุกคามเชิงรุกตลอด 24 ชม. ระบบของคุณได้รับการปกป้องและสำรองข้อมูลอย่างเป็นระบบ</span></div>
  <div class="cpanel__stats"><div class="cpanel__stat"><span class="cpanel__label">สำรองข้อมูล</span><b>${backupText(s)}</b></div><div class="cpanel__stat"><span class="cpanel__label">เข้ารหัส</span><b>TLS</b></div></div>
</div></div>
          <span class="console__stamp">live · ${when}</span>
        </div>
      </div>
    </div>
    <div class="console-sec__copy">
      <h2 class="h2" id="console-title">ทุกบริการถูกมอนิเตอร์ตลอด 24 ชม.</h2>
      <p>หน้าจอ pmn-console ที่เราใช้เฝ้าระบบของเราเอง ตัวเลข ณ ${when} — <a class="ulink" href="/status">ดูสถานะระบบ</a></p>
    </div>
  </div>
</section>`;
}

function pricing(c: SiteCtx): Raw {
  return html`<section class="sec s-dark" id="pricing" aria-labelledby="price-title">
  <div class="sec-head"><h2 class="h2" id="price-title" data-line>แพ็กเกจที่ยืดหยุ่นตามธุรกิจ</h2><div class="sec-head__aside">${discountSwitch('plans-home')}</div></div>
  ${plans(c.home, 'plans-home', () => '/pricing', 'ตามขอบเขตงาน')}
</section>`;
}

/* Live promotions from /admin/promotions (the section only exists while one is running). */
function promotions(list: Promotion[]): Raw {
  if (!list.length) return raw('');
  const cards = list.slice(0, 3).map((p) => {
    const price =
      p.finalPrice != null
        ? html`<p class="plan__amount">฿${num(p.finalPrice)}</p><p class="plan__was">${p.originalPrice != null ? `฿${num(p.originalPrice)}` : ''}</p><p class="plan__unit">${p.priceUnit ?? ''}</p>`
        : html`<p class="plan__amount en">${p.badge ?? 'Promo'}</p><p class="plan__was" aria-hidden="true"></p><p class="plan__unit">${p.subtitle ?? ''}</p>`;
    return html`<article class="plan${p.featured ? ' plan--pro' : ''}">
  <div class="plan__top"><h3 class="plan__name">${p.title}</h3>${p.featured ? raw('<span class="plan__flag">แนะนำ</span>') : ''}</div>
  <p class="plan__who">${p.description ?? p.subtitle ?? ''}</p>
  <div class="plan__price">${price}</div>
  ${p.couponCode ? html`<ul class="plan__feats"><li>${ico('i-check')}<span>โค้ด ${p.couponCode}</span></li></ul>` : ''}
  <a class="badge${p.featured ? ' badge--fill' : ''}" href="${p.ctaUrl || '/promotions'}">${p.ctaText || 'ดูรายละเอียด'} ${ARW}</a>
</article>`;
  });
  return html`<section class="sec s-dark" id="promotions" aria-labelledby="promo-title">
  <div class="sec-head"><h2 class="h2" id="promo-title" data-line>โปรเด็ดประจำเดือน &amp; แคมเปญพิเศษ</h2><div class="sec-head__aside"><a class="arrow-link ulink" href="/promotions">ดูโปรโมชันทั้งหมด ${ARW}</a></div></div>
  <div class="plans">${cards}</div>
</section>`;
}

function register(c: SiteCtx): Raw {
  const r = c.home.register;
  const perks = r.privileges.map((p) => html`<li class="perk"><b>${p.t}</b><span>${p.d}</span></li>`);
  return html`<section class="sec s-light" id="register" aria-labelledby="reg-title">
  <div class="register__grid">
    <div class="register__copy">
      <h2 class="h2" id="reg-title" data-line>${withBreaks(r.title)}</h2>
      <p class="lead mute" data-line>${r.subtitle}</p>
      <ol class="perks">${perks}</ol>
      <div class="perk__obj" data-parallax="-80" aria-hidden="true"><img src="/assets/img/obj-stamp-sm.webp" alt="" width="560" height="560" loading="lazy" decoding="async"></div>
    </div>
    ${registerForm(c.home)}
  </div>
</section>`;
}

function testimonials(c: SiteCtx): Raw {
  if (!c.home.testimonials.length) return raw('');
  const qs = c.home.testimonials.map(
    (q) => html`<figure class="quote"><figcaption class="quote__who"><b>${q.n}</b><span>${q.r.replace(/,\s*/, ' · ')}</span></figcaption><blockquote data-line>“${q.q}”</blockquote></figure>`,
  );
  return html`<section class="sec s-dark" id="testimonials" aria-labelledby="t-title">
  <div class="sec-head"><h2 class="h2" id="t-title" data-line>ลูกค้าพูดถึงเรา</h2><p class="sec-head__note">จากลูกค้าจริงของเรา</p></div>
  <div class="quotes">${qs}</div>
</section>`;
}

export async function renderHome(): Promise<string> {
  const [c, all, cats, status, promos] = await Promise.all([
    loadCtx(),
    getAllArticles('latest'),
    getCats(),
    getServerStatus(),
    getPublicPromotions(),
  ]);
  const h = c.home;
  const latest = all.slice(0, 8);
  const total = all.length;
  const articles = latest.length
    ? html`<section class="sec s-light" id="articles" aria-labelledby="a-title">
  <div class="sec-head"><h2 class="h2" id="a-title" data-line>บทความล่าสุด</h2><div class="sec-head__aside"><a class="arrow-link ulink" href="/blog">อ่านบทความทั้งหมด <span class="data">( ${pad2(total)} )</span> ${ARW}</a></div></div>
  <div class="index index--compact" data-index>${latest.map((a) => indexRow(a, cats, false))}</div>
</section>`
    : '';
  const main = html`
${hero(c)}

${REEL}

${clients(c)}

${services(c)}

${proof(h.stats.map((s) => ({ v: statStr(s), l: s.label })), 'PMN Digital ในตัวเลข', 's-dark')}

${why(c)}

${CHAOS}

${processSection(h)}

${works(c)}

${consoleSec(status)}

${promotions(promos)}

${pricing(c)}

${register(c)}

${testimonials(c)}

${articles}
`;
  // SEO set in /admin/home wins, then site defaults from /admin/settings
  const title = noBreaks(c.seo.metaTitle || c.settings?.defaultMetaTitle || 'PMN Digital — รับออกแบบระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์เฉพาะทาง');
  return renderPage({
    ctx: c,
    nav: 'home',
    title,
    description:
      c.seo.metaDesc || c.settings?.defaultMetaDesc || 'PMN Digital เอเจนซีออกแบบและพัฒนาระบบฐานข้อมูล ERP, CRM และซอฟต์แวร์สั่งทำแบบครบวงจร',
    ogImage: c.seo.ogImage || c.settings?.ogDefaultUrl || null,
    canonical: '/',
    bodyClass: 'page-home',
    loader: true,
    preview: true,
    main,
  });
}
