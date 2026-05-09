import bgConfig from "@/data/digital-bg.json";

type RingsConfig = {
  count: number;
  duration: number;
  delayStep: number;
  color: string;
  originalRadius: number;
};
type Particle = {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
};
type GridConfig = { size: number; color: string; opacity: number };
type BgConfig = { rings: RingsConfig; particles: Particle[]; grid: GridConfig };

export function AnimatedBackground() {
  const cfg = bgConfig as unknown as BgConfig;

  return (
    <>
      {/* Layer 1: Radial glow + base gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(59,130,246,0.18) 0%, rgba(2,6,23,0) 55%)," +
            "radial-gradient(ellipse at top, rgba(6,182,212,0.08) 0%, rgba(2,6,23,0) 50%)," +
            "linear-gradient(135deg, #020617 0%, #060d24 50%, #020617 100%)",
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
            "radial-gradient(ellipse at center, black 0%, black 40%, transparent 80%)",
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
              boxShadow: `0 0 30px ${cfg.rings.color}33 inset, 0 0 30px ${cfg.rings.color}33`,
            }}
          />
        ))}
      </div>

      {/* Layer 4: Floating particles */}
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
              animationDelay: `${p.delay}s`,
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
          boxShadow: "0 0 24px rgba(96, 165, 250, 0.6)",
        }}
      />

      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(2,6,23,0.85) 100%)",
        }}
      />
    </>
  );
}
