'use client';

import { useState, type ReactNode } from 'react';
import type { HomeData } from '@/lib/home-content';
import { updateHomeAction } from '@/lib/cms-actions';
import { Button } from '@/components/ui/Button';
import { Field, TextArea, StatusMsg } from '@/components/admin/ui';
import { ObjectListEditor, StringListEditor, type FieldDef } from '@/components/admin/ListEditor';

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="mb-3 rounded-xl border border-white/10 bg-white/[0.025]">
      <summary className="cursor-pointer select-none px-5 py-3.5 text-sm font-semibold text-slate-100">{title}</summary>
      <div className="space-y-4 border-t border-white/10 px-5 py-4">{children}</div>
    </details>
  );
}

const SVC_FIELDS: FieldDef[] = [
  { key: 't', label: 'หัวข้อ (EN)' }, { key: 'th', label: 'หัวข้อ (TH)' },
  { key: 'd', label: 'คำอธิบาย', type: 'textarea' }, { key: 'icon', label: 'ไอคอน (db/erp/crm/code)' },
];
const STAT_FIELDS: FieldDef[] = [{ key: 'target', label: 'ตัวเลข', type: 'number' }, { key: 'suffix', label: 'ต่อท้าย (+/%)' }, { key: 'label', label: 'คำอธิบาย' }];
const BENTO_FIELDS: FieldDef[] = [{ key: 'h', label: 'หัวข้อ' }, { key: 'd', label: 'คำอธิบาย', type: 'textarea' }];
const STEP_FIELDS: FieldDef[] = [{ key: 'n', label: 'เลข' }, { key: 't', label: 'หัวข้อ' }, { key: 'd', label: 'คำอธิบาย', type: 'textarea' }];
const WORK_FIELDS: FieldDef[] = [{ key: 'tag', label: 'แท็ก' }, { key: 't', label: 'ชื่อผลงาน' }, { key: 'm', label: 'ผลลัพธ์' }, { key: 'hue', label: 'สี (#hex)' }];
const PRIV_FIELDS: FieldDef[] = [{ key: 't', label: 'สิทธิ์' }, { key: 'd', label: 'รายละเอียด' }];
const QUOTE_FIELDS: FieldDef[] = [{ key: 'q', label: 'คำพูด', type: 'textarea' }, { key: 'n', label: 'ชื่อ' }, { key: 'r', label: 'ตำแหน่ง/บริษัท' }];
const FAQ_FIELDS: FieldDef[] = [{ key: 'q', label: 'คำถาม' }, { key: 'a', label: 'คำตอบ', type: 'textarea' }];
const LOGO_FIELDS: FieldDef[] = [{ key: 'logoUrl', label: 'โลโก้ (PNG/SVG พื้นโปร่งใส แนะนำ)', type: 'image' }, { key: 'name', label: 'ชื่อหน่วยงาน' }, { key: 'url', label: 'ลิงก์เว็บไซต์ (ไม่บังคับ)' }];
const TIER_FIELDS: FieldDef[] = [
  { key: 'name', label: 'ชื่อแพ็กเกจ' }, { key: 'th', label: 'กลุ่มเป้าหมาย' },
  { key: 'base', label: 'ราคาปกติ', type: 'number' }, { key: 'disc', label: 'ราคาลด', type: 'number' },
];
const DETAIL_FIELDS: FieldDef[] = [{ key: 'n', label: 'ป้าย (เช่น 01 · Database)' }, { key: 'h', label: 'หัวข้อ' }, { key: 'p', label: 'คำอธิบาย', type: 'textarea' }];
const MORE_FIELDS: FieldDef[] = [{ key: 'k', label: 'ป้าย' }, { key: 'h', label: 'หัวข้อ' }, { key: 'd', label: 'คำอธิบาย', type: 'textarea' }];
const ALLWORK_FIELDS: FieldDef[] = [{ key: 'cat', label: 'หมวด (erp/crm/database/custom)' }, { key: 'tag', label: 'แท็ก' }, { key: 't', label: 'ชื่อ' }, { key: 'd', label: 'คำอธิบาย', type: 'textarea' }, { key: 'm', label: 'ผลลัพธ์' }];
const PSTAT_FIELDS: FieldDef[] = [{ key: 'v', label: 'ตัวเลข' }, { key: 'l', label: 'คำอธิบาย' }];

