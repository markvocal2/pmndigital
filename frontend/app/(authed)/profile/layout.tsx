import type { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { SessionMenu } from "@/components/SessionMenu";

export default async function ProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/profile/general");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white antialiased">
      <AnimatedBackground />

      <div className="absolute right-6 top-6 z-20">
        <SessionMenu />
      </div>

      <div className="absolute left-6 top-6 z-20">
        <Link
          href="/"
          className="text-[10px] font-semibold uppercase tracking-[0.4em] text-blue-300/60 transition hover:text-blue-200"
        >
          ← Back to home
        </Link>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        <div className="mb-8 text-center">
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{
              textShadow: "0 0 32px rgba(59,130,246,0.35)",
            }}
          >
            <span className="shimmer-text">บัญชีของฉัน</span>
          </h1>
          <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-blue-300/60">
            Account Settings
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <ProfileTabs />
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </main>
  );
}
