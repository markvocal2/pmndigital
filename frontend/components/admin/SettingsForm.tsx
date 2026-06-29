'use client';

import { useState } from 'react';
import type { SiteSettings } from '@/lib/cms';
import { updateSettingsAction } from '@/lib/cms-actions';
import { Button } from '@/components/ui/Button';
import { Section, Field, TextArea, Toggle, ImageUpload, StatusMsg } from '@/components/admin/ui';

const TIMEZONES = [
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'UTC',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
];

const SOCIAL_KEYS = ['facebook', 'x', 'instagram', 'linkedin', 'youtube', 'line', 'tiktok'] as const;

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [s, setS] = useState({
    siteName: settings.siteName ?? '',
    siteNameEn: settings.siteNameEn ?? '',
    tagline: settings.tagline ?? '',
    logoLightUrl: settings.logoLightUrl ?? '',
    logoDarkUrl: settings.logoDarkUrl ?? '',
    faviconUrl: settings.faviconUrl ?? '',
    ogDefaultUrl: settings.ogDefaultUrl ?? '',
    timezone: settings.timezone ?? 'Asia/Bangkok',
    defaultLocale: settings.defaultLocale ?? 'th',
    themeDefault: settings.themeDefault ?? 'dark',
    contactEmail: settings.contactEmail ?? '',
    contactPhone: settings.contactPhone ?? '',
    contactAddress: settings.contactAddress ?? '',
    geoLat: settings.geoLat != null ? String(settings.geoLat) : '',
    geoLng: settings.geoLng != null ? String(settings.geoLng) : '',
    mapUrl: settings.mapUrl ?? '',
    defaultMetaTitle: settings.defaultMetaTitle ?? '',
    defaultMetaDesc: settings.defaultMetaDesc ?? '',
    defaultKeywords: settings.defaultKeywords ?? '',
    gaId: settings.gaId ?? '',
    gtmId: settings.gtmId ?? '',
    maintenanceMode: settings.maintenanceMode ?? false,
  });
  const [socials, setSocials] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const k of SOCIAL_KEYS) init[k] = (settings.socials?.[k] as string) ?? '';
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const set = (k: keyof typeof s) => (v: string | boolean) => setS((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const cleanSocials: Record<string, string> = {};
    for (const k of SOCIAL_KEYS) if (socials[k]?.trim()) cleanSocials[k] = socials[k].trim();
    const payload: Record<string, unknown> = {
      siteName: s.siteName,
      siteNameEn: s.siteNameEn,
      tagline: s.tagline,
      logoLightUrl: s.logoLightUrl,
      logoDarkUrl: s.logoDarkUrl,
      faviconUrl: s.faviconUrl,
      ogDefaultUrl: s.ogDefaultUrl,
      timezone: s.timezone,
      defaultLocale: s.defaultLocale,
      themeDefault: s.themeDefault,
      contactEmail: s.contactEmail,
      contactPhone: s.contactPhone,
      contactAddress: s.contactAddress,
      mapUrl: s.mapUrl,
      socials: cleanSocials,
      defaultMetaTitle: s.defaultMetaTitle,
      defaultMetaDesc: s.defaultMetaDesc,
      defaultKeywords: s.defaultKeywords,
      gaId: s.gaId,
      gtmId: s.gtmId,
      maintenanceMode: s.maintenanceMode,
    };
    const lat = parseFloat(s.geoLat);
    const lng = parseFloat(s.geoLng);
    if (Number.isFinite(lat)) payload.geoLat = lat;
    if (Number.isFinite(lng)) payload.geoLng = lng;

    const res = await updateSettingsAction(payload);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSuccess('บันทึกการตั้งค่าแล้ว');
  }

  return (
    <form onSubmit={onSubmit}>
      <Section title="ข้อมูลเว็บไซต์" hint="ชื่อเว็บ · คำโปรย">
        <Field label="ชื่อเว็บไซต์ (ไทย)" value={s.siteName} onChange={set('siteName') as (v: string) => void} />
        <Field label="ชื่อเว็บไซต์ (อังกฤษ)" value={s.siteNameEn} onChange={set('siteNameEn') as (v: string) => void} />
        <Field label="คำโปรย (Tagline)" value={s.tagline} onChange={set('tagline') as (v: string) => void} />
      </Section>

      <Section title="โลโก้ & ไอคอน" hint="โลโก้สำหรับพื้นมืด (Dark) / พื้นสว่าง (Light) และ favicon">
        <div className="grid gap-5 sm:grid-cols-2">
          <ImageUpload label="โลโก้ — Dark mode (พื้นมืด)" value={s.logoDarkUrl} onChange={(u) => set('logoDarkUrl')(u)} dark />
          <ImageUpload label="โลโก้ — Light mode (พื้นสว่าง)" value={s.logoLightUrl} onChange={(u) => set('logoLightUrl')(u)} dark={false} />
          <ImageUpload label="Favicon" value={s.faviconUrl} onChange={(u) => set('faviconUrl')(u)} />
          <ImageUpload label="OG Image (แชร์โซเชียล)" value={s.ogDefaultUrl} onChange={(u) => set('ogDefaultUrl')(u)} />
        </div>
      </Section>

      <Section title="ภูมิภาค & ธีม" hint="TimeZone · ภาษา · โหมดสี">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">TimeZone</span>
            <select
              value={s.timezone}
              onChange={(e) => set('timezone')(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-400/60"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz} className="bg-[#0b1020]">{tz}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">ภาษาเริ่มต้น</span>
            <select value={s.defaultLocale} onChange={(e) => set('defaultLocale')(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-400/60">
              <option value="th" className="bg-[#0b1020]">ไทย (th)</option>
              <option value="en" className="bg-[#0b1020]">English (en)</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">โหมดสีเริ่มต้น</span>
            <select value={s.themeDefault} onChange={(e) => set('themeDefault')(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-400/60">
              <option value="dark" className="bg-[#0b1020]">Dark</option>
              <option value="light" className="bg-[#0b1020]">Light</option>
            </select>
          </label>
        </div>
      </Section>

      <Section title="ช่องทางติดต่อ & ที่ตั้ง (GEO)" hint="อีเมล · เบอร์ · ที่อยู่ · พิกัดแผนที่">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="อีเมล" value={s.contactEmail} onChange={set('contactEmail') as (v: string) => void} />
          <Field label="เบอร์โทร" value={s.contactPhone} onChange={set('contactPhone') as (v: string) => void} />
        </div>
        <TextArea label="ที่อยู่" value={s.contactAddress} onChange={set('contactAddress') as (v: string) => void} rows={2} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="ละติจูด (lat)" value={s.geoLat} onChange={set('geoLat') as (v: string) => void} placeholder="13.7563" />
          <Field label="ลองจิจูด (lng)" value={s.geoLng} onChange={set('geoLng') as (v: string) => void} placeholder="100.5018" />
          <Field label="ลิงก์แผนที่ (Google Maps)" value={s.mapUrl} onChange={set('mapUrl') as (v: string) => void} />
        </div>
      </Section>

      <Section title="โซเชียล" hint="ใส่ URL เต็ม (ปล่อยว่างได้)">
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_KEYS.map((k) => (
            <Field
              key={k}
              label={k.toUpperCase()}
              value={socials[k]}
              onChange={(v) => setSocials((p) => ({ ...p, [k]: v }))}
              placeholder="https://"
            />
          ))}
        </div>
      </Section>

      <Section title="SEO เริ่มต้น & Analytics" hint="meta เริ่มต้นทั้งเว็บ · Google Analytics / Tag Manager">
        <Field label="Meta Title เริ่มต้น" value={s.defaultMetaTitle} onChange={set('defaultMetaTitle') as (v: string) => void} />
        <TextArea label="Meta Description เริ่มต้น" value={s.defaultMetaDesc} onChange={set('defaultMetaDesc') as (v: string) => void} rows={2} />
        <Field label="Keywords (คั่นด้วย ,)" value={s.defaultKeywords} onChange={set('defaultKeywords') as (v: string) => void} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Google Analytics ID (G-XXXX)" value={s.gaId} onChange={set('gaId') as (v: string) => void} />
          <Field label="Google Tag Manager ID (GTM-XXXX)" value={s.gtmId} onChange={set('gtmId') as (v: string) => void} />
        </div>
      </Section>

      <Section title="ระบบ" hint="โหมดปิดปรับปรุง">
        <Toggle label="เปิดโหมดปิดปรับปรุง (Maintenance)" checked={s.maintenanceMode} onChange={(v) => set('maintenanceMode')(v)} />
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-4 border-t border-white/10 bg-[#070A12]/95 px-4 py-3 backdrop-blur">
        <Button type="submit" loading={loading} className="!w-auto px-8">บันทึก</Button>
        <div className="flex-1"><StatusMsg error={error} success={success} /></div>
      </div>
    </form>
  );
}
