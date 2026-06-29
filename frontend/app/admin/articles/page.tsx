import Link from 'next/link';
import { adminListArticles } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export default async function AdminArticlesPage() {
  const { items } = await adminListArticles('limit=100');
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">บทความ</h1>
          <p className="mt-1 text-sm text-slate-400">เขียน/แก้บทความ พร้อม SEO และ GEO</p>
        </div>
        <Link href="/admin/articles/new" className="rounded-md bg-blue-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          + เขียนบทความ
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs text-slate-400">
            <tr>
              <th className="px-4 py-3">หัวข้อ</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3">เผยแพร่</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((art) => (
              <tr key={art.id} className="border-t border-white/[0.06]">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-100">{art.title}</div>
                  <div className="font-mono text-xs text-slate-500">/blog/{art.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={art.status === 'PUBLISHED' ? 'rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300' : 'rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300'}>
                    {art.status === 'PUBLISHED' ? 'เผยแพร่' : 'ฉบับร่าง'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{art.publishedAt ? new Date(art.publishedAt).toLocaleDateString('th-TH') : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/articles/${art.id}/edit`} className="text-blue-300 hover:text-blue-200">แก้ไข</Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">ยังไม่มีบทความ — กด “เขียนบทความ” เพื่อเริ่ม</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
