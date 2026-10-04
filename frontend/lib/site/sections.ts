import type { HomeData } from '@/lib/home-content';
import { html, raw, type Raw } from './html';
import { ARW, ico } from './shell';
import { nwWords, pad2, SERVICE_OPTIONS, techRails, workArt } from './data';

/** Sub-page hero: one or two title lines, lead, meta strip, and the floating objects. */
export function phero(o: {
  lines: (string | Raw)[];
  lead: string;
  caps: string;
  meta: string;
  obj: string;
  objB?: string;
}): Raw {
  const lines = o.lines.map((l, i) =>
    i === 0
      ? html`<span class="h1" data-line data-intro>${l}</span>`
      : html`<span class="h1" data-line data-intro data-delay="${(0.12 * i).toFixed(2).replace(/^0/, '')}">${l}</span>`,
  );
  return html`<section class="phero s-light">
  <div class="phero__grid">
    <h1 class="phero__title">${lines}</h1>
    <p class="phero__lead lead" data-line data-intro data-delay=".25">${o.lead}</p>
    <div class="phero__meta" data-fade data-intro data-delay=".5"><span class="caps">${o.caps}</span><span class="data">${o.meta}</span></div>
  </div>
  <div class="phero__obj" data-parallax="-90" aria-hidden="true"><img src="/assets/img/${o.obj}" alt="" width="1200" height="1200" decoding="async"></div>${
    o.objB
      ? html`<div class="phero__obj phero__obj--b" data-parallax="-60" data-scrub="2.5" aria-hidden="true"><img src="/assets/img/${o.objB}" alt="" width="560" height="560" decoding="async"></div>`
      : ''
  }
</section>`;
}

export function processSection(h: HomeData): Raw {
  const steps = h.process.map((s) => html`<li class="step"><h3 class="en">${s.t}</h3><p>${s.d}</p></li>`);
  const bar = h.process.map((s) => html`<span>${s.t}</span>`);
  return html`<section class="process s-light" data-process aria-labelledby="process-title">
  <div class="process__lines" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
  <div class="process__stage">
    <div class="process__head"><h2 class="h2" id="process-title" data-line>กระบวนการทำงานแบบครบวงจร</h2></div>
    <p class="process__note">${h.process.length} ขั้นตอน · จบในทีมเดียว</p>
    <p class="process__num" aria-hidden="true">01</p>
    <ol class="process__steps">${steps}</ol>
    <div class="process__bar" aria-hidden="true">${bar}</div>
  </div>
</section>`;
}

export function railsBlock(h: HomeData, title: string, desc: string): Raw {
  return html`<div class="rails" data-rails>
  <div class="rails__head"><h3 class="h3" data-line>${title}</h3><p class="mute">${desc}</p><p class="caps mute">Tech stack <span class="data">( ${pad2(h.techs.length)} )</span></p></div>
  ${techRails(h.techs)}
</div>`;
}

const thb = (n: number) => '฿' + n.toLocaleString('en-US');

/** Price cards. `ctaFor` decides each card's button target (home → /pricing, pricing → register/contact). */
export function plans(h: HomeData, id: string, ctaFor: (custom: boolean) => string, unitCustom: string): Raw {
  const cards = h.pricing.tiers.map((t) => {
    const feats = t.feats.map((f) => html`<li>${ico('i-check')}<span>${f}</span></li>`);
    const price = t.custom
      ? html`<p class="plan__amount en">Custom</p><p class="plan__was" aria-hidden="true"></p><p class="plan__unit">${unitCustom}</p>`
      : html`<p class="plan__amount"><span data-sale="${t.disc}" data-full="${t.base}">${thb(t.disc)}</span></p><p class="plan__was"><span class="sr-only">ราคาปกติ </span>${thb(t.base)}</p><p class="plan__unit">เริ่มต้น · ราคาต่อโปรเจกต์</p>`;
    return html`<article class="plan${t.popular ? ' plan--pro' : ''}">
  <div class="plan__top"><h3 class="plan__name en">${t.name}</h3>${t.popular ? raw('<span class="plan__flag">แนะนำ · Most popular</span>') : ''}</div>
  <p class="plan__who">${t.th}</p>
  <div class="plan__price">${price}</div>
  <ul class="plan__feats">${feats}</ul>
  <a class="badge${t.popular ? ' badge--fill' : ''}" href="${ctaFor(t.custom)}">${t.custom ? 'ขอใบเสนอราคา' : 'เลือกแพ็กเกจนี้'} ${ARW}</a>
</article>`;
  });
  return html`<div class="plans" id="${id}">${cards}</div>`;
}

