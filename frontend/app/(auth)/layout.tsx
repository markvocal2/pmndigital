import type { ReactNode } from "react";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white antialiased">
      <AnimatedBackground />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        {children}
      </div>
    </main>
  );
}
