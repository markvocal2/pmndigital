import { adminGetSettings } from '@/lib/cms';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await adminGetSettings();
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">ตั้งค่าเว็บไซต์</h1>
      <p className="mt-1 mb-6 text-sm text-slate-400">
        โลโก้ Light/Dark · ชื่อเว็บ · TimeZone · ช่องทางติดต่อ · SEO เริ่มต้น
      </p>
      <SettingsForm settings={settings} />
    </div>
  );
}
