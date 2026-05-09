"use client";

import { useRef, useState, useTransition } from "react";
import {
  deleteAvatarAction,
  uploadAvatarAction,
} from "@/lib/profile-actions";

type Props = {
  currentUrl: string | null;
  initials: string;
};

export function AvatarUploader({ currentUrl, initials }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);

  function pick() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("ใช้ได้เฉพาะ JPG, PNG, หรือ WEBP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("ขนาดไฟล์เกิน 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.set("avatar", file);

    startTransition(async () => {
      const res = await uploadAvatarAction(formData);
      if (!res.ok) {
        setError(res.error);
        setPreviewUrl(currentUrl);
        return;
      }
      setPreviewUrl(res.data.avatarUrl ?? null);
    });
  }

  function onRemove() {
    setError(null);
    startTransition(async () => {
      const res = await deleteAvatarAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPreviewUrl(null);
    });
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <div
          className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-blue-500/10 backdrop-blur-md"
          style={{ boxShadow: "0 0 24px rgba(59,130,246,0.15)" }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-semibold uppercase tracking-wider text-blue-100/90">
              {initials}
            </span>
          )}
        </div>
        {pending && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200/40 border-t-blue-200" />
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFileChange}
          disabled={pending}
        />
        <button
          type="button"
          onClick={pick}
          disabled={pending}
          className="inline-flex w-fit items-center gap-2 rounded-md border border-blue-400/30 bg-blue-500/[0.08] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-100 transition hover:border-blue-400/60 hover:bg-blue-500/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
        >
          เปลี่ยนรูป
        </button>
        {previewUrl && (
          <button
            type="button"
            onClick={onRemove}
            disabled={pending}
            className="inline-flex w-fit items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300 transition hover:border-rose-400/30 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ลบรูป
          </button>
        )}
        <p className="text-[10px] text-slate-500">JPG, PNG, WEBP — สูงสุด 2 MB</p>
        {error && (
          <p className="text-[11px] text-rose-300/90">{error}</p>
        )}
      </div>
    </div>
  );
}
