'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Coupon } from '@/lib/cms';
import { setCouponStateAction, deleteCouponAction } from '@/lib/cms-actions';

function discountLabel(c: Coupon): string {
  return c.discountType === 'PERCENT' ? `ลด ${c.discountValue}%` : `ลด ฿${c.discountValue.toLocaleString('en-US')}`;
}

export function CouponsList({ items }: { items: Coupon[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);

  function toggle(c: Coupon) {
    setBusyId(c.id);
    startTransition(async () => {
      await setCouponStateAction(c.id, { active: !c.active });
      router.refresh();
      setBusyId(null);
    });
  }
  function del(c: Coupon) {
    if (!confirm(`ลบคูปอง "${c.code}"? (ประวัติการใช้จะยังอยู่)`)) return;
    setBusyId(c.id);
    startTransition(async () => {
      await deleteCouponAction(c.id);
      router.refresh();
      setBusyId(null);
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">คูปอง</h1>
          <p className="mt-1 text-sm text-slate-400">โค้ดส่วนลดจำนวนจำกัด ใช้ผ่านฟอร์มสมัคร/ติดต่อ</p>
        </div>
        <Link href="/admin/coupons/new" className="rounded-md bg-blue-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          + สร้างคูปอง
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs text-slate-400">
            <tr>
              <th className="px-4 py-3">โค้ด</th>
              <th className="px-4 py-3">ส่วนลด</th>
              <th className="px-4 py-3">การใช้งาน</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const pct = c.maxRedemptions ? Math.min(100, Math.round((c.redeemedCount / c.maxRedemptions) * 100)) : 0;
              const soldOut = c.maxRedemptions != null && c.redeemedCount >= c.maxRedemptions;
              return (
                <tr key={c.id} className={`border-t border-white/[0.06] ${busyId === c.id && pending ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-mono font-semibold text-slate-100">{c.code}</div>
                    {c.description && <div className="text-xs text-slate-500">{c.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{discountLabel(c)}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-300">
                      {c.redeemedCount}{c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ' (ไม่จำกัด)'}
                      {soldOut && <span className="ml-1.5 rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] text-rose-300">ครบแล้ว</span>}
                    </div>
                    {c.maxRedemptions != null && (
                      <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full ${soldOut ? 'bg-rose-400' : 'bg-blue-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle(c)}
                      className={c.active ? 'rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300' : 'rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-400'}
                      title="คลิกเพื่อเปิด/ปิด"
                    >
                      {c.active ? '● เปิด' : '○ ปิด'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/coupons/${c.id}/edit`} className="text-blue-300 hover:text-blue-200">แก้ไข</Link>
                    <button onClick={() => del(c)} className="ml-3 text-rose-300/80 hover:text-rose-200">ลบ</button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">ยังไม่มีคูปอง — กด "สร้างคูปอง" เพื่อเริ่ม</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
