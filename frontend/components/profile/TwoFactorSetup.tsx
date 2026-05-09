"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  disable2faAction,
  setup2faAction,
  verifyEnable2faAction,
} from "@/lib/profile-actions";

type Props = {
  enabled: boolean;
};

type SetupData = { secret: string; otpauthUrl: string; qrDataUrl: string };

export function TwoFactorSetup({ enabled: initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<
    "idle" | "setup" | "verify" | "backup" | "disable"
  >("idle");
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function startSetup() {
    setError(null);
    setBusy(true);
    const res = await setup2faAction();
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSetupData(res.data);
    setStep("verify");
  }

  async function verify() {
    setError(null);
    setBusy(true);
    const res = await verifyEnable2faAction(code);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setBackupCodes(res.data.backupCodes);
    setEnabled(true);
    setStep("backup");
  }

  async function disable() {
    setError(null);
    setBusy(true);
    const res = await disable2faAction({
      password,
      code: code.length > 0 ? code : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEnabled(false);
    setPassword("");
    setCode("");
    setStep("idle");
  }

  if (enabled && step === "idle") {
    return (
      <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.04] px-4 py-4 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              Active
            </div>
            <h3 className="mt-1 text-sm font-semibold text-slate-100">
              2FA เปิดใช้งานอยู่
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              ใส่รหัสยืนยัน 6 หลักจาก Google Authenticator ทุกครั้งที่ login
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep("disable")}
            className="rounded-md border border-rose-400/30 bg-rose-500/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-200 transition hover:border-rose-400/60 hover:bg-rose-500/[0.12]"
          >
            ปิด 2FA
          </button>
        </div>
      </div>
    );
  }

  if (step === "disable") {
    return (
      <div className="space-y-4 rounded-lg border border-rose-400/20 bg-rose-500/[0.04] px-4 py-4 backdrop-blur-md">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">ปิด 2FA</h3>
          <p className="mt-1 text-xs text-slate-400">
            ใส่รหัสผ่าน + รหัสยืนยัน (TOTP หรือ backup code) เพื่อปิด
          </p>
        </div>
        <Input
          id="disable-password"
          type="password"
          label="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={busy}
        />
        <Input
          id="disable-code"
          type="text"
          inputMode="numeric"
          label="รหัสยืนยัน 6 หลัก หรือ backup code"
          value={code}
          onChange={(e) => setCode(e.target.value.trim())}
          minLength={6}
          maxLength={10}
          disabled={busy}
        />
        {error && (
          <div className="rounded-md border border-rose-400/30 bg-rose-500/[0.08] px-3 py-2 text-xs text-rose-200/90">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <Button type="button" loading={busy} onClick={disable} className="!w-auto px-6">
            ปิด 2FA
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep("idle");
              setError(null);
            }}
            disabled={busy}
            className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300 transition hover:border-blue-400/30 hover:text-blue-200 disabled:opacity-50"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    );
  }

  if (step === "verify" && setupData) {
    return (
      <div className="space-y-5 rounded-lg border border-blue-400/20 bg-blue-500/[0.04] px-4 py-4 backdrop-blur-md">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            ขั้นที่ 1: สแกน QR ด้วย Google Authenticator
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            แอปจะแสดงรหัส 6 หลักที่เปลี่ยนทุก 30 วินาที — ใส่รหัสปัจจุบันด้านล่างเพื่อยืนยัน
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <div className="rounded-md bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={setupData.qrDataUrl}
              alt="2FA QR code"
              className="h-40 w-40"
            />
          </div>
          <div className="flex-1 space-y-2 text-xs">
            <p className="text-slate-400">หรือใส่ secret key ในแอปเอง:</p>
            <code className="block break-all rounded bg-black/40 px-3 py-2 font-mono text-blue-200">
              {setupData.secret}
            </code>
          </div>
        </div>

        <Input
          id="verify-code"
          type="text"
          inputMode="numeric"
          label="ขั้นที่ 2: ใส่รหัส 6 หลัก"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.trim())}
          required
          minLength={6}
          maxLength={6}
          autoFocus
          disabled={busy}
        />

        {error && (
          <div className="rounded-md border border-rose-400/30 bg-rose-500/[0.06] px-3 py-2 text-xs text-rose-200/90">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" loading={busy} onClick={verify} className="!w-auto px-6">
            ยืนยัน
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep("idle");
              setError(null);
              setSetupData(null);
              setCode("");
            }}
            disabled={busy}
            className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300 transition hover:text-slate-100 disabled:opacity-50"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    );
  }

  if (step === "backup" && backupCodes) {
    return (
      <div className="space-y-4 rounded-lg border border-emerald-400/20 bg-emerald-500/[0.04] px-4 py-4 backdrop-blur-md">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            🎉 2FA เปิดเรียบร้อย — บันทึก backup codes ไว้ในที่ปลอดภัย
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            แต่ละโค้ดใช้ได้ครั้งเดียว — ใช้แทน Google Authenticator ถ้ามือถือหายหรือเข้าถึงไม่ได้
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-md bg-black/40 p-3 font-mono text-sm sm:grid-cols-5">
          {backupCodes.map((c) => (
            <div
              key={c}
              className="rounded bg-blue-500/[0.08] px-2 py-1.5 text-center text-blue-100"
            >
              {c}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setStep("idle");
            setBackupCodes(null);
            setCode("");
          }}
          className="rounded-md border border-blue-400/30 bg-blue-500/[0.08] px-4 py-2 text-xs uppercase tracking-[0.22em] text-blue-100 transition hover:border-blue-400/60 hover:bg-blue-500/[0.14]"
        >
          ฉันบันทึกแล้ว — เสร็จสิ้น
        </button>
      </div>
    );
  }

  // idle, not enabled
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-4 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            Disabled
          </div>
          <h3 className="mt-1 text-sm font-semibold text-slate-100">
            เปิด 2FA ด้วย Google Authenticator
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            เพิ่มความปลอดภัยอีกชั้น — ใส่รหัส 6 หลักจากแอปทุกครั้งที่ login
          </p>
        </div>
        <Button type="button" loading={busy} onClick={startSetup} className="!w-auto px-4">
          เปิด 2FA
        </Button>
      </div>
      {error && (
        <div className="mt-3 rounded-md border border-rose-400/30 bg-rose-500/[0.06] px-3 py-2 text-xs text-rose-200/90">
          {error}
        </div>
      )}
    </div>
  );
}
