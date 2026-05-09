"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthCard } from "@/components/ui/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function TwoFactorForm() {
  const router = useRouter();
  const search = useSearchParams();
  const email = search.get("email") ?? "";
  const callbackUrl = search.get("callbackUrl") ?? "/";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const password = sessionStorage.getItem("pmn_login_pending_pw") ?? "";
    if (!email || !password) {
      setLoading(false);
      setError("กลับไปหน้า /login ใหม่");
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      twoFactorCode: code,
      redirect: false,
    });

    setLoading(false);

    if (!result || result.error) {
      setError("รหัสยืนยันไม่ถูกต้อง — ลองอีกครั้ง");
      return;
    }
    sessionStorage.removeItem("pmn_login_pending_pw");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthCard
      title="ยืนยันสองชั้น"
      subtitle="Two-factor authentication"
      footer={
        <span className="text-slate-400">
          เปิดแอป Google Authenticator แล้วใส่รหัส 6 หลัก
          <br />
          หรือใช้ backup code
        </span>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <Input
          id="code"
          type="text"
          inputMode="numeric"
          name="code"
          label="Verification code"
          placeholder="123456"
          autoComplete="one-time-code"
          required
          minLength={6}
          maxLength={10}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.trim())}
          disabled={loading}
        />

        {error && (
          <div
            role="alert"
            className="rounded-md border border-rose-400/30 bg-rose-500/[0.06] px-3 py-2 text-xs text-rose-200/90"
            style={{ boxShadow: "0 0 18px rgba(244,63,94,0.18)" }}
          >
            {error}
          </div>
        )}

        <Button type="submit" loading={loading}>
          Verify
        </Button>
      </form>
    </AuthCard>
  );
}

function Fallback() {
  return (
    <AuthCard title="ยืนยันสองชั้น">
      <div className="flex items-center justify-center py-10">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200/30 border-t-blue-200" />
      </div>
    </AuthCard>
  );
}

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <TwoFactorForm />
    </Suspense>
  );
}
