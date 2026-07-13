import Link from 'next/link';
import { adminListArticles, adminGetSparklines, adminGetTraffic, type TrafficBreakdown } from '@/lib/cms';
import { Sparkline } from '@/components/admin/Sparkline';

export const dynamic = 'force-dynamic';

const SOURCE_LABEL: Record<string, string> = {
  organic: 'ค้นหา (Search)',
  direct: 'เข้าตรง (Direct)',
  social: 'โซเชียล',
  referral: 'เว็บอ้างอิง',
  internal: 'ภายในเว็บ',
  campaign: 'แคมเปญ (UTM)',
};
const SOURCE_COLOR: Record<string, string> = {
  organic: 'bg-emerald-400',
  direct: 'bg-sky-400',
  social: 'bg-violet-400',
  referral: 'bg-amber-400',
  internal: 'bg-slate-400',
  campaign: 'bg-pink-400',
};
const nf = (n: number) => n.toLocaleString('th-TH');

function TrafficPanel({ t }: { t: TrafficBreakdown }) {
  const denom = t.human + t.bot;
  const humanPct = denom ? Math.round((t.human / denom) * 100) : 0;
  const botPct = denom ? 100 - humanPct : 0;
  const srcMax = Math.max(1, ...t.sources.map((s) => s.count));

  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-3">
      {/* human vs bot */}
      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
        <div className="text-xs text-slate-400">ผู้เข้าชม {t.days} วันล่าสุด</div>
        <div className="mt-1 text-3xl font-bold">{nf(t.human)}</div>
        <div className="text-xs text-slate-400">คนจริง (จาก {nf(t.total)} ครั้ง รวมบอต)</div>
        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-emerald-400" style={{ width: humanPct + '%' }} />
          <div className="h-full bg-rose-400/70" style={{ width: botPct + '%' }} />
        </div>
        <div className="mt-2 flex justify-between text-xs">
          <span className="text-emerald-300">● คนจริง {humanPct}%</span>
          <span className="text-rose-300">● บอต {botPct}% ({nf(t.bot)})</span>
        </div>
      </div>

      {/* sources */}
      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
        <div className="text-xs text-slate-400">แหล่งที่มา (คนจริง)</div>
        {t.sources.length === 0 && <div className="mt-3 text-sm text-slate-500">ยังไม่มีข้อมูล</div>}
        <div className="mt-3 space-y-2">
          {t.sources.map((s) => (
            <div key={s.key}>
              <div className="flex justify-between text-xs text-slate-300">
                <span>{SOURCE_LABEL[s.key] ?? s.key}</span>
                <span className="text-slate-400">{nf(s.count)}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={'h-full ' + (SOURCE_COLOR[s.key] ?? 'bg-slate-400')}
                  style={{ width: Math.round((s.count / srcMax) * 100) + '%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* countries + referrers */}
      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
        <div className="text-xs text-slate-400">ประเทศผู้เข้าชม</div>
        {t.countries.length === 0 && <div className="mt-2 text-sm text-slate-500">ยังไม่มีข้อมูล</div>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {t.countries.map((c) => (
            <span key={c.key} className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-slate-300">
              {c.key} · {nf(c.count)}
            </span>
          ))}
        </div>
        {t.referrers.length > 0 && (
          <>
            <div className="mt-4 text-xs text-slate-400">เว็บอ้างอิงยอดนิยม</div>
            <div className="mt-2 space-y-1">
              {t.referrers.slice(0, 5).map((r) => (
                <div key={r.key} className="flex justify-between text-xs text-slate-300">
                  <span className="truncate pr-2">{r.key}</span>
                  <span className="text-slate-400">{nf(r.count)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default async function AdminArticlesPage() {
  const [{ items }, sparks, traffic] = await Promise.all([
    adminListArticles('limit=100'),
    adminGetSparklines(30),
    adminGetTraffic(30),
  ]);

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

      <TrafficPanel t={traffic} />

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-white/[0.03] text-left text-xs text-slate-400">
            <tr>
              <th className="px-4 py-3">หัวข้อ</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3">เผยแพร่</th>
              <th className="px-4 py-3">แนวโน้มผู้เข้าชม (30 วัน)</th>
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
                <td className="px-4 py-3">
                  <Sparkline data={sparks[art.id] ?? []} />
                  <div className="mt-0.5 text-[10px] text-slate-500">ทั้งหมด {nf(art.viewCount)}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/articles/${art.id}/edit`} className="text-blue-300 hover:text-blue-200">แก้ไข</Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">ยังไม่มีบทความ — กด “เขียนบทความ” เพื่อเริ่ม</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
