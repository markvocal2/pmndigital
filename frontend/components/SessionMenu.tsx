"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function SessionMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
        ...
      </span>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/[0.06] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-200 backdrop-blur-md transition hover:border-blue-400/40 hover:bg-blue-500/[0.1] hover:text-blue-100"
        style={{ boxShadow: "0 0 18px rgba(59,130,246,0.15)" }}
      >
        Sign&nbsp;In
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-200/80">
        {session.user.name ?? session.user.email}
      </span>
      <button
        onClick={() => void signOut({ callbackUrl: "/" })}
        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300 backdrop-blur-md transition hover:border-rose-400/30 hover:bg-rose-500/[0.06] hover:text-rose-200"
      >
        Sign&nbsp;Out
      </button>
    </div>
  );
}