export function discountSwitch(target: string): Raw {
  return html`<button class="switch" type="button" role="switch" aria-checked="true" aria-controls="${target}" data-discount>
  <span class="switch__track" aria-hidden="true"><span class="switch__knob"></span></span>
  <span>จองภายในเดือนนี้ — ลดทันที 20%<small>สลับเพื่อดูราคาปกติ</small></span></button>`;
}

export function proof(items: { v: string; l: string }[], label: string, tone: 's-dark' | 's-light', tight = true): Raw {
  const spans = items.map(
    (s) => html`<span class="proof__item"><span class="proof__num" data-odo="${s.v}">${s.v}</span> <span class="proof__label">${s.l}</span></span>`,
  );
  // the design separates items with a plain space so the line wraps between figures
  return html`<section class="sec${tight ? ' sec--tight' : ''} ${tone}" aria-label="${label}"><p class="proof">${spans.map((s, i) => (i ? html` ${s}` : s))}</p></section>`;
}

export interface WorkItem {
  cat: string;
  tag: string;
  t: string;
  d: string;
  m: string;
}
export function worksGrid(items: WorkItem[], id: string): Raw {
  const arts = items.map((w, i) => {
    const art = workArt(w.tag, w.t, i);
    return html`<article class="work" data-cat="${w.cat}" data-alt="${i % 2}">
  <div class="work__media" data-wipe><img src="${art.src}" alt="${art.alt}" width="${art.w}" height="${art.h}" loading="lazy" decoding="async" data-parallax-img></div>
  <div class="work__meta">
    <h3 class="work__title">${w.t}</h3>
    <p class="work__res">${ico('i-up', 'ico--fill')}<span>${nwWords(w.m)}</span></p>
    <p class="work__desc">${w.d}</p>
    <p class="work__cat caps">${w.tag}</p>
  </div>
</article>`;
  });
  return html`<div class="works" id="${id}" data-works>${arts}</div>`;
}

const fieldErr = (msg = 'กรุณากรอกข้อมูลช่องนี้') => html`<p class="field__err">${ico('i-alert')}${msg}</p>`;
const HP = raw(
  '<div class="hp" aria-hidden="true"><label for="website">Website</label><input id="website" name="website" type="text" tabindex="-1" autocomplete="off"></div>',
);
const serviceSelect = (id: string) =>
  html`<select id="${id}" name="service"><option value="">เลือกบริการ</option>${SERVICE_OPTIONS.map((s) => html`<option>${s}</option>`)}</select>`;

/** Home "register" form → POST /api/public/leads (field names are the API's own). */
export function registerForm(h: HomeData): Raw {
  const code = h.register.couponCode;
  const success = code
    ? `ลงทะเบียนเรียบร้อย — คูปองส่วนลดของคุณ: ${code} · ทีม PMN จะส่งสิทธิพิเศษให้ทางอีเมล`
    : 'ลงทะเบียนเรียบร้อย ทีม PMN จะส่งสิทธิพิเศษให้ทางอีเมล';
  return html`<form class="form register__form" data-form data-endpoint="/api/public/leads" data-subject="ลงทะเบียนรับสิทธิพิเศษ — PMN Digital" data-success="${success}" novalidate>
      <input type="hidden" name="type" value="REGISTER"><input type="hidden" name="source" value="home-register">
      <div class="form__title"><h3 class="h3 en">Register</h3><span class="caps mute">Members only</span></div>
      ${HP}
      <div class="field"><label for="reg-name">ชื่อ-นามสกุล <b>*</b></label><input id="reg-name" name="name" type="text" placeholder="ชื่อของคุณ" autocomplete="name" maxlength="120" data-required required aria-required="true">${fieldErr()}</div>
      <div class="field field--half"><label for="reg-email">อีเมล <b>*</b></label><input id="reg-email" name="email" type="email" placeholder="you@company.com" autocomplete="email" maxlength="160" data-required required aria-required="true">${fieldErr('กรุณากรอกอีเมลที่ถูกต้อง')}</div>
      <div class="field field--half"><label for="reg-phone">เบอร์โทร</label><input id="reg-phone" name="phone" type="tel" placeholder="08X-XXX-XXXX" autocomplete="tel" maxlength="40">${fieldErr()}</div>
      <div class="field"><label for="reg-service">บริการที่สนใจ</label>${serviceSelect('reg-service')}${fieldErr()}</div>
      <div class="field"><label for="reg-code">โค้ดส่วนลด (ถ้ามี)</label><input id="reg-code" name="couponCode" type="text" placeholder="เช่น MONTH20" maxlength="40">${fieldErr()}</div>
      <div class="form__foot"><button class="badge badge--fill badge--lg" type="submit">รับสิทธิพิเศษฟรี ${ARW}</button><p class="form__note">เราเคารพความเป็นส่วนตัวของคุณ · ไม่มีค่าใช้จ่าย</p></div>
      <p class="form__status" role="status" aria-live="polite"></p>
    </form>`;
}

