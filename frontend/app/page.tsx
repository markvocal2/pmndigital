import { AnimatedBackground } from "@/components/AnimatedBackground";
import { SessionMenu } from "@/components/SessionMenu";

export const metadata = {
  title: "อยู่ระหว่างปรับปรุง — PMN Digital",
  description:
    "Currently under maintenance. We're upgrading our system to serve you better.",
};

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white antialiased">
      <AnimatedBackground />

      {/* Session menu (Sign in / Sign out) — top-right */}
      <div className="absolute right-6 top-6 z-20">
        <SessionMenu />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          {/* Status badge */}
          <div className="mb-12 inline-flex items-center gap-2.5 rounded-full border border-blue-400/15 bg-blue-500/[0.05] px-4 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.9)]" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-200/80">
              SYSTEM&nbsp;MAINTENANCE
            </span>
          </div>

          {/* Hero */}
          <h1
            className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl"
            style={{
              textShadow:
                "0 0 80px rgba(59,130,246,0.45), 0 0 12px rgba(96,165,250,0.25)",
            }}
          >
            <span className="shimmer-text">อยู่ระหว่างปรับปรุง</span>
          </h1>

          <p className="mb-12 text-base font-light tracking-[0.25em] text-blue-300/70 sm:text-lg uppercase">
            Currently Under Maintenance
          </p>

          {/* Description */}
          <div className="mx-auto mb-16 max-w-xl">
            <p className="mb-2 text-base leading-relaxed text-slate-300/90 sm:text-lg">
              เรากำลังพัฒนาประสบการณ์ที่ดีขึ้นเพื่อคุณ
            </p>
            <p className="text-sm leading-relaxed tracking-wide text-slate-500 sm:text-base">
              We&apos;re upgrading our system to serve you better.
            </p>
          </div>

          {/* Animated loader dots */}
          <div className="mb-20 flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block h-2 w-2 rounded-full bg-blue-400/70"
                style={{
                  animation: "dot-bounce 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.18}s`,
                }}
              />
            ))}
          </div>

          {/* Footer brand */}
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-blue-400/40 to-blue-400/60" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.6em] text-blue-300/50">
              PMN&nbsp;DIGITAL
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent via-blue-400/40 to-blue-400/60" />
          </div>

          {/* Sub footer */}
          <p className="mt-6 text-[10px] uppercase tracking-[0.4em] text-slate-600">
            Estimated Return Soon
          </p>
        </div>
      </div>
    </main>
  );
}
