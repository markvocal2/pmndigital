import { adminGetHome } from '@/lib/cms';
import { mergeHome } from '@/lib/home-content';
import { HomeEditor } from '@/components/admin/HomeEditor';

export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
  const home = await adminGetHome();
  const content = mergeHome(home.data);
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">จัดการหน้าหลัก</h1>
      <p className="mt-1 mb-6 text-sm text-slate-400">
        แก้เนื้อหาทุก section ของหน้าแรก — ช่องที่ปล่อยว่างจะใช้ค่าเริ่มต้นเดิม กด “บันทึก” แล้วรีเฟรชเว็บเพื่อดูผล
      </p>
      <HomeEditor content={content} />
    </div>
  );
}
