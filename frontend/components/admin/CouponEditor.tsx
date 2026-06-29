'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Section, Field, TextArea, Toggle, StatusMsg } from '@/components/admin/ui';
import { saveCouponAction, type CouponInput } from '@/lib/cms-actions';
import type { Coupon } from '@/lib/cms';

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-400/60"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v} className="bg-[#0b101d]">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function isoToLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}
function localToIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
const numOrNull = (s: string): number | null => (s.trim() === '' ? null : parseFloat(s));

export function CouponEditor({ coupon }: { coupon: Coupon | null }) {
  const router = useRouter();
  const c = coupon;
  const [a, setA] = useState(() => ({
    code: c?.code ?? '',
    description: c?.description ?? '',
    discountType: (c?.discountType ?? 'PERCENT') as 'PERCENT' | 'FIXED',
    discountValue: c?.discountValue != null ? String(c.discountValue) : '',
    maxRedemptions: c?.maxRedemptions != null ? String(c.maxRedemptions) : '',
    perEmailLimit: c?.perEmailLimit != null ? String(c.perEmailLimit) : '1',
    minPurchase: c?.minPurchase != null ? String(c.minPurchase) : '',
    startsAt: isoToLocal(c?.startsAt),
    endsAt: isoToLocal(c?.endsAt),
    active: c?.active ?? true,
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  type FormState = typeof a;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setA((prev) => ({ ...prev, [k]: v }));

  async function save() {
    setError(null);
    setSuccess(null);
    if (!/^[A-Za-z0-9_-]{2,40}$/.test(a.code.trim())) {
      setError('รหัสคูปองใช้ได้เฉพาะ A-Z, 0-9, _ และ - (2–40 ตัว)');
      return;
    }
    if (a.discountValue.trim() === '' || isNaN(parseFloat(a.discountValue))) {
      setError('กรุณากรอกมูลค่าส่วนลด');
      return;
    }
    setLoading(true);
    const payload: CouponInput = {
      code: a.code.trim().toUpperCase(),
      description: a.description || null,
      discountType: a.discountType,
      discountValue: parseFloat(a.discountValue),
      maxRedemptions: a.maxRedemptions.trim() === '' ? null : parseInt(a.maxRedemptions, 10),
      perEmailLimit: a.perEmailLimit.trim() === '' ? null : parseInt(a.perEmailLimit, 10),
      minPurchase: numOrNull(a.minPurchase),
      startsAt: localToIso(a.startsAt),
      endsAt: localToIso(a.endsAt),
      active: a.active,
    };
    const res = await saveCouponAction(c?.id ?? null, payload);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSuccess('บันทึกแล้ว');
    if (!c) router.push('/admin/coupons');
    else router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{c ? 'แก้ไขคูปอง' : 'สร้างคูปอง'}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/admin/coupons')}
            className="rounded-md border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            ยกเลิก
          </button>
          <button
            onClick={save}
            disabled={loading}
            className="rounded-md bg-blue-500/90 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? 'กำลังบันทึก…' : 'บันทึก'}
          </button>
        </div>
      </div>

      <StatusMsg error={error} success={success} />

      {c && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-300">
          ใช้ไปแล้ว <span className="font-semibold text-blue-300">{c.redeemedCount}</span>
          {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ' ครั้ง (ไม่จำกัด)'}
          {c.maxRedemptions != null && (
            <span className="ml-2 text-xs text-slate-500">
              เหลือ {Math.max(0, c.maxRedemptions - c.redeemedCount)} สิทธิ์
            </span>
          )}
        </div>
      )}

      <Section title="รหัส & ส่วนลด">
        <Field label="รหัสคูปอง" value={a.code} onChange={(v) => set('code', v.toUpperCase())} placeholder="เช่น MONTH20" />
        <TextArea label="คำอธิบาย (ภายใน)" value={a.description} onChange={(v) => set('description', v)} rows={2} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="ประเภทส่วนลด"
            value={a.discountType}
            onChange={(v) => set('discountType', v as 'PERCENT' | 'FIXED')}
            options={[
              { v: 'PERCENT', label: 'ส่วนลดเป็น %' },
              { v: 'FIXED', label: 'ลดเป็นจำนวนเงิน (฿)' },
            ]}
          />
          <Field label="มูลค่าส่วนลด" value={a.discountValue} onChange={(v) => set('discountValue', v)} type="number" placeholder={a.discountType === 'PERCENT' ? 'เช่น 20' : 'เช่น 500'} />
        </div>
      </Section>

      <Section title="จำนวนจำกัด & เงื่อนไข" hint="เว้นว่าง = ไม่จำกัด">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="จำนวนคูปองทั้งหมด (จำกัด)" value={a.maxRedemptions} onChange={(v) => set('maxRedemptions', v)} type="number" placeholder="เว้นว่าง = ไม่จำกัด" />
          <Field label="จำกัดต่ออีเมล (ครั้ง)" value={a.perEmailLimit} onChange={(v) => set('perEmailLimit', v)} type="number" placeholder="เว้นว่าง = ไม่จำกัด" />
        </div>
        <Field label="ยอดซื้อขั้นต่ำ (฿)" value={a.minPurchase} onChange={(v) => set('minPurchase', v)} type="number" placeholder="ไม่บังคับ" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="เริ่ม" value={a.startsAt} onChange={(v) => set('startsAt', v)} type="datetime-local" />
          <Field label="สิ้นสุด" value={a.endsAt} onChange={(v) => set('endsAt', v)} type="datetime-local" />
        </div>
        <Toggle label="เปิดใช้งาน" checked={a.active} onChange={(v) => set('active', v)} />
      </Section>
    </div>
  );
}
