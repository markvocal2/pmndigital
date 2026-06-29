'use client';

import { useEffect, useState } from 'react';
import type { ArticleComment } from '@/lib/cms';
import { fetchComments, postComment, pingView } from '@/lib/blog-client';

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}
function fmt(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Comments({ slug }: { slug: string }) {
  const [list, setList] = useState<ArticleComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ authorName: '', authorEmail: '', body: '', hp: '' });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    pingView(slug);
    fetchComments(slug).then((c) => {
      setList(c);
      setLoaded(true);
    });
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.authorName.trim() || !form.body.trim()) {
      setErr('กรุณากรอกชื่อและความคิดเห็น');
      return;
    }
    setSending(true);
    const r = await postComment(slug, {
      authorName: form.authorName.trim(),
      authorEmail: form.authorEmail.trim() || undefined,
      body: form.body.trim(),
      hp: form.hp,
    });
    setSending(false);
    if (!r.ok) {
      setErr(r.error || 'ส่งความคิดเห็นไม่สำเร็จ');
      return;
    }
    setDone(true);
    setForm({ authorName: '', authorEmail: '', body: '', hp: '' });
  }

  const input =
    'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-blue-400/60';

  return (
    <section className="mx-auto mt-14 max-w-[720px] border-t border-white/10 px-6 pt-10">
      <h2 className="mb-6 text-xl font-bold">
        ความคิดเห็น {loaded && <span className="text-slate-500">({list.length})</span>}
      </h2>

      <div className="space-y-5">
        {loaded && list.length === 0 && (
          <p className="text-sm text-slate-500">ยังไม่มีความคิดเห็น — เป็นคนแรกที่ร่วมแสดงความคิดเห็น</p>
        )}
        {list.map((c) => (
          <div key={c.id} className="flex gap-3.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500/40 to-blue-700/30 text-sm font-semibold text-blue-50">
              {initials(c.authorName)}
            </div>
            <div className="flex-1 rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.02] px-4 py-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-100">{c.authorName}</span>
                <span className="font-mono text-[11px] text-slate-500">{fmt(c.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#C7D0E0]">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.015] p-5">
        <h3 className="mb-1 text-base font-semibold">ร่วมแสดงความคิดเห็น</h3>
        <p className="mb-4 text-xs text-slate-500">ความคิดเห็นจะแสดงหลังผ่านการอนุมัติจากผู้ดูแลระบบ</p>
        {done ? (
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">
            ✓ ส่งความคิดเห็นเรียบร้อยแล้ว — รอผู้ดูแลอนุมัติก่อนแสดงผล ขอบคุณครับ
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {/* honeypot */}
            <input
              type="text"
              value={form.hp}
              onChange={(e) => setForm((p) => ({ ...p, hp: e.target.value }))}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className={input}
                placeholder="ชื่อของคุณ *"
                value={form.authorName}
                onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
              />
              <input
                className={input}
                placeholder="อีเมล (ไม่บังคับ · ไม่แสดงสาธารณะ)"
                value={form.authorEmail}
                onChange={(e) => setForm((p) => ({ ...p, authorEmail: e.target.value }))}
              />
            </div>
            <textarea
              className={input}
              rows={4}
              placeholder="แสดงความคิดเห็น…"
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
            />
            {err && <p className="text-sm text-rose-400">{err}</p>}
            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {sending ? 'กำลังส่ง…' : 'ส่งความคิดเห็น'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
