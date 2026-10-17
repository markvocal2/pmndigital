'use client';

import { useEffect, useState } from 'react';
import type { MediaItem } from '@/lib/cms';
import { isVideoUrl } from '@/lib/cms';
import { MediaImg } from '@/components/ui/Skeleton';
import { listMediaAction, deleteMediaAction } from '@/lib/cms-actions';
import { tooLargeMessage, uploadMedia, useBlockFileDropNavigation } from '@/lib/media-upload';

function fmtSize(b: number) {
  return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
}
const IMG_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg', 'ico'];
const fileExt = (name: string) => (name.split('.').pop() || '').toLowerCase();
function kind(name: string): 'image' | 'video' | 'file' {
  const e = fileExt(name);
  return IMG_EXT.includes(e) ? 'image' : isVideoUrl(name) ? 'video' : 'file';
}

export function MediaBrowser({ onPick }: { onPick?: (url: string) => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  useBlockFileDropNavigation();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const r = await listMediaAction();
    if (r.ok) setItems(r.data);
    setLoading(false);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    uploadAll(files);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setOver(false);
    if (!busy) uploadAll(Array.from(e.dataTransfer.files));
  }

  // The library takes any file type, one after another; with a picker open the last one is picked.
  async function uploadAll(files: File[]) {
    if (!files.length) return;
    setMsg(null);
    setBusy(true);
    let url = '';
    try {
      for (const f of files) {
        const big = tooLargeMessage(f);
        if (big) {
          setMsg(big);
          continue;
        }
        setPct(0);
        url = await uploadMedia(f, setPct);
      }
      await load();
      if (url && onPick) onPick(url);
    } catch (ex) {
      setMsg(ex instanceof Error && ex.message ? ex.message : 'อัปโหลดไม่สำเร็จ — การเชื่อมต่อมีปัญหา');
      await load();
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
    <div
      onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setOver(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false); }}
      onDrop={onDrop}
      className={over ? 'rounded-lg outline-dashed outline-2 outline-offset-4 outline-blue-400/70' : undefined}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
          {busy ? `กำลังอัปโหลด ${pct}%` : '+ อัปโหลดไฟล์'}
          <input type="file" multiple className="hidden" onChange={onFile} disabled={busy} />
        </label>
        <span className="text-xs text-slate-500">หรือลากไฟล์มาวางในหน้านี้</span>
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
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-white/10">
              <span className="pmn-skel aspect-square w-full" />
              <span className="pmn-skel mx-2 my-1.5 block h-2.5 w-10" />
            </div>
          ))}
        </div>
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
                <div className="relative grid aspect-square place-items-center p-2">
                  {kind(m.filename) === 'file' ? (
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <span className="text-3xl">📄</span>
                      <span className="font-mono text-[10px] uppercase">{fileExt(m.filename) || 'file'}</span>
                    </div>
                  ) : (
                    <MediaImg src={m.url} alt={m.filename} className="max-h-full max-w-full object-contain" />
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
