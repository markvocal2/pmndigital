'use client';

import { MediaBrowser } from './MediaBrowser';

export function MediaPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-6 w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0b0f1a] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">เลือกจากคลังสื่อ</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/[0.06]"
          >
            ปิด
          </button>
        </div>
        <MediaBrowser onPick={(u) => { onPick(u); onClose(); }} />
      </div>
    </div>
  );
}
