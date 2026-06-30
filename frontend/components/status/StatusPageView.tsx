'use client';

import { useEffect, useState } from 'react';
import type { StatusComponent, StatusLevel, StatusPage } from '@/lib/cms';
import { fetchStatusPage } from '@/lib/blog-client';

const LV: Record<StatusLevel, { label: string; dot: string; chip: string }> = {
  operational: { label: 'ทำงานปกติ', dot: '#22c55e', chip: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
  degraded: { label: 'ประสิทธิภาพลดลง', dot: '#fbbf24', chip: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' },
  partial: { label: 'ขัดข้องบางส่วน', dot: '#fb923c', chip: 'bg-orange-500/15 text-orange-300 ring-orange-500/30' },
  major: { label: 'ขัดข้อง', dot: '#f87171', chip: 'bg-rose-500/15 text-rose-300 ring-rose-500/30' },
  maintenance: { label: 'บำรุงรักษา', dot: '#60a5fa', chip: 'bg-blue-500/15 text-blue-300 ring-blue-500/30' },
};
const OVERALL: Record<StatusLevel, string> = {
  operational: 'ทุกระบบทำงานปกติ',
  degraded: 'ประสิทธิภาพบางระบบลดลง',
  partial: 'บางระบบขัดข้อง',
  major: 'ระบบขัดข้อง',
  maintenance: 'อยู่ระหว่างบำรุงรักษา',
};

function StatusChip({ level }: { level: StatusLevel }) {
  const v = LV[level];
  return (
    <span className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${v.chip}`}>
      <span className="h-2 w-2 rounded-full" style={{ background: v.dot }} />
      {v.label}
    </span>
  );
}

function UptimeBars({ comp }: { comp: StatusComponent }) {
  return (
    <div className="mt-3.5">
      <div className="flex items-stretch gap-[2px]">
        {comp.days.map((d, i) => {
          const color =
            d.uptime == null
              ? 'rgba(255,255,255,0.09)'
              : d.uptime >= 99.5
                ? '#22c55e'
                : d.uptime >= 95
                  ? '#fbbf24'
                  : '#f87171';
          const date = new Date(d.t * 1000).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
          const label = d.uptime == null ? 'ไม่มีข้อมูล' : `${d.uptime}%`;
          return (
            <span
              key={i}
              title={`${date} · ${label}`}
              className="h-9 flex-1 rounded-[2px] transition hover:opacity-80"
              style={{ background: color, minWidth: 2 }}
            />
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-slate-500">
        <span>{comp.days.length} วันก่อน</span>
        <span className="text-slate-300">
          {comp.uptimePct != null ? comp.uptimePct.toFixed(comp.uptimePct >= 99.95 ? 2 : 1) + '% uptime' : 'รอข้อมูล'}
        </span>
        <span>วันนี้</span>
      </div>
    </div>
  );
}

export function StatusPageView({ initial }: { initial: StatusPage }) {
  const [sp, setSp] = useState(initial);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    const r = setInterval(() => fetchStatusPage().then((d) => d && setSp(d)), 30000);
    return () => {
      clearInterval(t);
      clearInterval(r);
    };
  }, []);

  function rel() {
    if (!now) return '';
    const s = Math.max(0, Math.round((now - new Date(sp.updatedAt).getTime()) / 1000));
    if (s < 60) return `${s} วินาทีที่แล้ว`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m} นาทีที่แล้ว`;
    return `${Math.round(m / 60)} ชั่วโมงที่แล้ว`;
  }

  const color = LV[sp.overall].dot;

  return (
    <div className="space-y-6">
      {/* overall banner */}
      <div
        className="rounded-2xl border p-6 sm:p-7"
        style={{ borderColor: color + '55', background: `linear-gradient(120deg, ${color}1f, transparent 70%)` }}
      >
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl font-bold" style={{ background: color + '22', color }}>
            {sp.overall === 'operational' ? '✓' : sp.overall === 'maintenance' ? '🛠' : '!'}
          </span>
          <div>
            <h2 className="text-xl font-bold sm:text-2xl" style={{ color }}>
              {OVERALL[sp.overall]}
            </h2>
            <p className="mt-0.5 text-sm text-slate-400">
              อัปเดตล่าสุด {rel() || '—'} <span className="text-slate-600">· อัปเดตอัตโนมัติทุก 30 วินาที</span>
            </p>
          </div>
        </div>
      </div>

      {/* components */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {sp.components.map((c, i) => (
          <div key={c.key} className={`p-5 sm:p-6 ${i > 0 ? 'border-t border-white/[0.07]' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-100">{c.name}</div>
                <div className="mt-0.5 text-[13px] text-slate-500">
                  {c.description}
                  {c.responseMs ? ` · ${c.responseMs}ms` : ''}
                </div>
              </div>
              <StatusChip level={c.status} />
            </div>
            <UptimeBars comp={c} />
          </div>
        ))}
      </div>

      {/* incident history */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold">ประวัติเหตุขัดข้อง</h2>
        {sp.incidents.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-4 text-sm text-emerald-200">
            <span className="text-base">✓</span> ไม่พบเหตุขัดข้องในระบบตลอด {sp.windowDays} วันที่ผ่านมา
          </div>
        ) : (
          <ul className="space-y-3">
            {sp.incidents.map((inc, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium text-amber-300">{inc.component}</span>
                  <span className="ml-2 text-slate-400">ประสิทธิภาพลดลงชั่วคราว</span>
                </div>
                <div className="text-right font-mono text-xs text-slate-400">
                  <div>{inc.date}</div>
                  <div className="text-amber-300/80">{inc.uptime}% uptime</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="pt-1 text-center text-xs text-slate-600">
        ข้อมูลความพร้อมใช้งานจากระบบมอนิเตอร์ภายในของ PMN Digital
      </p>
    </div>
  );
}
