"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateProfileAction } from "@/lib/profile-actions";

type Initial = {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
};

export function GeneralForm({ initial }: { initial: Initial }) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const res = await updateProfileAction({
      firstName,
      lastName,
      displayName,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSuccess("บันทึกข้อมูลเรียบร้อย");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="firstName"
          label="ชื่อ"
          name="firstName"
          maxLength={100}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={loading}
        />
        <Input
          id="lastName"
          label="นามสกุล"
          name="lastName"
          maxLength={100}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={loading}
        />
      </div>
      <Input
        id="displayName"
        label="ชื่อที่แสดง (Display Name)"
        name="displayName"
        maxLength={100}
        placeholder="เช่น Mark"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        disabled={loading}
      />
      <Input
        id="email"
        label="Email (ไม่สามารถเปลี่ยนได้)"
        name="email"
        value={initial.email}
        readOnly
        disabled
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
        บันทึก
      </Button>
    </form>
  );
}
