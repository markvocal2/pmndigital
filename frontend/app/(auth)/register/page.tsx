"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthCard } from "@/components/ui/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { registerUser } from "@/lib/auth-actions";

function passwordStrengthLabel(pw: string): { label: string; tone: string; level: number } {
  if (pw.length === 0) return { label: "", tone: "", level: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", tone: "text-rose-300", level: 1 };
  if (score <= 3) return { label: "Fair", tone: "text-amber-300", level: 2 };
  return { label: "Strong", tone: "text-emerald-300", level: 3 };
}

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = passwordStrengthLabel(password);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setLoading(true);
    const reg = await registerUser({
      email,
      password,
      name: name.trim() || undefined,
    });

    if (!reg.ok) {
      setLoading(false);
      setError(reg.error);
      return;
    }

    // Auto-login after register
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result || result.error) {
      // Edge case: register OK but auto-login failed — send to /login
      router.push("/login");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthCard
      title="สร้างบัญชีใหม่"
      subtitle="Create your account"
      footer={
        <span>
          มีบัญชีแล้ว?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-300 underline-offset-4 transition hover:text-blue-100 hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </span>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <Input
          id="email"
          type="email"
          name="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <Input
          id="name"
          type="text"
          name="name"
          label="Name (optional)"
          placeholder="Your name"
          autoComplete="name"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />

        <div>
          <Input
            id="password"
            type="password"
            name="password"
            label="Password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {password.length > 0 && (
            <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px]">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={[
                      "h-0.5 flex-1 rounded-full transition-colors",
                      i <= strength.level
                        ? strength.level === 1
                          ? "bg-rose-400/70"
                          : strength.level === 2
                            ? "bg-amber-400/70"
                            : "bg-emerald-400/70"
                        : "bg-white/10",
                    ].join(" ")}
                  />
                ))}
              </div>
              <span className={`font-medium uppercase tracking-[0.2em] ${strength.tone}`}>
                {strength.label}
              </span>
            </div>
          )}
        </div>

        <Input
          id="confirm"
          type="password"
          name="confirm"
          label="Confirm password"
          placeholder="Re-enter password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
          Create&nbsp;Account
        </Button>
      </form>
    </AuthCard>
  );
}
