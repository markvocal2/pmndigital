'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Section, Field, TextArea, Toggle, ImageUpload, StatusMsg } from '@/components/admin/ui';
import { savePromotionAction, type PromotionInput } from '@/lib/cms-actions';
import type { DiscountType, Promotion } from '@/lib/cms';
import type { PromoTemplate } from '@/lib/promo-advisor';
import { PromotionAdvisor } from './PromotionAdvisor';

const DISCOUNT_OPTS: { v: DiscountType; label: string }[] = [
  { v: 'PERCENT', label: 'ส่วนลดเป็น %' },
  { v: 'FIXED', label: 'ลดเป็นจำนวนเงิน (฿)' },
  { v: 'BUNDLE', label: 'แพ็กเกจ / Bundle' },
  { v: 'FREE', label: 'ฟรี / ของแถม' },
  { v: 'OTHER', label: 'อื่น ๆ' },
];

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

export function PromotionEditor({ promotion }: { promotion: Promotion | null }) {
  const router = useRouter();
  const p = promotion;
  const [a, setA] = useState(() => ({
    title: p?.title ?? '',
    subtitle: p?.subtitle ?? '',
    description: p?.description ?? '',
    badge: p?.badge ?? '',
    discountType: (p?.discountType ?? 'PERCENT') as DiscountType,
    discountValue: p?.discountValue != null ? String(p.discountValue) : '',
    originalPrice: p?.originalPrice != null ? String(p.originalPrice) : '',
    finalPrice: p?.finalPrice != null ? String(p.finalPrice) : '',
    priceUnit: p?.priceUnit ?? '',
    imageUrl: p?.imageUrl ?? '',
    ctaText: p?.ctaText ?? '',
    ctaUrl: p?.ctaUrl ?? '',
    couponCode: p?.couponCode ?? '',
    terms: p?.terms ?? '',
    highlightColor: p?.highlightColor ?? '',
    startsAt: isoToLocal(p?.startsAt),
    endsAt: isoToLocal(p?.endsAt),
    active: p?.active ?? true,
    featured: p?.featured ?? false,
    sortOrder: p?.sortOrder != null ? String(p.sortOrder) : '0',
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  type FormState = typeof a;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setA((prev) => ({ ...prev, [k]: v }));

  function applyTemplate(t: PromoTemplate) {
    const end = new Date(Date.now() + t.durationDays * 86400000);
    setA((prev) => ({
      ...prev,
      title: t.title,
      badge: t.badge,
      discountType: t.discountType,
      discountValue: t.discountValue ? String(t.discountValue) : prev.discountValue,
      featured: t.featured,
      endsAt: isoToLocal(end.toISOString()),
      terms: t.terms + (t.limitedQty != null ? ` · จำกัด ${t.limitedQty} สิทธิ์ (สร้างคูปองแยกที่เมนูคูปอง)` : ''),
    }));
    setSuccess('นำเทมเพลตมากรอกแล้ว — ปรับแต่งแล้วกดบันทึก');
  }

  async function save() {
    setError(null);
    setSuccess(null);
    if (!a.title.trim()) {
      setError('กรุณากรอกชื่อโปรโมชั่น');
      return;
    }
    setLoading(true);
    const payload: PromotionInput = {
      title: a.title.trim(),
      subtitle: a.subtitle || null,
      description: a.description || null,
      badge: a.badge || null,
      discountType: a.discountType,
      discountValue: a.discountValue === '' ? null : parseFloat(a.discountValue),
      originalPrice: a.originalPrice === '' ? null : parseFloat(a.originalPrice),
      finalPrice: a.finalPrice === '' ? null : parseFloat(a.finalPrice),
      priceUnit: a.priceUnit || null,
      imageUrl: a.imageUrl || null,
      ctaText: a.ctaText || null,
      ctaUrl: a.ctaUrl || null,
      couponCode: a.couponCode ? a.couponCode.toUpperCase() : null,
      terms: a.terms || null,
      highlightColor: a.highlightColor || null,
      startsAt: localToIso(a.startsAt),
      endsAt: localToIso(a.endsAt),
      active: a.active,
      featured: a.featured,
      sortOrder: parseInt(a.sortOrder || '0', 10) || 0,
    };
    const res = await savePromotionAction(p?.id ?? null, payload);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSuccess('บันทึกแล้ว');
    if (!p) router.push('/admin/promotions');
    else router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{p ? 'แก้ไขโปรโมชั่น' : 'สร้างโปรโมชั่น'}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/admin/promotions')}
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

      <PromotionAdvisor
        onApply={applyTemplate}
        onPrice={(orig, final) => {
          set('originalPrice', String(Math.round(orig)));
          set('finalPrice', String(Math.round(final)));
        }}
      />

      <Section title="เนื้อหาโปรโมชั่น" hint="สิ่งที่ลูกค้าเห็นบนการ์ดโปรโมชั่น">
        <Field label="ชื่อโปรโมชั่น" value={a.title} onChange={(v) => set('title', v)} placeholder="เช่น ลด 20% โปรเด็ดประจำเดือน" />
        <Field label="คำโปรย (subtitle)" value={a.subtitle} onChange={(v) => set('subtitle', v)} placeholder="ข้อความรองสั้น ๆ" />
        <Field label="ป้าย (badge)" value={a.badge} onChange={(v) => set('badge', v)} placeholder="เช่น โปรเด็ดประจำเดือน / Flash Sale" />
        <TextArea label="รายละเอียด" value={a.description} onChange={(v) => set('description', v)} rows={3} />
        <ImageUpload label="ภาพ/วิดีโอโปรโมชั่น" value={a.imageUrl} onChange={(u) => set('imageUrl', u)} allowVideo />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ข้อความปุ่ม (CTA)" value={a.ctaText} onChange={(v) => set('ctaText', v)} placeholder="เช่น รับสิทธิ์เลย" />
          <Field label="ลิงก์ปุ่ม (CTA URL)" value={a.ctaUrl} onChange={(v) => set('ctaUrl', v)} placeholder="/#register หรือ https://…" />
        </div>
        <Field label="สีไฮไลต์ (hex)" value={a.highlightColor} onChange={(v) => set('highlightColor', v)} placeholder="#2563EB" />
      </Section>

      <Section title="ส่วนลด & ราคา">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="ประเภทส่วนลด" value={a.discountType} onChange={(v) => set('discountType', v as DiscountType)} options={DISCOUNT_OPTS} />
          <Field label="มูลค่าส่วนลด (% หรือ ฿)" value={a.discountValue} onChange={(v) => set('discountValue', v)} type="number" placeholder="เช่น 20" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="ราคาเดิม (฿)" value={a.originalPrice} onChange={(v) => set('originalPrice', v)} type="number" />
          <Field label="ราคาโปร (฿)" value={a.finalPrice} onChange={(v) => set('finalPrice', v)} type="number" />
          <Field label="หน่วยราคา" value={a.priceUnit} onChange={(v) => set('priceUnit', v)} placeholder="เช่น /โปรเจกต์, /เดือน" />
        </div>
        <Field label="โค้ดคูปองที่ผูก (ถ้ามี)" value={a.couponCode} onChange={(v) => set('couponCode', v)} placeholder="เช่น MONTH20 — สร้างคูปองที่เมนูคูปอง" />
      </Section>

      <Section title="กำหนดเวลา & การแสดงผล" hint="โปรจะแสดงต่อสาธารณะเมื่อ 'เปิดใช้งาน' และอยู่ในช่วงเวลา">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="เริ่ม" value={a.startsAt} onChange={(v) => set('startsAt', v)} type="datetime-local" />
          <Field label="สิ้นสุด" value={a.endsAt} onChange={(v) => set('endsAt', v)} type="datetime-local" />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Toggle label="เปิดใช้งาน" checked={a.active} onChange={(v) => set('active', v)} />
          <Toggle label="โปรเด่น (แสดงหน้าแรก)" checked={a.featured} onChange={(v) => set('featured', v)} />
        </div>
        <Field label="ลำดับการแสดง (เลขน้อยมาก่อน)" value={a.sortOrder} onChange={(v) => set('sortOrder', v)} type="number" />
        <TextArea label="เงื่อนไข (terms)" value={a.terms} onChange={(v) => set('terms', v)} rows={2} />
      </Section>
    </div>
  );
}
