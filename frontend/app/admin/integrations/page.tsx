import { adminListIntegrations } from '@/lib/cms';
import { IntegrationsForm } from '@/components/admin/IntegrationsForm';

export const dynamic = 'force-dynamic';

export default async function AdminIntegrationsPage() {
  const items = await adminListIntegrations();
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">การเชื่อมต่อ AI (Integrations)</h1>
      <p className="mt-1 mb-6 max-w-2xl text-sm text-slate-400">
        ตั้งค่า credential ของผู้ให้บริการ AI — เก็บแบบ <strong>เข้ารหัสในฐานข้อมูล</strong> (ไม่ใช่ .env) แล้วกด
        “ทดสอบการเชื่อมต่อ”. Claude = เขียนบทความ/งานอัตโนมัติ · Gemini = สร้างภาพ.
        หมายเหตุ: เมื่อสั่งงานผ่าน Claude Connect (claude.ai) จะใช้ subscription ของคุณอยู่แล้ว credential นี้ใช้สำหรับงานฝั่งเซิร์ฟเวอร์.
      </p>
      <IntegrationsForm items={items} />
    </div>
  );
}
