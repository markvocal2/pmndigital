import { adminListLeads } from '@/lib/cms';
import { LeadsTable } from '@/components/admin/LeadsTable';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const { items } = await adminListLeads('limit=200');
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">รายชื่อติดต่อ (Leads)</h1>
      <p className="mt-1 mb-6 text-sm text-slate-400">ข้อมูลจากฟอร์มลงทะเบียน / ติดต่อบนหน้าเว็บ</p>
      <LeadsTable leads={items} />
    </div>
  );
}
