import { adminListAutomation } from '@/lib/cms';
import { AutomationPanel } from '@/components/admin/AutomationPanel';

export const dynamic = 'force-dynamic';

export default async function AdminAutomationPage() {
  const items = await adminListAutomation();
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">งานอัตโนมัติ (Automation)</h1>
      <p className="mt-1 mb-6 text-sm text-slate-400">
        ตั้งเวลาให้ระบบทำงานเองด้วย AI — เปิด/ปิดแต่ละงาน ปรับค่า แล้วกด “รันเดี๋ยวนี้” เพื่อทดสอบได้.
        งานที่ใช้ AI ต้องตั้งค่า API key ที่หน้า <a href="/admin/integrations" className="text-blue-300 hover:underline">การเชื่อมต่อ AI</a> ก่อน
        และผลที่สร้าง (บทความ) จะเป็น <b>ฉบับร่าง</b> เสมอ
      </p>
      <AutomationPanel items={items} />
    </div>
  );
}
