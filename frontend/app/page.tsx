import bgConfig from "@/data/digital-bg.json";

export const metadata = {
  title: "อยู่ระหว่างปรับปรุง — PMN Digital",
  description: "Currently under maintenance. We're upgrading our system to serve you better."
};

type RingsConfig = { count: number; duration: number; delayStep: number; color: string; originalRadius: number };
type Particle = { x: number; y: number; size: number; delay: number; duration: number; color: string };
type GridConfig = { size: number; color: string; opacity: number };
type BgConfig = { rings: RingsConfig; particles: Particle[]; grid: GridConfig };

export default function Home() {
  const cfg = bgConfig as unknown as BgConfig;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white antialiased">
      {/* Layer 1: Radial glow + base gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(59,130,246,0.18) 0%, rgba(2,6,23,0) 55%)," +
            "radial-gradient(ellipse at top, rgba(6,182,212,0.08) 0%, rgba(2,6,23,0) 50%)," +
            "linear-gradient(135deg, #020617 0%, #060d24 50%, #020617 100%)"
        }}
      />

      {/* Layer 2: Slowly drifting tech grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            `linear-gradient(to right, ${cfg.grid.color} 1px, transparent 1px),` +
            `linear-gradient(to bottom, ${cfg.grid.color} 1px, transparent 1px)`,
          backgroundSize: `${cfg.grid.size}px ${cfg.grid.size}px`,
          opacity: cfg.grid.opacity,
          animation: "grid-drift 30s linear infinite",
          maskImage:
            "radial-gradient(ellipse at center, black 0%, black 40%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 0%, black 40%, transparent 80%)"
        }}
      />

      {/* Layer 3: Pulsing concentric rings */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: cfg.rings.count }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 block rounded-full border"
            style={{
              width: `${cfg.rings.originalRadius * 2}px`,
              height: `${cfg.rings.originalRadius * 2}px`,
              borderColor: cfg.rings.color,
              borderWidth: "1px",
              animation: `pulse-ring ${cfg.rings.duration}s ease-out infinite`,
              animationDelay: `${i * cfg.rings.delayStep}s`,
              boxShadow: `0 0 30px ${cfg.rings.color}33 inset, 0 0 30px ${cfg.rings.color}33`
            }}
          />
        ))}
      </div>

      {/* Layer 4: Floating particles (positions/timings from JSON) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {cfg.particles.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 4}px ${p.color}, 0 0 ${p.size * 8}px ${p.color}66`,
              animation: `float-particle ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
      </div>

      {/* Layer 5: Scan line */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.6) 30%, rgba(255,255,255,0.85) 50%, rgba(96,165,250,0.6) 70%, transparent 100%)",
          filter: "blur(0.5px)",
          animation: "scanline 9s linear infinite",
          boxShadow: "0 0 24px rgba(96, 165, 250, 0.6)"
        }}
      />

      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(2,6,23,0.85) 100%)"
        }}
      />

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
                "0 0 80px rgba(59,130,246,0.45), 0 0 12px rgba(96,165,250,0.25)"
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
                  animationDelay: `${i * 0.18}s`
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
