interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

/** Growth %: recent half vs previous half of the window. */
function growthPct(data: number[]): number | null {
  if (data.length < 4) return null;
  const mid = Math.floor(data.length / 2);
  const prev = data.slice(0, mid).reduce((a, b) => a + b, 0);
  const recent = data.slice(mid).reduce((a, b) => a + b, 0);
  if (prev === 0) return recent > 0 ? 100 : null;
  return Math.round(((recent - prev) / prev) * 100);
}

/** Tiny inline-SVG sparkline of daily human views + a growth indicator. No deps. */
export function Sparkline({ data, width = 96, height = 28 }: SparklineProps) {
  const total = data.reduce((a, b) => a + b, 0);
  if (!data.length || total === 0) {
    return <span className="text-xs text-slate-600">—</span>;
  }
  const n = data.length;
  const max = Math.max(...data, 1);
  const stepX = n > 1 ? width / (n - 1) : width;
  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = height - (v / max) * (height - 4) - 2;
    return { x, y };
  });
  const g = growthPct(data);
  const up = g === null ? true : g >= 0;
  const stroke = up ? '#34d399' : '#fb7185';
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
        <polyline
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={last.x} cy={last.y} r="1.8" fill={stroke} />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] font-medium text-slate-300">{total.toLocaleString('th-TH')}</span>
        {g !== null && (
          <span className={up ? 'text-[10px] text-emerald-400' : 'text-[10px] text-rose-400'}>
            {up ? '▲' : '▼'} {Math.abs(g)}%
          </span>
        )}
      </div>
    </div>
  );
}
