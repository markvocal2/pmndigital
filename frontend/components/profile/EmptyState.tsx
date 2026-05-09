type EmptyStateProps = {
  title: string;
  subtitle?: string;
  hint?: string;
};

export function EmptyState({ title, subtitle, hint }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-6 py-12 text-center backdrop-blur-md">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/[0.08] text-blue-200">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      {hint && (
        <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-blue-300/60">
          {hint}
        </p>
      )}
    </div>
  );
}
