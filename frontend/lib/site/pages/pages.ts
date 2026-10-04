/* Services · Portfolio · Pricing · Contact */
import { defaultHomeContent } from '@/lib/home-content';
import { designOr, loadCtx, pad2, portfolioWorks } from '../data';
import { html, raw } from '../html';
import { contactForm, discountSwitch, phero, plans, processSection, proof, railsBlock, worksGrid } from '../sections';
import { ico, renderPage } from '../shell';

const D = defaultHomeContent;

const SVC_ART = [
  { id: 'database', src: 'obj-database.webp', alt: 'ฐานข้อมูลสามชั้นทำจากไวนิลเป่าลมสีน้ำเงิน' },
  { id: 'erp', src: 'obj-abacus.webp', alt: 'ลูกคิดโครเมียมกับลูกเจลลี่หลากสี' },
  { id: 'crm', src: 'obj-rolodex.webp', alt: 'แฟ้มบัตรหมุนทำจากแก้วฝ้าบนฐานสีชมพู' },
  { id: 'custom', src: 'obj-tape.webp', alt: 'ตลับเมตรโครเมียมกับสายวัดสีส้ม' },
];

export async function renderServices(): Promise<string> {
  const c = await loadCtx();
  const sp = c.home.servicesPage;
  const titleMuted =
    sp.titleMuted === D.servicesPage.titleMuted ? raw('<span class="nw">ครบทุกขั้นตอน</span> ในที่เดียว') : sp.titleMuted;
  const lead = designOr(
    sp.subtitle,
    D.servicesPage.subtitle,
    'จัดข้อมูลให้เป็นระเบียบ แล้วสร้างระบบที่ทีมของคุณใช้ได้จริงทุกวัน — PMN ออกแบบ พัฒนา ติดตั้ง และดูแลให้แบบจบในทีมเดียว',
  );
  const details = sp.details.map((d, i) => {
    const art = SVC_ART[i % SVC_ART.length];
    const label = c.home.services[i]?.t ?? d.n.replace(/^\d+\s*·\s*/, '');
    const feats = d.feats.map((f) => html`<li>${ico('i-check')}<span>${f}</span></li>`);
    return html`<article class="svc-detail" id="${i < SVC_ART.length ? art.id : `service-${i + 1}`}">
  <div class="svc-detail__media"><div class="svc-detail__sticky" data-rise><img src="/assets/img/${art.src}" alt="${art.alt}" width="1200" height="1200" loading="lazy" decoding="async"></div></div>
  <div class="svc-detail__body">
    <h2 class="h2" data-line>${d.h}</h2>
    <p class="lead" data-line data-delay=".1">${d.p}</p>
    <p class="svc-detail__label caps">${label}</p>
    <ul class="feat-list">${feats}</ul>
  </div>
</article>`;
  });
  const addons = sp.more.map(
    (m) =>
      html`<li class="addon"><span class="addon__en caps">${m.k.charAt(0) + m.k.slice(1).toLowerCase()}</span><span class="addon__name en">${m.h}</span><span class="addon__desc">${m.d}</span></li>`,
  );
  const main = html`
${phero({
  lines: [sp.title, titleMuted],
  lead,
  caps: 'Services',
  meta: `${pad2(sp.details.length)} core · ${pad2(sp.more.length)} add-on`,
  obj: 'obj-database.webp',
  objB: 'obj-binder-sm.webp',
})}
<section class="sec s-dark" aria-label="บริการหลัก">${details}</section>
<section class="sec s-light" aria-labelledby="addon-title">
  <div class="sec-head"><h2 class="h2" id="addon-title" data-line>${sp.moreTitle}<span class="count">( ${pad2(sp.more.length)} )</span></h2></div>
  <ul class="addons">${addons}</ul>
</section>
<section class="sec s-dark" aria-labelledby="exp-title">
  <div class="sec-head"><h2 class="h2" id="exp-title" data-line>${sp.expertiseTitle}</h2><p class="sec-head__note">${sp.expertiseDesc}</p></div>
  ${railsBlock(c.home, 'เลือกเครื่องมือให้เหมาะกับงาน', 'ไม่ยึดติดเครื่องมือเดียว — เพื่อความเร็ว ความปลอดภัย และการดูแลระยะยาว')}
</section>
${processSection(c.home)}
`;
  return renderPage({
    ctx: c,
    nav: 'services',
    title: 'บริการ · PMN Digital',
    description: 'ออกแบบฐานข้อมูล ERP, CRM และซอฟต์แวร์สั่งทำ ครบทุกขั้นตอนในทีมเดียว — PMN Digital',
    canonical: '/services',
    bodyClass: 'page-services',
    footerCta: {
      title: 'ไม่แน่ใจว่าธุรกิจคุณต้องการระบบแบบไหน?',
      lead: 'คุยกับเราฟรี เราจะช่วยวิเคราะห์และแนะนำแนวทางที่เหมาะกับคุณที่สุด',
      second: { href: '/pricing', label: 'ดูแพ็กเกจและราคา' },
    },
    main,
  });
}

