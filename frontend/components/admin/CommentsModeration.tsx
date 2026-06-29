'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AdminComment } from '@/lib/cms';
import { setCommentStatusAction, deleteCommentAction } from '@/lib/cms-actions';

const TABS = [
  { key: 'ALL', label: 'ทั้งหมด' },
  { key: 'PENDING', label: 'รออนุมัติ' },
  { key: 'APPROVED', label: 'อนุมัติแล้ว' },
  { key: 'REJECTED', label: 'ปฏิเสธ' },
];

const BADGE: Record<string, string> = {
  PENDING: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  APPROVED: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  REJECTED: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
};
const BADGE_LABEL: Record<string, string> = { PENDING: 'รออนุมัติ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ปฏิเสธ' };

function fmt(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

export function CommentsModeration({
  items,
  status,
  total,
}: {
  items: AdminComment[];
  status: string;
  total: number;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(id: number, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    setBusyId(id);
    const r = await fn();
    setBusyId(null);
    if (!r.ok) setError(r.error || 'ทำรายการไม่สำเร็จ');
    else router.refresh();
  }

  const tab = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm transition ${active ? 'bg-blue-500/20 font-semibold text-blue-100 ring-1 ring-blue-400/40' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`;
  const btn = (tone: 'green' | 'amber' | 'red') => {
    const c =
      tone === 'green'
        ? 'border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10'
        : tone === 'amber'
          ? 'border-amber-400/30 text-amber-300 hover:bg-amber-400/10'
          : 'border-rose-400/30 text-rose-300 hover:bg-rose-400/10';
    return `rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${c}`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">ความคิดเห็น (Comments)</h1>
      <p className="mt-1 mb-6 text-sm text-slate-400">ตรวจและอนุมัติก่อนแสดงบนหน้าเว็บ · ทั้งหมด {total} รายการ</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.key} href={t.key === 'ALL' ? '/admin/comments' : `/admin/comments?status=${t.key}`} className={tab(status === t.key)}>
            {t.label}
          </Link>
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-300">{error}</p>}

      {items.length === 0 ? (
        <p className="py-16 text-center text-slate-500">ไม่มีความคิดเห็นในหมวดนี้</p>
      ) : (
        <div className="space-y-4">
          {items.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-semibold text-slate-100">{c.authorName}</span>
                {c.authorEmail && <span className="font-mono text-xs text-slate-500">{c.authorEmail}</span>}
                <span className={`rounded-full border px-2 py-0.5 text-[11px] ${BADGE[c.status]}`}>{BADGE_LABEL[c.status]}</span>
                <span className="ml-auto font-mono text-[11px] text-slate-500">{fmt(c.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#C7D0E0]">{c.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                {c.article ? (
                  <Link href={`/blog/${encodeURIComponent(c.article.slug)}`} target="_blank" className="mr-auto truncate text-xs text-blue-300 hover:underline">
                    บน: {c.article.title} ↗
                  </Link>
                ) : (
                  <span className="mr-auto text-xs text-slate-600">(บทความถูกลบ)</span>
                )}
                {c.status !== 'APPROVED' && (
                  <button disabled={busyId === c.id} onClick={() => run(c.id, () => setCommentStatusAction(c.id, 'APPROVED'))} className={btn('green')}>
                    ✓ อนุมัติ
                  </button>
                )}
                {c.status !== 'REJECTED' && (
                  <button disabled={busyId === c.id} onClick={() => run(c.id, () => setCommentStatusAction(c.id, 'REJECTED'))} className={btn('amber')}>
                    ซ่อน / ปฏิเสธ
                  </button>
                )}
                <button
                  disabled={busyId === c.id}
                  onClick={() => {
                    if (confirm('ลบความคิดเห็นนี้ถาวร?')) void run(c.id, () => deleteCommentAction(c.id));
                  }}
                  className={btn('red')}
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
