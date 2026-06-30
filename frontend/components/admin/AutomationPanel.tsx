'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AutomationJobStatus } from '@/lib/cms';
import { updateAutomationAction, runAutomationAction } from '@/lib/cms-actions';

function lastRunLabel(s: AutomationJobStatus): { text: string; cls: string } {
  const map: Record<string, { text: string; cls: string }> = {
    ok: { text: '✓ สำเร็จ', cls: 'text-emerald-300' },
    error: { text: '✗ ผิดพลาด', cls: 'text-rose-300' },
    skipped: { text: '– ข้าม', cls: 'text-slate-400' },
  };
  return s.lastStatus ? map[s.lastStatus] ?? { text: s.lastStatus, cls: 'text-slate-300' } : { text: 'ยังไม่เคยรัน', cls: 'text-slate-500' };
}

function JobCard({ init }: { init: AutomationJobStatus }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(init.enabled);
  const [cfg, setCfg] = useState<Record<string, unknown>>(init.config ?? {});
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const setC = (k: string, v: unknown) => setCfg((p) => ({ ...p, [k]: v }));

  const save = () =>
    start(async () => {
      const r = await updateAutomationAction(init.key, { enabled, config: cfg });
      setMsg(r.ok ? { ok: true, text: 'บันทึกแล้ว' } : { ok: false, text: r.error });
      router.refresh();
    });

  const run = () =>
    start(async () => {
      setMsg({ ok: true, text: 'กำลังรัน…' });
      const r = await runAutomationAction(init.key);
      setMsg(r.ok ? { ok: r.data.ok, text: `${r.data.status}: ${r.data.detail}` } : { ok: false, text: r.error });
      router.refresh();
    });

  const lr = lastRunLabel(init);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">{init.title}</h3>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-slate-300">{init.needs}</span>
          </div>
          <p className="mt-0.5 text-sm text-slate-400">{init.description}</p>
          <p className="mt-1 text-xs text-slate-500">⏱ {init.schedule} (เวลาไทย)</p>
        </div>
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
          aria-label="toggle"
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${enabled ? 'left-[22px]' : 'left-0.5'}`}
          />
        </button>
      </div>

      {/* per-job config */}
      <div className="mt-4 space-y-2">
        {init.key === 'weekly_article_draft' && (
          <>
            <label className="block text-sm text-slate-300">ธีม/แนวของบทความ</label>
            <input
              value={(cfg.theme as string) ?? ''}
              onChange={(e) => setC('theme', e.target.value)}
              placeholder="เช่น เทคโนโลยีและการตลาดออนไลน์สำหรับธุรกิจไทย"
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600"
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={!!cfg.withCover} onChange={(e) => setC('withCover', e.target.checked)} />
              สร้างภาพปกด้วย Gemini ด้วย
            </label>
          </>
        )}
        {init.key === 'weekly_lead_digest' && (
          <>
            <label className="block text-sm text-slate-300">อีเมลรับสรุป (เว้นว่าง = ใช้ค่าเริ่มต้นของระบบ)</label>
            <input
              value={(cfg.email as string) ?? ''}
              onChange={(e) => setC('email', e.target.value)}
              placeholder="sales@pmndigital.co"
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600"
            />
          </>
        )}
        {init.key === 'auto_cover_missing' && (
          <>
            <label className="block text-sm text-slate-300">จำนวนภาพปกสูงสุดต่อรอบ</label>
            <input
              type="number"
              min={1}
              max={10}
              value={(cfg.limit as number) ?? 3}
              onChange={(e) => setC('limit', Number(e.target.value))}
              className="w-28 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white"
            />
          </>
        )}
      </div>

      <p className="mt-3 text-xs">
        <span className="text-slate-500">รันล่าสุด: </span>
        <span className={lr.cls}>{lr.text}</span>
        {init.lastRunAt && <span className="text-slate-500"> · {new Date(init.lastRunAt).toLocaleString('th-TH')}</span>}
        {init.lastMessage && <span className="block text-slate-400">{init.lastMessage}</span>}
      </p>

      {msg && <p className={`mt-2 text-sm ${msg.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{msg.text}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          บันทึก
        </button>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05] disabled:opacity-50"
        >
          รันเดี๋ยวนี้
        </button>
      </div>
    </section>
  );
}

export function AutomationPanel({ items }: { items: AutomationJobStatus[] }) {
  return (
    <div className="space-y-5">
      {items.map((it) => (
        <JobCard key={it.key} init={it} />
      ))}
    </div>
  );
}
