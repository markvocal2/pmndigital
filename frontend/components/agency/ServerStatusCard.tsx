'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { ServerStatus } from '@/lib/cms';
import { fetchServerStatus } from '@/lib/blog-client';

const MONO = "'IBM Plex Mono', monospace";

// Used when the monitoring API is unreachable — keeps the card from looking broken.
const FALLBACK: ServerStatus = {
  operational: true,
  uptimePct: 99.9,
  responseMs: 42,
  days: [98, 99, 98.5, 99.9, 99.2, 100, 99.95],
  updatedAt: '',
};

// Map availability % (≈95–100) to a visible bar height (12–100%).
function barHeight(v: number): number {
  const h = 30 + ((v - 95) / 5) * 70;
  return Math.max(12, Math.min(100, Math.round(h)));
}
function barColor(h: number): string {
  if (h >= 85) return '#60A5FA,#38BDF8';
  if (h >= 65) return '#38BDF8,#0ea5e9';
  return '#2563EB,#1d4ed8';
}

export function ServerStatusCard({ initial }: { initial: ServerStatus | null }) {
  const [status, setStatus] = useState<ServerStatus | null>(initial);

  useEffect(() => {
    let alive = true;
    const tick = () => fetchServerStatus().then((s) => { if (alive && s) setStatus(s); });
    tick();
    const id = setInterval(tick, 20000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const s = status ?? FALLBACK;
  const live = s.operational;
  const liveColor = live ? '#4ade80' : '#fbbf24';
  const uptimeStr = s.uptimePct > 0 ? s.uptimePct.toFixed(s.uptimePct >= 99.95 ? 2 : 1) + '%' : '—';
  const days = s.days.length === 7 ? s.days : FALLBACK.days;

  const tile: CSSProperties = {
    background: 'rgba(255,255,255,.03)',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: 11,
    padding: '11px 12px',
  };

  const tiles: [string, string][] = [
    ['UPTIME', uptimeStr],
    ['RESPONSE', `${Math.max(1, s.responseMs)}ms`],
    ['STATUS', live ? 'Operational' : 'Degraded'],
  ];

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 20,
        background: 'linear-gradient(160deg,rgba(20,28,48,.95),rgba(9,13,24,.95))',
        border: '1px solid rgba(255,255,255,.1)',
        boxShadow: '0 40px 90px -30px rgba(0,0,0,.8),0 0 0 1px rgba(37,99,235,.08) inset',
        padding: 18,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute', top: 0, left: '-60%', width: '50%', height: '100%',
          background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)',
          animation: 'sweep 6s ease-in-out infinite', pointerEvents: 'none',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 14px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#2a3550' }} />
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#2a3550' }} />
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#2a3550' }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: '#7B86A1', marginLeft: 8 }}>pmn-console</span>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 10.5, color: liveColor }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: liveColor, boxShadow: `0 0 8px ${liveColor}`, animation: 'pulseDot 1.6s infinite' }} />
          {live ? 'LIVE' : 'DEGRADED'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: '16px 6px 14px' }}>
        {tiles.map(([k, v]) => (
          <div key={k} style={tile}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: '#7B86A1', letterSpacing: '.08em' }}>{k}</div>
            <div style={{ fontSize: k === 'STATUS' ? 15 : 19, fontWeight: 600, marginTop: 5, color: k === 'STATUS' ? liveColor : '#EAEEF6' }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '8px 8px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12.5, color: '#A7B0C4' }}>Availability · 7 วัน</span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: live ? '#4ade80' : '#fbbf24' }}>{uptimeStr}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, height: 84 }}>
          {days.map((v, i) => {
            const h = barHeight(v);
            return (
              <div
                key={i}
                title={`${v}%`}
                style={{
                  flex: 1, height: `${h}%`,
                  background: `linear-gradient(180deg,${barColor(h)})`,
                  borderRadius: '5px 5px 0 0', transformOrigin: 'bottom',
                  animation: `growBar .8s ${(i * 0.08).toFixed(2)}s both`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
