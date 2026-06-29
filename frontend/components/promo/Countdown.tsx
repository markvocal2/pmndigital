'use client';

import { useEffect, useState } from 'react';

function Box({ n, l }: { n: number; l: string }) {
  return (
    <span className="inline-flex min-w-[34px] flex-col items-center rounded-md bg-white/10 px-1.5 py-1">
      <span className="font-mono text-sm font-bold text-white">{String(n).padStart(2, '0')}</span>
      <span className="text-[9px] text-slate-400">{l}</span>
    </span>
  );
}

export function Countdown({ to }: { to: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // skeleton until mounted (server has no clock → avoids hydration mismatch)
  if (now === null) return <span className="pmn-skel inline-block h-7 w-36 align-middle" aria-hidden />;

  const diff = Math.max(0, target - now);
  if (diff <= 0) return <span className="text-sm font-medium text-rose-300">หมดเวลาแล้ว</span>;

  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000) % 24;
  const m = Math.floor(diff / 60000) % 60;
  const s = Math.floor(diff / 1000) % 60;
  return (
    <span className="inline-flex items-center gap-1.5">
      {d > 0 && <Box n={d} l="วัน" />}
      <Box n={h} l="ชม." />
      <Box n={m} l="นาที" />
      <Box n={s} l="วิ" />
    </span>
  );
}
