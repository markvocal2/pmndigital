'use client';

import { useRef, useState, type ReactNode } from 'react';
import { uploadMediaAction } from '@/lib/cms-actions';
import { MediaPicker } from './MediaPicker';
import { isVideoUrl } from '@/lib/cms';

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-5 rounded-xl border border-white/10 bg-white/[0.025] p-5">
      <div className="mb-4 border-b border-white/10 pb-3">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20"
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20',
          mono ? 'font-mono text-xs leading-relaxed' : '',
        ].join(' ')}
      />
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-sm text-slate-200"
    >
      <span
        className={[
          'relative h-6 w-11 rounded-full transition',
          checked ? 'bg-blue-500' : 'bg-white/15',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all',
            checked ? 'left-[22px]' : 'left-0.5',
          ].join(' ')}
        />
      </span>
      {label}
    </button>
  );
}

export function ImageUpload({
  label,
  value,
  onChange,
  dark = true,
  allowVideo = false,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  dark?: boolean;
  allowVideo?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pick, setPick] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr(null);
    if (file.size > 50 * 1024 * 1024) {
      setErr(`ไฟล์ใหญ่เกินไป (${(file.size / 1048576).toFixed(1)}MB) — สูงสุด 50MB`);
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const res = await uploadMediaAction(fd);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      onChange(res.data.url);
    } catch {
      setErr('อัปโหลดไม่สำเร็จ — ไฟล์อาจใหญ่เกินไปหรือการเชื่อมต่อมีปัญหา');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept={allowVideo ? 'image/*,video/mp4,video/webm,video/quicktime' : 'image/*'} className="hidden" onChange={onFile} disabled={busy} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          title={allowVideo ? 'คลิกเพื่ออัปโหลดรูป/วิดีโอ' : 'คลิกเพื่ออัปโหลดรูป'}
          className={[
            'group relative grid h-16 w-28 place-items-center overflow-hidden rounded-md border border-white/10 transition hover:border-blue-400/50',
            dark ? 'bg-[#0b1020]' : 'bg-white',
          ].join(' ')}
        >
          {value ? (
            isVideoUrl(value) ? (
              <video src={value} muted loop playsInline className="max-h-14 max-w-[100px] object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="max-h-14 max-w-[100px] object-contain" />
            )
          ) : (
            <span className="text-[10px] text-slate-400">＋ อัปโหลด</span>
          )}
          <span className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/55 text-[10px] font-medium text-white group-hover:flex">
            {busy ? 'กำลังอัปโหลด…' : value ? 'เปลี่ยนรูป' : 'คลิกเพื่ออัปโหลด'}
          </span>
        </button>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 transition hover:border-blue-400/40 disabled:opacity-50">
              {busy ? 'กำลังอัปโหลด…' : 'อัปโหลดรูป'}
            </button>
            <button type="button" onClick={() => setPick(true)} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-blue-200 transition hover:border-blue-400/40">
              เลือกจากคลัง
            </button>
            {value && (
              <button type="button" onClick={() => onChange('')} className="text-xs text-rose-300/80 hover:text-rose-200">
                ลบ
              </button>
            )}
          </div>
          {err && <p className="text-[11px] text-rose-300">{err}</p>}
        </div>
      </div>
      <MediaPicker open={pick} onClose={() => setPick(false)} onPick={(url) => onChange(url)} />
    </div>
  );
}

export function StatusMsg({ error, success }: { error?: string | null; success?: string | null }) {
  if (error) {
    return (
      <div className="rounded-md border border-rose-400/30 bg-rose-500/[0.06] px-3 py-2 text-xs text-rose-200/90">
        {error}
      </div>
    );
  }
  if (success) {
    return (
      <div className="rounded-md border border-emerald-400/30 bg-emerald-500/[0.06] px-3 py-2 text-xs text-emerald-200/90">
        {success}
      </div>
    );
  }
  return null;
}
