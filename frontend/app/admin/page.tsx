import Link from 'next/link';
import { adminGetSettings, adminListArticles, adminListLeads } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [settings, leads, articles] = await Promise.all([
    adminGetSettings().catch(() => null),
    adminListLeads('limit=1').catch(() => ({ total: 0 })),
    adminListArticles('limit=1').catch(() => ({ total: 0 })),
  ]);

  const cards = [
    { label: 'รายชื่อติดต่อ (Leads)', value: leads.total, href: '/admin/leads' },
    { label: 'บทความทั้งหมด', value: articles.total, href: '/admin/articles' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">แดชบอร์ด</h1>
      <p className="mt-1 text-sm text-slate-400">
        จัดการเว็บไซต์ {settings?.siteName ?? 'PMN Digital'} — เนื้อหาหน้าหลัก, ตั้งค่า, บทความ และรายชื่อติดต่อ
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <div className="text-3xl font-bold">{c.value}</div>
            <div className="mt-1 text-sm text-slate-400">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/settings" className="rounded-xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-blue-400/40 hover:bg-blue-500/[0.06]">
          <div className="font-semibold">ตั้งค่าเว็บไซต์</div>
          <div className="mt-1 text-xs text-slate-400">โลโก้ Light/Dark, ชื่อเว็บ, TimeZone, SEO, ช่องทางติดต่อ</div>
        </Link>
        <Link href="/admin/home" className="rounded-xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-blue-400/40 hover:bg-blue-500/[0.06]">
          <div className="font-semibold">จัดการหน้าหลัก</div>
          <div className="mt-1 text-xs text-slate-400">แก้ทุก section ของหน้าแรก</div>
        </Link>
        <Link href="/admin/articles" className="rounded-xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-blue-400/40 hover:bg-blue-500/[0.06]">
          <div className="font-semibold">บทความ (SEO/GEO)</div>
          <div className="mt-1 text-xs text-slate-400">เขียน/แก้บทความ พร้อม SEO และ GEO</div>
        </Link>
      </div>
    </div>
  );
}