export function HomeEditor({ content }: { content: HomeData }) {
  const [d, setD] = useState<HomeData>(content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // generic nested setter for one-level object sections
  const setSec = <K extends keyof HomeData>(sec: K, key: string, value: unknown) =>
    setD((p) => ({ ...p, [sec]: { ...(p[sec] as Record<string, unknown>), [key]: value } }));
  const setTop = <K extends keyof HomeData>(key: K, value: HomeData[K]) =>
    setD((p) => ({ ...p, [key]: value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const res = await updateHomeAction({ data: d as unknown as Record<string, unknown> });
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    setSuccess('บันทึกเนื้อหาหน้าหลักแล้ว (รีเฟรชหน้าเว็บเพื่อดูผล)');
  }

  return (
    <form onSubmit={onSubmit}>
      <Group title="Hero (ส่วนหัว)">
        <Field label="Badge" value={d.hero.badge} onChange={(v) => setSec('hero', 'badge', v)} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="หัวข้อส่วนแรก" value={d.hero.title1} onChange={(v) => setSec('hero', 'title1', v)} />
          <Field label="คำไฮไลต์" value={d.hero.highlight} onChange={(v) => setSec('hero', 'highlight', v)} />
          <Field label="หัวข้อส่วนหลัง (ใส่ <br/> ขึ้นบรรทัด)" value={d.hero.title2} onChange={(v) => setSec('hero', 'title2', v)} />
        </div>
        <TextArea label="คำโปรย" value={d.hero.subtitle} onChange={(v) => setSec('hero', 'subtitle', v)} rows={3} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="ปุ่มหลัก" value={d.hero.ctaPrimary} onChange={(v) => setSec('hero', 'ctaPrimary', v)} />
          <Field label="ปุ่มรอง" value={d.hero.ctaSecondary} onChange={(v) => setSec('hero', 'ctaSecondary', v)} />
        </div>
        <Field label="บรรทัดสถิติใต้ปุ่ม" value={d.hero.statNote} onChange={(v) => setSec('hero', 'statNote', v)} />
      </Group>

      <Group title="ลูกค้าที่ไว้วางใจ (Trusted by)">
        <Field label="หัวข้อแถบ" value={d.trustedLabel} onChange={(v) => setTop('trustedLabel', v)} />
        <ObjectListEditor
          label="โลโก้หน่วยงาน (ถ้ามีโลโก้ จะแสดงแทนรายชื่อ · เทาสว่าง → สีจริงเมื่อชี้เมาส์)"
          items={d.trustedLogos}
          fields={LOGO_FIELDS}
          onChange={(v) => setTop('trustedLogos', v)}
          newItem={() => ({ name: '', logoUrl: '', url: '' })}
        />
        <StringListEditor label="รายชื่อองค์กร (ใช้เมื่อยังไม่มีโลโก้)" items={d.clients} onChange={(v) => setTop('clients', v)} placeholder="ชื่อองค์กร" />
      </Group>

      <Group title="บริการ (Services — 4 การ์ดหน้าแรก)">
        <ObjectListEditor label="การ์ดบริการ" items={d.services} fields={SVC_FIELDS} onChange={(v) => setTop('services', v)} newItem={() => ({ t: '', th: '', d: '', icon: 'code' })} />
      </Group>

      <Group title="สถิติ (Stats — นับเลข)">
        <ObjectListEditor label="ตัวเลขสถิติ" items={d.stats} fields={STAT_FIELDS} onChange={(v) => setTop('stats', v)} newItem={() => ({ target: 0, suffix: '+', label: '' })} />
      </Group>

      <Group title="ทำไมต้อง PMN (Why + Tech)">
        <Field label="Eyebrow" value={d.why.eyebrow} onChange={(v) => setSec('why', 'eyebrow', v)} />
        <Field label="หัวข้อ (ใส่ <br/> ได้)" value={d.why.title} onChange={(v) => setSec('why', 'title', v)} />
        <TextArea label="คำโปรย" value={d.why.subtitle} onChange={(v) => setSec('why', 'subtitle', v)} rows={2} />
        <Field label="หัวข้อ Tech Stack" value={d.why.techTitle} onChange={(v) => setSec('why', 'techTitle', v)} />
        <TextArea label="คำอธิบาย Tech Stack" value={d.why.techDesc} onChange={(v) => setSec('why', 'techDesc', v)} rows={2} />
        <ObjectListEditor label="จุดเด่น (Bento 4 ข้อ)" items={d.why.bento} fields={BENTO_FIELDS} onChange={(v) => setSec('why', 'bento', v)} newItem={() => ({ h: '', d: '' })} />
        <StringListEditor label="เทคโนโลยี (chips)" items={d.techs} onChange={(v) => setTop('techs', v)} placeholder="เช่น PostgreSQL" />
      </Group>

      <Group title="กระบวนการทำงาน (Process)">
        <ObjectListEditor label="ขั้นตอน" items={d.process} fields={STEP_FIELDS} onChange={(v) => setTop('process', v)} newItem={() => ({ n: '', t: '', d: '' })} />
      </Group>

      <Group title="ผลงานหน้าแรก (Works preview)">
        <ObjectListEditor label="ผลงาน (3 ชิ้น)" items={d.works} fields={WORK_FIELDS} onChange={(v) => setTop('works', v)} newItem={() => ({ tag: '', t: '', m: '', hue: '#2563EB' })} />
      </Group>

      <Group title="แพ็กเกจราคา (Pricing tiers)">
        <ObjectListEditor
          label="แพ็กเกจ (ราคา 0 + ตั้ง custom สำหรับ Enterprise)"
          items={d.pricing.tiers as unknown as Record<string, unknown>[]}
          fields={TIER_FIELDS}
          onChange={(v) => setD((p) => ({ ...p, pricing: { tiers: v as unknown as HomeData['pricing']['tiers'] } }))}
          newItem={() => ({ name: '', th: '', base: 0, disc: 0, custom: false, feats: [], popular: false })}
        />
        <p className="text-xs text-slate-500">* รายการคุณสมบัติ (feats), custom, popular แก้ได้ผ่าน JSON ในรุ่นถัดไป — ตอนนี้แก้ชื่อ/ราคาได้</p>
      </Group>

      <Group title="ลงทะเบียนรับสิทธิ์ (Register)">
        <Field label="หัวข้อ (ใส่ <br/> ได้)" value={d.register.title} onChange={(v) => setSec('register', 'title', v)} />
        <TextArea label="คำโปรย" value={d.register.subtitle} onChange={(v) => setSec('register', 'subtitle', v)} rows={2} />
        <Field label="โค้ดคูปอง" value={d.register.couponCode} onChange={(v) => setSec('register', 'couponCode', v)} />
        <ObjectListEditor label="สิทธิพิเศษ" items={d.register.privileges} fields={PRIV_FIELDS} onChange={(v) => setSec('register', 'privileges', v)} newItem={() => ({ t: '', d: '' })} />
      </Group>

      <Group title="รีวิวลูกค้า (Testimonials)">
        <ObjectListEditor label="รีวิว" items={d.testimonials} fields={QUOTE_FIELDS} onChange={(v) => setTop('testimonials', v)} newItem={() => ({ q: '', n: '', r: '' })} />
      </Group>

      <Group title="แถบ CTA ปิดท้าย">
        <Field label="หัวข้อ" value={d.ctaBand.title} onChange={(v) => setSec('ctaBand', 'title', v)} />
        <TextArea label="คำโปรย" value={d.ctaBand.subtitle} onChange={(v) => setSec('ctaBand', 'subtitle', v)} rows={2} />
      </Group>

      <Group title="หน้า Services (รายละเอียดบริการ)">
        <Field label="หัวข้อ" value={d.servicesPage.title} onChange={(v) => setSec('servicesPage', 'title', v)} />
        <Field label="หัวข้อรอง (สีจาง)" value={d.servicesPage.titleMuted} onChange={(v) => setSec('servicesPage', 'titleMuted', v)} />
        <TextArea label="คำโปรย" value={d.servicesPage.subtitle} onChange={(v) => setSec('servicesPage', 'subtitle', v)} rows={2} />
        <ObjectListEditor label="รายละเอียดบริการ (การ์ดใหญ่)" items={d.servicesPage.details as unknown as Record<string, unknown>[]} fields={DETAIL_FIELDS} onChange={(v) => setSec('servicesPage', 'details', v)} newItem={() => ({ n: '', h: '', p: '', feats: [] })} />
        <Field label="หัวข้อบริการเสริม" value={d.servicesPage.moreTitle} onChange={(v) => setSec('servicesPage', 'moreTitle', v)} />
        <ObjectListEditor label="บริการเสริม" items={d.servicesPage.more} fields={MORE_FIELDS} onChange={(v) => setSec('servicesPage', 'more', v)} newItem={() => ({ k: '', h: '', d: '' })} />
        <Field label="หัวข้อ Expertise" value={d.servicesPage.expertiseTitle} onChange={(v) => setSec('servicesPage', 'expertiseTitle', v)} />
        <TextArea label="คำอธิบาย Expertise" value={d.servicesPage.expertiseDesc} onChange={(v) => setSec('servicesPage', 'expertiseDesc', v)} rows={2} />
      </Group>

      <Group title="หน้า Portfolio">
        <Field label="หัวข้อ" value={d.portfolio.title} onChange={(v) => setSec('portfolio', 'title', v)} />
        <Field label="หัวข้อรอง (สีจาง)" value={d.portfolio.titleMuted} onChange={(v) => setSec('portfolio', 'titleMuted', v)} />
        <TextArea label="คำโปรย" value={d.portfolio.subtitle} onChange={(v) => setSec('portfolio', 'subtitle', v)} rows={2} />
        <ObjectListEditor label="ผลงานทั้งหมด" items={d.portfolio.allWork as unknown as Record<string, unknown>[]} fields={ALLWORK_FIELDS} onChange={(v) => setSec('portfolio', 'allWork', v)} newItem={() => ({ cat: 'custom', tag: '', t: '', d: '', m: '' })} />
        <ObjectListEditor label="สถิติพอร์ต" items={d.portfolio.stats as unknown as Record<string, unknown>[]} fields={PSTAT_FIELDS} onChange={(v) => setSec('portfolio', 'stats', v)} newItem={() => ({ v: '', l: '' })} />
      </Group>

      <Group title="หน้า Pricing (หัวข้อ)">
        <Field label="หัวข้อ" value={d.pricingPage.title} onChange={(v) => setSec('pricingPage', 'title', v)} />
        <Field label="หัวข้อรอง (สีจาง)" value={d.pricingPage.titleMuted} onChange={(v) => setSec('pricingPage', 'titleMuted', v)} />
        <TextArea label="คำโปรย" value={d.pricingPage.subtitle} onChange={(v) => setSec('pricingPage', 'subtitle', v)} rows={2} />
      </Group>

      <Group title="คำถามที่พบบ่อย (FAQ)">
        <ObjectListEditor label="FAQ" items={d.faqs} fields={FAQ_FIELDS} onChange={(v) => setTop('faqs', v)} newItem={() => ({ q: '', a: '' })} />
      </Group>

      <Group title="ติดต่อ (Contact)">
        <Field label="หัวข้อ" value={d.contact.title} onChange={(v) => setSec('contact', 'title', v)} />
        <Field label="หัวข้อรอง (สีจาง)" value={d.contact.titleMuted} onChange={(v) => setSec('contact', 'titleMuted', v)} />
        <TextArea label="คำโปรย" value={d.contact.subtitle} onChange={(v) => setSec('contact', 'subtitle', v)} rows={2} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="อีเมล" value={d.contact.email} onChange={(v) => setSec('contact', 'email', v)} />
          <Field label="เบอร์โทร" value={d.contact.phone} onChange={(v) => setSec('contact', 'phone', v)} />
          <Field label="ออฟฟิศ" value={d.contact.office} onChange={(v) => setSec('contact', 'office', v)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="เวลาทำการ จ-ศ" value={d.contact.hoursWeekday} onChange={(v) => setSec('contact', 'hoursWeekday', v)} />
          <Field label="เวลาทำการ ส-อา" value={d.contact.hoursWeekend} onChange={(v) => setSec('contact', 'hoursWeekend', v)} />
          <Field label="หมายเหตุการตอบกลับ" value={d.contact.responseNote} onChange={(v) => setSec('contact', 'responseNote', v)} />
        </div>
      </Group>

      <Group title="Footer">
        <TextArea label="คำอธิบายใต้โลโก้" value={d.footer.desc} onChange={(v) => setSec('footer', 'desc', v)} rows={2} />
      </Group>

      <div className="sticky bottom-0 -mx-4 mt-4 flex items-center gap-4 border-t border-white/10 bg-[#070A12]/95 px-4 py-3 backdrop-blur">
        <Button type="submit" loading={loading} className="!w-auto px-8">บันทึก</Button>
        <div className="flex-1"><StatusMsg error={error} success={success} /></div>
      </div>
    </form>
  );
}
