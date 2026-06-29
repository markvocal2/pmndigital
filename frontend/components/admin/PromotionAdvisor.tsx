'use client';

import { useMemo, useState } from 'react';
import {
  computeAdvice,
  suggestTemplates,
  fmtTHB,
  type PromoTemplate,
} from '@/lib/promo-advisor';

const healthStyle: Record<string, string> = {
  good: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  caution: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  risk: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
};
const healthLabel: Record<string, string> = {
  good: 'สุขภาพดี',
  caution: 'ควรระวัง',
  risk: 'เสี่ยง',
};

function Num({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          min={0}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-400/60"
        />
        {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
      </div>
    </label>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold ${tone ?? 'text-slate-100'}`}>{value}</div>
    </div>
  );
}

export function PromotionAdvisor({
  onApply,
  onPrice,
}: {
  onApply?: (t: PromoTemplate) => void;
  onPrice?: (originalPrice: number, finalPrice: number) => void;
}) {
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('15');
  const [units, setUnits] = useState('');

  const input = {
    cost: parseFloat(cost) || 0,
    price: parseFloat(price) || 0,
    discountPct: parseFloat(discount) || 0,
    expectedUnits: parseFloat(units) || undefined,
  };
  const advice = useMemo(() => computeAdvice(input), [cost, price, discount, units]);
  const templates = useMemo(() => suggestTemplates(input, advice), [advice, cost, price, discount, units]);

  return (
    <div className="rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-500/[0.06] to-transparent p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base">🧮</span>
        <div>
          <h3 className="text-sm font-semibold text-slate-100">ตัวช่วยคิดโปรโมชั่น</h3>
          <p className="text-xs text-slate-500">คำนวณตามหลักการตลาด — มาร์จิ้น, จุดคุ้มทุน, ราคาจิตวิทยา, ความเร่งด่วน</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Num label="ต้นทุน/หน่วย" value={cost} onChange={setCost} suffix="฿" />
        <Num label="ราคาปกติ" value={price} onChange={setPrice} suffix="฿" />
        <Num label="ส่วนลด" value={discount} onChange={setDiscount} suffix="%" />
        <Num label="ยอดคาดหวัง" value={units} onChange={setUnits} suffix="ชิ้น" />
      </div>

      {advice.valid && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Metric label="ราคาโปร" value={fmtTHB(advice.salePrice)} tone="text-blue-300" />
            <Metric
              label="กำไร/หน่วย"
              value={fmtTHB(advice.profitPerUnit)}
              tone={advice.profitPerUnit <= 0 ? 'text-rose-300' : 'text-emerald-300'}
            />
            <Metric
              label="มาร์จิ้น"
              value={`${advice.marginPct}%`}
              tone={advice.marginPct < 10 ? 'text-rose-300' : advice.marginPct < 25 ? 'text-amber-300' : 'text-emerald-300'}
            />
            <Metric
              label="ต้องขายเพิ่ม"
              value={advice.breakEvenUpliftPct === null ? '∞' : `${advice.breakEvenUpliftPct}%`}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${healthStyle[advice.health]}`}>
              {healthLabel[advice.health]}
            </span>
            {advice.charmPrice > 0 && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300">
                ราคาจิตวิทยาแนะนำ {fmtTHB(advice.charmPrice)}
              </span>
            )}
            {onPrice && advice.salePrice > 0 && (
              <button
                type="button"
                onClick={() => onPrice(input.price, advice.charmPrice || advice.salePrice)}
                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
              >
                ใช้ราคานี้กับโปร
              </button>
            )}
          </div>

          <ul className="mt-3 space-y-1.5">
            {advice.notes.map((n, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                <span className="text-blue-400">•</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-white/10 pt-3">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              เทมเพลตโปรแนะนำ (กดเพื่อนำไปกรอกฟอร์ม)
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {templates.map((t) => (
                <div key={t.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-200">
                      {t.badge}
                    </span>
                    {onApply && (
                      <button
                        type="button"
                        onClick={() => onApply(t)}
                        className="rounded bg-white/10 px-2 py-0.5 text-xs text-slate-200 hover:bg-white/20"
                      >
                        ใช้
                      </button>
                    )}
                  </div>
                  <div className="mt-1.5 text-sm font-medium text-slate-100">{t.title}</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-slate-500">{t.principle}</div>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-slate-400">
                    <span>⏱ {t.durationDays} วัน</span>
                    {t.limitedQty != null && <span>🎟 {t.limitedQty} สิทธิ์</span>}
                    {t.featured && <span className="text-amber-300">★ โปรเด่น</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {!advice.valid && <p className="mt-3 text-xs text-slate-500">{advice.notes[0]}</p>}
    </div>
  );
}
