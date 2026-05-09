import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="relative w-full max-w-md">
      {/* Brand tag */}
      <div className="mb-6 flex items-center justify-center gap-3">
        <div className="h-px w-10 bg-gradient-to-r from-transparent to-blue-400/60" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.6em] text-blue-300/70">
          PMN&nbsp;DIGITAL
        </span>
        <div className="h-px w-10 bg-gradient-to-l from-transparent to-blue-400/60" />
      </div>

      <div
        className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-2xl"
        style={{
          boxShadow:
            "0 0 60px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Subtle top accent */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
        />

        <div className="mb-6 text-center">
          <h1
            className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl"
            style={{
              textShadow: "0 0 32px rgba(59,130,246,0.35)",
            }}
          >
            <span className="shimmer-text">{title}</span>
          </h1>
          {subtitle && (
            <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-blue-300/60">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>

      {footer && <div className="mt-5 text-center text-xs text-slate-400">{footer}</div>}
    </div>
  );
}
