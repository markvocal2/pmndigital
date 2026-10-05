import { getStatusPage, type StatusComponent, type StatusLevel } from '@/lib/cms';
import { dateMid, loadCtx } from '../data';
import { html, type Raw } from '../html';
import { phero } from '../sections';
import { ico, renderPage } from '../shell';

const LEVEL: Record<StatusLevel, { label: string; tone: '' | 'is-warn' | 'is-down' }> = {
  operational: { label: 'ทำงานปกติ', tone: '' },
  degraded: { label: 'ประสิทธิภาพลดลง', tone: 'is-warn' },
  partial: { label: 'ขัดข้องบางส่วน', tone: 'is-warn' },
  major: { label: 'ขัดข้อง', tone: 'is-down' },
  maintenance: { label: 'บำรุงรักษา', tone: 'is-warn' },
};
const OVERALL: Record<StatusLevel, string> = {
  operational: 'ทุกระบบทำงานปกติ',
  degraded: 'ประสิทธิภาพบางระบบลดลง',
  partial: 'บางระบบขัดข้อง',
  major: 'ระบบขัดข้อง',
  maintenance: 'อยู่ระหว่างบำรุงรักษา',
};

const dayLabel = (t: number) => new Date(t * 1000).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' });

function row(c: StatusComponent): Raw {
  // "เว็บไซต์ (Website)" → Thai name + muted English
  const m = c.name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  const name = m ? html`${m[1]} <span class="mute en">(${m[2]})</span>` : html`${c.name}`;
  const lv = LEVEL[c.status] ?? LEVEL.operational;
  const bars = c.days.map((d) => {
    const cls = d.uptime == null ? 'is-none' : d.uptime >= 99.5 ? '' : d.uptime >= 95 ? 'is-warn' : 'is-down';
    const tip = `${dayLabel(d.t)} · ${d.uptime == null ? 'ไม่มีข้อมูล' : d.uptime + '%'}`;
    return cls ? html`<i class="${cls}" title="${tip}"></i>` : html`<i title="${tip}"></i>`;
  });
  const allUp = c.days.every((d) => d.uptime == null || d.uptime >= 99.5);
  const up = c.uptimePct != null ? `${c.uptimePct.toFixed(2)}%` : '—';
  return html`<div class="svcrow">
  <div class="svcrow__name"><b>${name}</b><span>${c.description}</span></div>
  <p class="svcrow__state status-dot${lv.tone ? ' ' + lv.tone : ''}">${lv.label}</p>
  <div class="svcrow__bars"><div class="bars" role="img" aria-label="${c.days.length} วันที่ผ่านมา ${allUp ? 'ทำงานปกติทุกวัน' : 'มีบางวันที่ประสิทธิภาพลดลง'}">${bars}</div><div class="bars__legend data"><span>${c.days.length} วันก่อน</span><span>วันนี้</span></div></div>
  <p class="svcrow__up data"><b>${c.uptimePct != null ? html`<span data-odo="${up}">${up}</span>` : up}</b><span>uptime · ${c.responseMs ? `~${c.responseMs}ms` : '—'}</span></p>
</div>`;
}

export async function renderStatus(): Promise<string> {
  const [c, sp] = await Promise.all([loadCtx(), getStatusPage()]);
  const when = sp ? dateMid(sp.updatedAt) : '';
  const body = sp
    ? html`<div class="banner"><p class="banner__state">${ico(sp.overall === 'operational' ? 'i-ok' : 'i-alert')}${OVERALL[sp.overall]}</p><p class="banner__meta data">ข้อมูล ณ ${when} ${new Date(sp.updatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })} น. · โหลดหน้าใหม่เพื่ออัปเดต</p></div>
  <div class="svcs">${sp.components.map(row)}</div>
  <div class="incidents"><h2 class="h3" data-line>ประวัติเหตุขัดข้อง</h2><div class="incidents__body">${
    sp.incidents.length
      ? html`<ul class="incidents__list">${sp.incidents.map(
          (i) => html`<li><b>${i.component}</b><span class="mute">ประสิทธิภาพลดลงชั่วคราว</span><span class="data">${i.date} · ${i.uptime}% uptime</span></li>`,
        )}</ul>`
      : html`<p class="incidents__ok">${ico('i-ok')}ไม่พบเหตุขัดข้องในระบบตลอด ${sp.windowDays} วันที่ผ่านมา</p>`
  }<p class="mute small">ข้อมูลความพร้อมใช้งานจากระบบมอนิเตอร์ภายในของ PMN Digital</p></div></div>`
    : html`<div class="banner"><p class="banner__state">${ico('i-alert')}ไม่สามารถโหลดสถานะได้ในขณะนี้</p><p class="banner__meta data">กรุณาลองใหม่อีกครั้ง</p></div>`;
  const main = html`
${phero({
  lines: ['สถานะระบบ'],
  lead: 'ความพร้อมใช้งานของบริการ PMN Digital',
  caps: 'System status',
  meta: sp ? `live · ${when}` : 'live',
  obj: 'hero-status.webp',
})}
<section class="sec s-light sec--tight" aria-labelledby="st-title">
  <h2 class="sr-only" id="st-title">สถานะบริการ</h2>
  ${body}
</section>
`;
  return renderPage({
    ctx: c,
    nav: 'status',
    title: 'สถานะระบบ · PMN Digital',
    description: 'สถานะการให้บริการและความพร้อมใช้งานของระบบ PMN Digital แบบเรียลไทม์',
    canonical: '/status',
    bodyClass: 'page-status',
    main,
  });
}
