'use client';

import { useState } from 'react';
import { MediaImg } from '@/components/ui/Skeleton';
import { Countdown } from './Countdown';
import type { Promotion } from '@/lib/cms';

const fmtTHB = (n: number) => '฿' + Math.round(n).toLocaleString('en-US');

function discountText(p: Promotion): string | null {
  if (p.discountType === 'PERCENT' && p.discountValue) return `-${p.discountValue}%`;
  if (p.discountType === 'FIXED' && p.discountValue) return `-${fmtTHB(p.discountValue)}`;
  if (p.discountType === 'FREE') return 'ฟรี';
  return null;
}

export function PromotionCard({ p }: { p: Promotion }) {
  const [copied, setCopied] = useState(false);
  const dt = discountText(p);
  const accent = p.highlightColor || '#2563EB';
  const copy = () => {
    if (!p.couponCode) return;
    try {
      navigator.clipboard?.writeText(p.couponCode)?.catch(() => {});
    } catch {
      /* noop */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-blue-400/40">
      {p.imageUrl && (
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#10203f] to-[#0a1426]">
          <MediaImg src={p.imageUrl} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          {dt && (
            <span className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-sm font-bold text-white shadow-lg" style={{ background: accent }}>
              {dt}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {p.badge && (
            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ background: accent }}>
              {p.badge}
            </span>
          )}
          {!p.imageUrl && dt && (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-blue-200">{dt}</span>
          )}
        </div>
        <h3 className="text-lg font-semibold leading-snug text-slate-100">{p.title}</h3>
        {p.subtitle && <p className="text-sm text-[#8B95AC]">{p.subtitle}</p>}
        {p.description && <p className="line-clamp-3 text-sm text-[#8B95AC]">{p.description}</p>}
        {(p.originalPrice != null || p.finalPrice != null) && (
          <div className="flex items-baseline gap-2">
            {p.finalPrice != null && <span className="text-2xl font-bold text-white">{fmtTHB(p.finalPrice)}</span>}
            {p.originalPrice != null && <span className="text-sm text-slate-500 line-through">{fmtTHB(p.originalPrice)}</span>}
            {p.priceUnit && <span className="text-xs text-slate-500">{p.priceUnit}</span>}
          </div>
        )}
        {p.endsAt && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>หมดเขตใน</span>
            <Countdown to={p.endsAt} />
          </div>
        )}
        {p.couponCode && (
          <button
            type="button"
            onClick={copy}
            className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-blue-400/50 bg-blue-500/10 px-3 py-2 text-left transition hover:bg-blue-500/20"
          >
            <span className="font-mono text-sm font-semibold text-blue-200">🎟 {p.couponCode}</span>
            <span className="text-xs text-blue-300">{copied ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}</span>
          </button>
        )}
        {p.terms && <p className="text-[11px] text-slate-500">{p.terms}</p>}
        <div className="mt-auto pt-1">
          <a
            href={p.ctaUrl || '/#register'}
            className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            style={{ background: accent }}
          >
            {p.ctaText || 'รับสิทธิ์เลย'} →
          </a>
        </div>
      </div>
    </div>
  );
}