const WORK_FILTERS: { key: string; label: string }[] = [
  { key: 'erp', label: 'ERP' },
  { key: 'crm', label: 'CRM' },
  { key: 'database', label: 'Database' },
  { key: 'custom', label: 'Custom' },
];

export async function renderPortfolio(): Promise<string> {
  const c = await loadCtx();
  const pf = c.home.portfolio;
  const all = portfolioWorks(c.home);
  const industries = pf.stats.find((s) => /อุตสาหกรรม/.test(s.l))?.v ?? '';
  const known = new Set(WORK_FILTERS.map((f) => f.key));
  const extra = [...new Set(all.map((w) => w.cat).filter((k) => k && !known.has(k)))].map((k) => ({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1) }));
  const filters = [{ key: 'all', label: 'ทั้งหมด' }, ...WORK_FILTERS, ...extra]
    .map((f) => ({ ...f, n: f.key === 'all' ? all.length : all.filter((w) => w.cat === f.key).length }))
    .filter((f) => f.key === 'all' || f.n > 0)
    .map(
      (f) =>
        html`<button type="button" data-filter="${f.key}" aria-pressed="${f.key === 'all' ? 'true' : 'false'}">${f.label}<span class="count">${pad2(f.n)}</span></button>`,
    );
  const main = html`
${phero({
  lines: [pf.title, pf.titleMuted],
  lead: pf.subtitle,
  caps: 'Portfolio',
  meta: `${pad2(all.length)} projects${industries ? ` · ${industries} industries` : ''}`,
  obj: 'obj-calculator.webp',
  objB: 'obj-tape-sm.webp',
})}
<section class="sec s-dark" aria-labelledby="pf-title">
  <h2 class="sr-only" id="pf-title">ผลงานทั้งหมด</h2>
  <div class="filters" role="group" aria-label="กรองผลงานตามประเภท" data-filter-for="works-all">${filters}</div>
  <p class="sr-only" id="works-all-live" aria-live="polite"></p>
  ${worksGrid(all, 'works-all')}
  <div class="works-foot"><p class="illus-note">ภาพประกอบเป็นงานศิลป์เชิงสัญลักษณ์ ไม่ใช่ภาพหน้าจอระบบของลูกค้า</p></div>
</section>
${proof(pf.stats, 'ผลงานในตัวเลข', 's-light', false)}
`;
  return renderPage({
    ctx: c,
    nav: 'portfolio',
    title: 'ผลงาน · PMN Digital',
    description: 'ผลงานระบบ ERP, CRM, ฐานข้อมูล และซอฟต์แวร์สั่งทำ พร้อมผลลัพธ์ที่วัดได้จริง — PMN Digital',
    canonical: '/portfolio',
    bodyClass: 'page-portfolio',
    footerCta: {
      title: 'อยากให้ธุรกิจคุณเป็นผลงานชิ้นต่อไป?',
      lead: 'เริ่มต้นด้วยการลงทะเบียนรับสิทธิพิเศษ แล้วเราจะติดต่อกลับเพื่อวางแผนร่วมกัน',
      second: { href: '/contact', label: 'ติดต่อเรา' },
    },
    main,
  });
}

/* The comparison table is design copy (no CMS field for it yet). */
const COMPARE = raw(`<div class="table-scroll"><table class="compare">
    <thead><tr><th scope="col"><span class="sr-only">ฟีเจอร์</span></th><th scope="col" class="en">Starter</th><th scope="col" class="en is-pro">Pro</th><th scope="col" class="en">Enterprise</th></tr></thead>
    <tbody><tr><th scope="row">จำนวนโมดูล</th><td>1</td><td class="is-pro">สูงสุด 5</td><td>ไม่จำกัด</td></tr><tr><th scope="row">ออกแบบ UX เฉพาะ</th><td><span class="no" aria-hidden="true">—</span><span class="sr-only">ไม่มี</span></td><td class="is-pro"><svg class="ico" aria-hidden="true"><use href="#i-check"/></svg><span class="sr-only">มี</span></td><td><svg class="ico" aria-hidden="true"><use href="#i-check"/></svg><span class="sr-only">มี</span></td></tr><tr><th scope="row">API &amp; Integration</th><td>พื้นฐาน</td><td class="is-pro"><svg class="ico" aria-hidden="true"><use href="#i-check"/></svg><span class="sr-only">มี</span></td><td>ขั้นสูง</td></tr><tr><th scope="row">รายงาน &amp; BI</th><td>พื้นฐาน</td><td class="is-pro"><svg class="ico" aria-hidden="true"><use href="#i-check"/></svg><span class="sr-only">มี</span></td><td>ขั้นสูง</td></tr><tr><th scope="row">ระยะดูแลฟรี</th><td>3 เดือน</td><td class="is-pro">6 เดือน</td><td>12 เดือน + SLA</td></tr><tr><th scope="row">Priority Support</th><td><span class="no" aria-hidden="true">—</span><span class="sr-only">ไม่มี</span></td><td class="is-pro"><svg class="ico" aria-hidden="true"><use href="#i-check"/></svg><span class="sr-only">มี</span></td><td>ทีมเฉพาะ</td></tr><tr><th scope="row">การติดตั้ง</th><td>Cloud</td><td class="is-pro">Cloud</td><td>Cloud / On-prem</td></tr></tbody>
  </table></div>`);

