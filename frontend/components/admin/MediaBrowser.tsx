'use client';

import { useEffect, useState } from 'react';
import type { MediaItem } from '@/lib/cms';
import { isVideoUrl } from '@/lib/cms';
import { listMediaAction, deleteMediaAction, uploadMediaAction } from '@/lib/cms-actions';

function fmtSize(b: number) {
  return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
}

export function MediaBrowser({ onPick }: { onPick?: (url: string) => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const r = await listMediaAction();
    if (r.ok) setItems(r.data);
    setLoading(false);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setMsg(null);
    if (f.size > 50 * 1024 * 1024) {
      setMsg(`ไฟล์ใหญ่เกินไป (${(f.size / 1048576).toFixed(1)}MB) — สูงสุด 50MB`);
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set('file', f);
      const r = await uploadMediaAction(fd);
      if (!r.ok) {
        setMsg(r.error);
        return;
      }
      await load();
      if (onPick) onPick(r.data.url);
    } catch {
      setMsg('อัปโหลดไม่สำเร็จ — ไฟล์อาจใหญ่เกินไปหรือการเชื่อมต่อมีปัญหา');
    } finally {
      setBusy(false);
    }
  }

  async function del(name: string) {
    if (!confirm('ลบไฟล์นี้? ตรวจให้แน่ใจว่าไม่มีหน้าใดใช้รูปนี้อยู่')) return;
    await deleteMediaAction(name);
    load();
  }

  function pickOrCopy(url: string) {
    if (onPick) {
      onPick(url);
      return;
    }
    navigator.clipboard?.writeText(location.origin + url).then(() => {
      setMsg('คัดลอก URL แล้ว');
      setTimeout(() => setMsg(null), 1500);
    });
  }

  const filtered = items.filter((i) => i.filename.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
          {busy ? 'กำลังอัปโหลด…' : '+ อัปโหลดไฟล์'}
          <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={onFile} disabled={busy} />
        </label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาชื่อไฟล์…"
          className="min-w-[180px] flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-400/60"
        />
        {msg && <span className="text-sm text-emerald-300">{msg}</span>}
        <span className="text-xs text-slate-500">{items.length} ไฟล์</span>
      </div>

      {loading ? (
        <p className="py-10 text-center text-slate-500">กำลังโหลด…</p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-slate-500">{q ? 'ไม่พบไฟล์' : 'ยังไม่มีสื่อ — อัปโหลดไฟล์แรกได้เลย'}</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {filtered.map((m) => (
            <div key={m.filename} className="group relative overflow-hidden rounded-lg border border-white/10 bg-[#0b1020]">
              <button
                type="button"
                onClick={() => pickOrCopy(m.url)}
                className="block w-full"
                title={onPick ? 'เลือกรูปนี้' : 'คลิกเพื่อคัดลอก URL'}
              >
                <div className="grid aspect-square place-items-center p-2">
                  {isVideoUrl(m.url) ? (
                    <video src={m.url} muted playsInline preload="metadata" className="max-h-full max-w-full object-contain" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt={m.filename} className="max-h-full max-w-full object-contain" />
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => del(m.filename)}
                className="absolute right-1 top-1 hidden rounded bg-black/70 px-1.5 py-0.5 text-xs text-rose-300 transition hover:text-rose-200 group-hover:block"
                title="ลบไฟล์"
              >
                ✕
              </button>
              <div className="truncate border-t border-white/10 px-2 py-1 text-[10px] text-slate-500">{fmtSize(m.size)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
