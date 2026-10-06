import { getPublicPromotions, getServerStatus, type ServerStatus, type Promotion } from '@/lib/cms';
import { defaultHomeContent } from '@/lib/home-content';
import { CHAT_MARK, GLASS_WM, PMN_SLOT, REEL_INK } from '../brand';
import {
  clientArt,
  dateMid,
  designOr,
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
import { discountSwitch, ILLUS_NOTE, plans, processSection, railsBlock, registerForm, worksGrid } from '../sections';
import { ARW, ASSET_V, ico, renderPage } from '../shell';

const SVC_OBJ: Record<string, string> = { db: 'svc-database-sm.webp', erp: 'svc-erp-sm.webp', crm: 'svc-crm-sm.webp', code: 'svc-custom-sm.webp' };
/* Why-PMN card icons, in the order of the default four reasons (more reasons reuse them). */
const WHY_ICONS = ['why-online-sm.webp', 'why-secure-sm.webp', 'why-ontime-sm.webp', 'why-support-sm.webp'];
const SVC_ANCHOR: Record<string, string> = { db: 'database', erp: 'erp', crm: 'crm', code: 'custom' };

function hero(c: SiteCtx): Raw {
  const h = c.home.hero;
  const s = c.home.stats;
  const proofLine = s.length >= 2 ? `${statStr(s[1])} องค์กร · ${statStr(s[0])} โปรเจกต์` : h.statNote;
  // the big PMN is a glass of water over the IT city: main.js fills the letters from the rim paths
  return html`<section class="hero" data-hero aria-label="PMN Digital">
  <div class="hero__media" aria-hidden="true"><video src="/assets/video/hero-city-loop.mp4" poster="/assets/img/scene-city.webp" muted loop playsinline preload="auto"></video></div>
  <canvas class="hero__paper" aria-hidden="true"></canvas>
  <div class="hero__ui">
    <div class="hero__intro">
      <div class="hero__head">
        <h1 class="hero__title" data-line data-intro>${h.title1} ${h.highlight} <span class="nw">${h.title2}</span></h1>
        <div class="hero__meta" data-fade data-intro data-delay="1"><p class="caps nw">Digital agency<span class="hide-sm"> · 100% online</span></p><p class="data">${proofLine}</p></div>
      </div>
      <div class="hero__side">
        <p class="hero__lead" data-line data-intro data-delay=".15">${h.subtitle}</p>
        <div class="hero__ctas" data-fade data-intro data-delay=".55"><a class="badge badge--fill" href="#register">${h.ctaPrimary} ${ARW}</a><a class="badge" href="/services">${designOr(h.ctaSecondary, defaultHomeContent.hero.ctaSecondary, 'ดูบริการ')} ${ARW}</a></div>
      </div>
    </div>
    <div class="hero__mark">${raw(GLASS_WM)}</div>
  </div>
</section>`;
}

/* "[PMN] ยินดีช่วยวางระบบให้ธุรกิจของคุณ…" — the wordmark sits in the sentence, "คุณ" rotates through
   you/您/당신/Sie, and the PMN stamp presses onto the story reel. */
const REEL = raw(`<section class="reel-sec s-dark" data-nav="เราช่วยอะไรได้" data-reel-sec aria-labelledby="reel-title">
  <div class="reel-sec__head"><h2 class="display reel-sec__statement" id="reel-title" data-line aria-label="PMN ยินดีช่วยวางระบบให้ธุรกิจของคุณ ตั้งแต่จัดการข้อมูล จนทั้งองค์กรใช้งานได้ง่ายทุกวัน"><span class="pmn-slot" aria-hidden="true">${PMN_SLOT}</span>ยินดีช่วย<span class="nw">วางระบบ</span>ให้<span class="nw">ธุรกิจของ<span class="rotword" data-rotate="you|您|당신|Sie">คุณ</span></span> ตั้งแต่<span class="nw">จัดการข้อมูล</span> <span class="nw">จนทั้ง</span><span class="nw">องค์กรใช้งาน</span><span class="nw">ได้ง่ายทุกวัน</span></h2></div>
  <div class="reel-sec__track">
    <div class="reel-sec__sticky">
      <div class="reel"><video src="/assets/video/reel-pmn-story.mp4" poster="/assets/img/scene-story-start.webp" data-focus=".5" data-frames="/assets/video/reel-frames/f{n}.webp?v=${ASSET_V}" data-frame-count="152" data-portrait-src="/assets/video/reel-pmn-story-portrait.mp4?v=${ASSET_V}" data-portrait-poster="/assets/img/scene-story-start-portrait.webp?v=${ASSET_V}" data-portrait-frames="/assets/video/reel-frames-portrait/f{n}.webp?v=${ASSET_V}" data-portrait-count="152" muted playsinline preload="metadata" aria-hidden="true"></video></div>
      <div class="reel__stamp" aria-hidden="true">
        <img class="reel__stamp-tool" src="/assets/img/obj-stamp-sm.webp" alt="" width="560" height="560" loading="lazy" decoding="async">
        <div class="reel__stamp-print">
          ${REEL_INK}
          <span class="reel__stamp-label caps">เชื่อมทุกระบบ</span>
        </div>
      </div>
      <div class="reel-sec__caption"><p class="mute">PMN ออกแบบ พัฒนา ติดตั้ง และดูแลให้แบบจบในทีมเดียว</p><div class="reel__meter" aria-hidden="true"><span class="caps mute">ระบบพร้อมใช้งาน</span><span class="odo-n">100</span></div></div>
    </div>
  </div>
</section>`);

function clients(c: SiteCtx): Raw {
  const logos = c.home.trustedLogos.filter((l) => l.logoUrl);
  if (!logos.length) return raw('');
  const [th] = c.home.trustedLabel.split(/\s+—\s+/);
  // each logo twice: a grey "ink" print, and the colour original revealed on hover
  const items = logos.map((l) => {
    const a = clientArt(l);
    const imgs = html`<img class="client__ink" src="${a.src}" alt="${a.alt}" width="${a.w}" height="${a.h}" loading="lazy" decoding="async" style="--h:${a.hPct}"><img class="client__color" src="${a.src}" alt="" width="${a.w}" height="${a.h}" loading="lazy" decoding="async" style="--h:${a.hPct}" aria-hidden="true">`;
    return l.url ? html`<li class="client"><a href="${l.url}" target="_blank" rel="noopener" data-no-transition>${imgs}</a></li>` : html`<li class="client">${imgs}</li>`;
  });
  return html`<section class="sec sec--tight s-dark clients" aria-labelledby="clients-title">
  <div class="clients__head"><h2 class="h3" id="clients-title" data-line>${th}</h2></div>
  <ul class="clients__grid">${items}</ul>
  ${raw('<svg class="sr-only" aria-hidden="true" focusable="false"><filter id="ink-grey" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="gamma" exponent="2"/><feFuncG type="gamma" exponent="2"/><feFuncB type="gamma" exponent="2"/></feComponentTransfer></filter></svg>')}
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

/* "PMN in numbers" as four bento cards; each card illustrates its figure. Labels and figures come
   from the CMS stats (in their order); the small notes and pictures are design copy. */
const BENTO_NOTES = ['ERP · CRM · ฐานข้อมูล · ซอฟต์แวร์สั่งทำ', 'ทั้งภาครัฐและเอกชน', 'ออกแบบ พัฒนา และดูแลระบบ', 'ระบบที่ดูแล ทำงานต่อเนื่องตลอด 24 ชม.'];
const BENTO_THUMBS = ['work-manufacturing.webp', 'work-fintech.webp', 'work-logistics.webp'];
const BENTO_LOGOS = [/worldwide/i, /^dga$/i, /kmutnb|มจพ/i, /toyota/i, /กรุงศรี|krungsri/i, /huawei/i];

function bento(c: SiteCtx): Raw {
  const stats = c.home.stats;
  const logos = (() => {
    const all = c.home.trustedLogos.filter((l) => l.logoUrl);
    const picked = BENTO_LOGOS.map((re) => all.find((l) => re.test(l.name.trim()))).filter((l): l is (typeof all)[number] => !!l);
    return (picked.length >= 3 ? picked : all).slice(0, 6);
  })();
  const years = Math.max(1, Math.min(12, Math.round(stats[2]?.target ?? 8)));
  const visuals: (Raw | string)[] = [
    html`<div class="bento__thumbs" aria-hidden="true">${BENTO_THUMBS.map((f) => html`<span class="bento__thumb"><img src="/assets/img/${f}" alt="" width="1800" height="1200" loading="lazy" decoding="async"></span>`)}</div>`,
    html`<div class="bento__logos">${logos.map((l) => {
      const a = clientArt(l);
      return html`<span class="bento__logo"><img src="${a.src}" alt="${a.alt}" width="240" height="120" loading="lazy" decoding="async"></span>`;
    })}</div>`,
    html`<div class="bento__ticks" aria-hidden="true">${Array.from({ length: years }, (_v, i) => (i === years - 1 ? raw('<i class="is-now"></i>') : raw('<i></i>')))}</div>`,
    raw(`<div class="bento__bars" aria-hidden="true">${'<i></i>'.repeat(60)}</div>`),
  ];
  const cards = stats.slice(0, 4).map((s, i) => {
    const wide = i === 0 || i === 3;
    return html`<article class="bento__card ${wide ? 'bento__card--wide' : ''}" data-fade><p class="bento__label">${s.label}</p><p class="bento__num"><span data-odo="${statStr(s)}">${statStr(s)}</span></p><p class="bento__note">${BENTO_NOTES[i]}</p>${visuals[i]}</article>`;
  });
  return html`<section class="sec sec--tight s-dark" aria-label="PMN Digital ในตัวเลข"><div class="bento">${cards}</div></section>`;
}

function why(c: SiteCtx): Raw {
  const w = c.home.why;
  const cards = w.bento.map(
    (b, i) =>
      html`<li class="why-card" data-why-card><span class="why-card__no data">${pad2(i + 1)}</span><span class="why-card__icon" aria-hidden="true"><img src="/assets/img/${WHY_ICONS[i % WHY_ICONS.length]}" alt="" width="560" height="560" loading="lazy" decoding="async"></span><h3>${b.h}</h3><p>${b.d}</p></li>`,
  );
  // manifesto types itself out: the ghost holds the final layout, the live line is filled by main.js
  return html`<section class="sec s-dark why" id="why" aria-labelledby="why-title">
  <div class="why__top">
    <h2 class="h2" id="why-title" data-line>${withBreaks(w.title)}</h2>
    <p class="why__manifesto type" data-type><span class="sr-only">${w.subtitle}</span><span class="type__ghost" aria-hidden="true">${w.subtitle}</span><span class="type__live" aria-hidden="true"></span></p>
  </div>
  <ol class="why-cards">${cards}</ol>
  ${railsBlock(c.home, w.techTitle, w.techDesc)}
</section>`;
}

/* The steel-factory case study, told as paperwork being stamped "solved". */
const CHAOS = raw(`<section class="chaos" data-nav="ก่อน–หลังมีระบบ" data-chaos aria-labelledby="chaos-title">
  <div class="chaos__stage">
    <div class="chaos__bg" aria-hidden="true"><img src="/assets/img/scene-paper.webp" alt="" width="2200" height="1238" loading="lazy" decoding="async"></div>
    <h2 class="sr-only" id="chaos-title">จากเอกสารกระดาษ สู่ระบบดิจิทัล — กรณีศึกษาโรงงานเหล็ก</h2>
    <div class="chaos__head" aria-hidden="true"><p class="caps">กรณีศึกษา · โรงงานเหล็ก</p><p class="chaos__title">จากเอกสารกระดาษ<br>สู่ระบบดิจิทัล</p></div>
    <ol class="chaos__table" aria-label="ปัญหาเดิม ที่ระบบแก้แล้ว"><li class="slip"><div class="slip__head"><span class="slip__no">ปัญหา 01</span><span class="slip__ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M10 12.2a2 2 0 1 1 2.8 1.9c-.5.3-.8.6-.8 1.1v.4"/><path d="M12 18.3h.01"/></svg></span></div><span class="slip__t">ใบงานกระดาษหายบ่อย</span><span class="slip__stamp">แก้แล้ว</span></li><li class="slip"><div class="slip__head"><span class="slip__no">ปัญหา 02</span><span class="slip__ic" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></span></div><span class="slip__t">คีย์ข้อมูลซ้ำหลายรอบ</span><span class="slip__stamp">แก้แล้ว</span></li><li class="slip"><div class="slip__head"><span class="slip__no">ปัญหา 03</span><span class="slip__ic" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span></div><span class="slip__t">รายงานล่าช้าหลายวัน</span><span class="slip__stamp">แก้แล้ว</span></li><li class="slip"><div class="slip__head"><span class="slip__no">ปัญหา 04</span><span class="slip__ic" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 10h8M8 14h8M14 7l-4 10"/></svg></span></div><span class="slip__t">ตัวเลขไม่ตรง</span><span class="slip__stamp">แก้แล้ว</span></li><li class="slip"><div class="slip__head"><span class="slip__no">ปัญหา 05</span><span class="slip__ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 8.5 4 9.5 6a12 12 0 0 1-2.4 3.2M6.6 7.6C4.6 8.9 3.2 10.7 2.5 12c1 2 4.5 6 9.5 6 1.6 0 3-.4 4.3-1"/><path d="M9.9 10a3 3 0 0 0 4.1 4.2"/></svg></span></div><span class="slip__t">ผู้บริหารไม่เห็นภาพรวมการผลิต</span><span class="slip__stamp">แก้แล้ว</span></li><li class="slip"><div class="slip__head"><span class="slip__no">ปัญหา 06</span><span class="slip__ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3l9 4.5-9 4.5-9-4.5z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5l9 4.5 9-4.5"/></svg></span></div><span class="slip__t">เอกสารกระดาษนับพันใบต่อเดือน</span><span class="slip__stamp">แก้แล้ว</span></li></ol>
    <div class="chaos__final">
      <p class="chaos__line">หลังใช้ระบบ ใบงานอยู่ในมือถือ ผู้บริหารดู dashboard ได้ทันที และเวลางานเอกสารลดลง <span data-odo="40%" data-odo-scrub>40%</span></p>
      <a class="arrow-link ulink chaos__more" href="/blog/case-steel-factory">กรณีศึกษา: โรงงานเหล็ก <svg class="ico arw" viewBox="0 0 24 14" aria-hidden="true"><line x1="1" y1="7" x2="22.5" y2="7"/><path d="M16.5 1.5L22.5 7l-6 5.5"/></svg></a>
    </div>
  </div>
</section>`);

function works(c: SiteCtx): Raw {
  const all = portfolioWorks(c.home);
  return html`<section class="sec s-dark proof-a" id="work" aria-labelledby="work-title">
  <div class="sec-head"><h2 class="h2" id="work-title" data-line>ผลงานล่าสุด</h2><div class="sec-head__aside"><a class="arrow-link ulink" href="/portfolio">ดูผลงานทั้งหมด <span class="data">( ${pad2(all.length)} )</span> ${ARW}</a></div></div>
  ${worksGrid(all.slice(0, 4), 'works-home')}
  <div class="works-foot"><p class="illus-note">${ILLUS_NOTE}</p><a class="badge" href="/portfolio">ดูผลงานทั้งหมด ${ARW}</a></div>
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
  return html`<section class="console-sec" data-nav="มอนิเตอร์ 24 ชม." data-console aria-labelledby="console-title">
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
  return html`<section class="sec s-dark" data-nav="แพ็กเกจราคา" id="pricing" aria-labelledby="price-title">
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
  return html`<section class="sec s-light" data-nav="ลงทะเบียนรับสิทธิ์" id="register" aria-labelledby="reg-title">
  <div class="register__grid">
    <div class="register__copy">
      <h2 class="h2" id="reg-title" data-line>${withBreaks(r.title)}</h2>
      <p class="lead mute" data-line>${r.subtitle}</p>
      <ol class="perks">${perks}</ol>
      <div class="perk__obj" data-parallax="-80" aria-hidden="true"><img src="/assets/img/perk-gift-sm.webp" alt="" width="560" height="560" loading="lazy" decoding="async"></div>
    </div>
    ${registerForm(c.home)}
  </div>
</section>`;
}

/* PMN's reply under each review in the chat. The design wrote one per default review; a review
   added in /admin/home gets the plain thank-you. */
const CHAT_REPLIES: Record<string, string> = {
  'ทีม PMN เข้าใจปัญหาหน้างานจริง ระบบ ERP ที่ได้ช่วยให้เราปิดบัญชีเร็วขึ้นมาก': 'ขอบคุณที่ไว้ใจ PMN ครับ ดีใจที่ช่วยให้ปิดบัญชีได้เร็วขึ้น',
  'ทำงานออนไลน์ตลอด เห็นความคืบหน้าทุกสัปดาห์ ส่งมอบตรงเวลาแบบที่หาได้ยาก': 'ขอบคุณที่ทำงานไปด้วยกันครับ',
  'ฐานข้อมูลที่เคยช้ามาก หลังปรับใหม่เร็วขึ้นหลายเท่า คุ้มค่ามาก': 'ยินดีมากครับ ระบบเร็วขึ้น ทีมก็ทำงานสบายขึ้น',
};
const DOTS = raw('<span class="msg__dots" aria-hidden="true"><i></i><i></i><i></i></span>');

function testimonials(c: SiteCtx): Raw {
  if (!c.home.testimonials.length) return raw('');
  const log = c.home.testimonials.map((q) => {
    const initial = Array.from(q.n.replace(/^คุณ\s*/, '').trim())[0] ?? '';
    const reply = CHAT_REPLIES[q.q.trim()] ?? 'ขอบคุณที่ไว้ใจ PMN ครับ';
    // role only: the design leaves the company names off
    return html`<li class="msg msg--in" data-msg><span class="msg__av" aria-hidden="true"><span>${initial}</span></span><figure class="msg__body"><figcaption class="msg__who"><b>${q.n}</b><span>${q.r.split(',')[0].trim()}</span></figcaption><blockquote class="msg__bubble">${q.q}</blockquote></figure>${DOTS}</li><li class="msg msg--out" data-msg><div class="msg__body"><p class="msg__bubble">${reply}</p><span class="msg__meta">อ่านแล้ว <span aria-hidden="true">✓✓</span></span></div>${DOTS}</li>`;
  });
  return html`<section class="sec s-dark proof-b" id="testimonials" aria-labelledby="t-title">
  <div class="sec-head"><h2 class="h2" id="t-title" data-line>ลูกค้าพูดถึงเรา</h2><p class="sec-head__note">จากลูกค้าจริงของเรา</p></div>
  <div class="chat-wrap"><div class="chat" data-chat><div class="chat__bar"><span class="chat__logo" aria-hidden="true">${raw(CHAT_MARK)}</span><div class="chat__title"><b>ลูกค้า PMN</b><span class="chat__status"><i aria-hidden="true"></i>ออนไลน์</span></div></div><ol class="chat__log">${log}</ol></div></div>
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

${bento(c)}

${why(c)}

${CHAOS}

${processSection(h)}

${works(c)}

${testimonials(c)}

${consoleSec(status)}

${promotions(promos)}

${pricing(c)}

${register(c)}

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
    preview: true,
    main,
  });
}
