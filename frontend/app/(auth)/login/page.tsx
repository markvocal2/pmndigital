"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthCard } from "@/components/ui/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result || result.error) {
      setError("Invalid email or password");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthCard
      title="เข้าสู่ระบบ"
      subtitle="Sign in to continue"
      footer={
        <span>
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/register"
            className="font-medium text-blue-300 underline-offset-4 transition hover:text-blue-100 hover:underline"
          >
            สร้างบัญชีใหม่
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
          id="password"
          type="password"
          name="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          Sign&nbsp;In
        </Button>
      </form>
    </AuthCard>
  );
}

function LoginFallback() {
  return (
    <AuthCard title="เข้าสู่ระบบ" subtitle="Sign in to continue">
      <div className="flex items-center justify-center py-10">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200/30 border-t-blue-200" />
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
