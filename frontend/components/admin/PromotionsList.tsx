'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Promotion } from '@/lib/cms';
import { setPromotionStateAction, deletePromotionAction } from '@/lib/cms-actions';

function discountLabel(p: Promotion): string {
  if (p.discountType === 'PERCENT' && p.discountValue) return `ลด ${p.discountValue}%`;
  if (p.discountType === 'FIXED' && p.discountValue) return `ลด ฿${p.discountValue.toLocaleString('en-US')}`;
  if (p.discountType === 'BUNDLE') return 'แพ็กเกจ';
  if (p.discountType === 'FREE') return 'ฟรี/แถม';
  return '—';
}
function fmt(d?: string | null): string {
  return d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';
}

export function PromotionsList({ items }: { items: Promotion[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);

  function toggle(p: Promotion, field: 'active' | 'featured') {
    setBusyId(p.id);
    startTransition(async () => {
      await setPromotionStateAction(p.id, { [field]: !p[field] });
      router.refresh();
      setBusyId(null);
    });
  }
  function del(p: Promotion) {
    if (!confirm(`ลบโปรโมชั่น "${p.title}"?`)) return;
    setBusyId(p.id);
    startTransition(async () => {
      await deletePromotionAction(p.id);
      router.refresh();
      setBusyId(null);
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">โปรโมชั่น</h1>
          <p className="mt-1 text-sm text-slate-400">เปิด/ปิด กำหนดเวลา และตั้งโปรเด็ดประจำเดือน</p>
        </div>
        <Link href="/admin/promotions/new" className="rounded-md bg-blue-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          + สร้างโปรโมชั่น
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs text-slate-400">
            <tr>
              <th className="px-4 py-3">โปรโมชั่น</th>
              <th className="px-4 py-3">ส่วนลด</th>
              <th className="px-4 py-3">ช่วงเวลา</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3 text-center">เด่น</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className={`border-t border-white/[0.06] ${busyId === p.id && pending ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {p.badge && <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] text-blue-200">{p.badge}</span>}
                    <span className="font-medium text-slate-100">{p.title}</span>
                  </div>
                  {p.couponCode && <div className="mt-0.5 font-mono text-[11px] text-slate-500">🎟 {p.couponCode}</div>}
                </td>
                <td className="px-4 py-3 text-slate-300">{discountLabel(p)}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{fmt(p.startsAt)} – {fmt(p.endsAt)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggle(p, 'active')}
                    className={p.live
                      ? 'rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300'
                      : p.active
                        ? 'rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-300'
                        : 'rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-400'}
                    title="คลิกเพื่อเปิด/ปิด"
                  >
                    {p.live ? '● กำลังแสดง' : p.active ? '○ เปิด (นอกช่วงเวลา)' : '○ ปิด'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggle(p, 'featured')} title="โปรเด่นหน้าแรก" className={p.featured ? 'text-amber-300' : 'text-slate-600 hover:text-slate-400'}>
                    {p.featured ? '★' : '☆'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/promotions/${p.id}/edit`} className="text-blue-300 hover:text-blue-200">แก้ไข</Link>
                  <button onClick={() => del(p)} className="ml-3 text-rose-300/80 hover:text-rose-200">ลบ</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">ยังไม่มีโปรโมชั่น — กด "สร้างโปรโมชั่น" เพื่อเริ่ม</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