export async function renderPricing(): Promise<string> {
  const c = await loadCtx();
  const pp = c.home.pricingPage;
  const faqs = c.home.faqs.map(
    (f) => html`<details><summary>${f.q}${ico('i-plus')}</summary><div class="faq__a"><p>${f.a}</p></div></details>`,
  );
  const ld = c.home.faqs.length
    ? [
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: c.home.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        },
      ]
    : [];
  const main = html`
${phero({
  lines: [pp.title, pp.titleMuted],
  lead: pp.subtitle,
  caps: 'Pricing',
  meta: `${c.home.pricing.tiers.length} plans · ลด 20% เดือนนี้`,
  obj: 'obj-calculator.webp',
  objB: 'obj-receipt-sm.webp',
})}
<section class="sec s-dark" aria-labelledby="plans-title">
  <div class="sec-head"><h2 class="h2" id="plans-title" data-line>เลือกแพ็กเกจ</h2><div class="sec-head__aside">${discountSwitch('plans-page')}</div></div>
  ${plans(c.home, 'plans-page', (custom) => (custom ? '/contact' : '/#register'), 'ราคาตามขอบเขตงาน')}
</section>
<section class="sec s-light" aria-labelledby="cmp-title">
  <div class="sec-head"><h2 class="h2" id="cmp-title" data-line>เปรียบเทียบแพ็กเกจ</h2></div>
  ${COMPARE}
</section>
${faqs.length ? html`<section class="sec s-dark" aria-labelledby="faq-title">
  <div class="faq-grid"><h2 class="h2" id="faq-title" data-line>คำถามที่พบบ่อย</h2><div class="faq">${faqs}</div></div>
</section>` : ''}
`;
  return renderPage({
    ctx: c,
    nav: 'pricing',
    title: 'ราคา · PMN Digital',
    description: 'แพ็กเกจพัฒนาระบบที่โปร่งใสและยืดหยุ่นตามขนาดธุรกิจ พร้อมทีมดูแลหลังส่งมอบ — PMN Digital',
    canonical: '/pricing',
    bodyClass: 'page-pricing',
    ld,
    main,
  });
}

export async function renderContact(): Promise<string> {
  const c = await loadCtx();
  const ct = c.home.contact;
  const [user, domain] = c.email.split('@');
  const phone = ct.phone && !/x{3}/i.test(ct.phone) ? ct.phone : '';
  const main = html`
${phero({
  lines: [ct.title, ct.titleMuted],
  lead: ct.subtitle,
  caps: 'Contact',
  meta: `ตอบกลับเฉลี่ยภายใน 24 ชม.`,
  obj: 'obj-rolodex.webp',
  objB: 'obj-stamp-sm.webp',
})}
<section class="sec s-dark" aria-labelledby="send-title">
  <div class="contact__grid">
    ${contactForm()}
    <div class="contact__info">
      <div class="info"><span class="info__k caps">Email</span><a class="info__v" href="mailto:${c.email}" data-no-transition>${user}<span class="at">@</span>${domain}</a></div>
      ${phone ? html`<div class="info"><span class="info__k caps">Phone</span><a class="info__v" href="tel:${phone.replace(/[^\d+]/g, '')}" data-no-transition>${phone}</a></div>` : ''}
      <div class="info"><span class="info__k caps">Office</span><p class="info__v">${ct.office}</p><p class="info__sub">ทำงานออนไลน์ 100% — ประชุมผ่านวิดีโอคอลได้ทุกที่</p></div>
      <div class="info"><span class="info__k caps">Hours</span><p class="info__v">จันทร์ – ศุกร์ ${ct.hoursWeekday}</p><p class="info__sub">เสาร์ – อาทิตย์ ${ct.hoursWeekend}</p><p class="info__sub status-dot">${ct.responseNote}</p></div>
    </div>
  </div>
</section>
`;
  return renderPage({
    ctx: c,
    nav: 'contact',
    title: 'ติดต่อเรา · PMN Digital',
    description: 'คุยกับทีม PMN Digital ปรึกษาฟรี ไม่มีข้อผูกมัด ทีมงานติดต่อกลับภายใน 24 ชั่วโมง',
    canonical: '/contact',
    bodyClass: 'page-contact',
    footerCta: {
      title: 'อยากได้สิทธิพิเศษสำหรับโปรเจกต์แรก?',
      lead: 'ลงทะเบียนรับส่วนลด 20% และปรึกษาวางระบบฟรี 1 ชั่วโมง',
      second: { href: '/pricing', label: 'ดูแพ็กเกจและราคา' },
    },
    main,
  });
}
