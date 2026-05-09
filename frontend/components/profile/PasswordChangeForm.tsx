"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { changePasswordAction } from "@/lib/profile-actions";

export function PasswordChangeForm() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirm) {
      setError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    if (newPassword.length < 8) {
      setError("รหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร");
      return;
    }

    setLoading(true);
    const res = await changePasswordAction({ oldPassword, newPassword });
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSuccess("เปลี่ยนรหัสผ่านสำเร็จ");
    setOldPassword("");
    setNewPassword("");
    setConfirm("");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <Input
        id="old-password"
        type="password"
        name="oldPassword"
        label="รหัสผ่านปัจจุบัน"
        autoComplete="current-password"
        required
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        disabled={loading}
      />
      <Input
        id="new-password"
        type="password"
        name="newPassword"
        label="รหัสผ่านใหม่ (≥ 8 ตัวอักษร)"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={72}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        disabled={loading}
      />
      <Input
        id="confirm-password"
        type="password"
        name="confirm"
        label="ยืนยันรหัสผ่านใหม่"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={72}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        disabled={loading}
      />

      {error && (
        <div className="rounded-md border border-rose-400/30 bg-rose-500/[0.06] px-3 py-2 text-xs text-rose-200/90">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-emerald-400/30 bg-emerald-500/[0.06] px-3 py-2 text-xs text-emerald-200/90">
          {success}
        </div>
      )}

      <Button type="submit" loading={loading} className="!w-auto px-6">
        เปลี่ยนรหัสผ่าน
      </Button>
    </form>
  );
}
