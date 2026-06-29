export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-56 rounded bg-white/10" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-white/[0.06]" />
      <div className="mt-6 space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <div className="h-4 w-40 rounded bg-white/10" />
            <div className="mt-3 h-9 rounded bg-white/[0.05]" />
            <div className="mt-3 h-9 w-2/3 rounded bg-white/[0.05]" />
          </div>
        ))}
      </div>
    </div>
  );
}