export function contactForm(): Raw {
  return html`<form class="form contact__form" data-form data-endpoint="/api/public/leads" data-subject="ข้อความจากเว็บไซต์ PMN Digital" data-success="ส่งข้อความเรียบร้อย ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง" novalidate>
      <input type="hidden" name="type" value="CONTACT"><input type="hidden" name="source" value="contact-page">
      <div class="form__title"><h2 class="h3 en" id="send-title">Send a message</h2><span class="caps mute">ปรึกษาฟรี</span></div>
      ${HP}
      <div class="field field--half"><label for="c-name">ชื่อ-นามสกุล <b>*</b></label><input id="c-name" name="name" type="text" placeholder="ชื่อของคุณ" autocomplete="name" maxlength="120" data-required required aria-required="true">${fieldErr()}</div>
      <div class="field field--half"><label for="c-company">บริษัท / องค์กร</label><input id="c-company" name="company" type="text" placeholder="ชื่อองค์กร" autocomplete="organization" maxlength="160">${fieldErr()}</div>
      <div class="field"><label for="c-email">อีเมล <b>*</b></label><input id="c-email" name="email" type="email" placeholder="you@company.com" autocomplete="email" maxlength="160" data-required required aria-required="true">${fieldErr('กรุณากรอกอีเมลที่ถูกต้อง')}</div>
      <div class="field"><label for="c-service">บริการที่สนใจ</label>${serviceSelect('c-service')}${fieldErr()}</div>
      <div class="field"><label for="c-detail">รายละเอียดโครงการ</label><textarea id="c-detail" name="message" rows="4" placeholder="เล่าให้เราฟังเกี่ยวกับสิ่งที่คุณอยากทำ..." maxlength="4000"></textarea>${fieldErr()}</div>
      <div class="form__foot"><button class="badge badge--fill badge--lg" type="submit">ส่งข้อความ ${ARW}</button><p class="form__note">เราเคารพความเป็นส่วนตัวของคุณ</p></div>
      <p class="form__status" role="status" aria-live="polite"></p>
    </form>`;
}

export function commentForm(slug: string, title: string): Raw {
  return html`<form class="form" data-form data-endpoint="/api/public/articles/${encodeURIComponent(slug)}/comments" data-subject="ความคิดเห็นบทความ: ${title}" data-success="ส่งความคิดเห็นแล้ว จะแสดงหลังผ่านการอนุมัติ" novalidate>
        <div class="form__title"><h3 class="h3">ร่วมแสดงความคิดเห็น</h3></div>
        ${HP}
        <div class="field field--half"><label for="cm-name">ชื่อของคุณ <b>*</b></label><input id="cm-name" name="authorName" type="text" placeholder="" autocomplete="name" maxlength="80" data-required required aria-required="true">${fieldErr()}</div>
        <div class="field field--half"><label for="cm-email">อีเมล (ไม่บังคับ · ไม่แสดงสาธารณะ)</label><input id="cm-email" name="authorEmail" type="email" placeholder="" autocomplete="email" maxlength="160">${fieldErr('กรุณากรอกอีเมลที่ถูกต้อง')}</div>
        <div class="field"><label for="cm-text">ความคิดเห็น <b>*</b></label><textarea id="cm-text" name="body" rows="4" placeholder="แสดงความคิดเห็น…" maxlength="2000" data-required required aria-required="true"></textarea>${fieldErr()}</div>
        <div class="form__foot"><button class="badge" type="submit">ส่งความคิดเห็น ${ARW}</button></div>
        <p class="form__status" role="status" aria-live="polite"></p>
      </form>`;
}
