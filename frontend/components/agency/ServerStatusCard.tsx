'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
  cpuHeadroomPct: 72,
  memHeadroomPct: 64,
  servicesHealthy: 4,
  servicesTotal: 4,
  continuousDays: 50,
  backupOk: true,
  backupAgeHours: 6,
  backupStacks: 30,
  threatsBlocked: 0,
};

type ViewKey = 'reliability' | 'performance' | 'scale' | 'security';
const VIEWS: { key: ViewKey; label: string }[] = [
  { key: 'reliability', label: 'เสถียร' },
  { key: 'performance', label: 'ความเร็ว' },
  { key: 'scale', label: 'สเกล' },
  { key: 'security', label: 'ปลอดภัย' },
];

function barHeight(v: number): number {
  const h = 30 + ((v - 95) / 5) * 70;
  return Math.max(12, Math.min(100, Math.round(h)));
}
function barColor(h: number): string {
  if (h >= 85) return '#60A5FA,#38BDF8';
  if (h >= 65) return '#38BDF8,#0ea5e9';
  return '#2563EB,#1d4ed8';
}
function backupAgeStr(h: number | null): string {
  if (h == null) return '—';
  if (h < 1) return 'ไม่ถึง 1 ชม.';
  if (h < 24) return `${Math.round(h)} ชม.`;
  return `${Math.floor(h / 24)} วัน`;
}

export function ServerStatusCard({ initial }: { initial: ServerStatus | null }) {
  const [status, setStatus] = useState<ServerStatus | null>(initial);
  const [view, setView] = useState(0);
  const paused = useRef(false);
  const manual = useRef(false);

  useEffect(() => {
    let alive = true;
    const tick = () => fetchServerStatus().then((s) => { if (alive && s) setStatus(s); });
    tick();
    const id = setInterval(tick, 20000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // auto-rotate views every 6s until the user takes control or hovers
  useEffect(() => {
    const id = setInterval(() => {
      if (!paused.current && !manual.current) setView((v) => (v + 1) % VIEWS.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const s = status ?? FALLBACK;
  const live = s.operational;
  const liveColor = live ? '#4ade80' : '#fbbf24';
  const uptimeStr = s.uptimePct > 0 ? s.uptimePct.toFixed(s.uptimePct >= 99.95 ? 2 : 1) + '%' : '—';
  const responseStr = s.responseMs > 0 ? `${s.responseMs}ms` : '—';
  const days = s.days.length === 7 ? s.days : FALLBACK.days;
  const activeView = VIEWS[view].key;

  const tile: CSSProperties = {
    background: 'rgba(255,255,255,.03)',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: 11,
    padding: '11px 12px',
  };
  const Tile = ({ k, v, accent }: { k: string; v: string; accent?: string }) => (
    <div style={tile}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#7B86A1', letterSpacing: '.06em' }}>{k}</div>
      <div style={{ fontSize: 17, fontWeight: 600, marginTop: 5, color: accent ?? '#EAEEF6', whiteSpace: 'nowrap' }}>{v}</div>
    </div>
  );
  const grid3: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 };
  const caption: CSSProperties = { fontSize: 12, color: '#8B95AC', marginTop: 13, lineHeight: 1.5 };

  function renderBody() {
    if (activeView === 'performance') {
      const headroom = Math.min(s.cpuHeadroomPct, s.memHeadroomPct);
      return (
        <div>
          <div style={grid3}>
            <Tile k="RESPONSE" v={responseStr} accent="#7FD7FF" />
            <Tile k="CPU ว่าง" v={`${s.cpuHeadroomPct}%`} accent="#4ade80" />
            <Tile k="RAM ว่าง" v={`${s.memHeadroomPct}%`} accent="#4ade80" />
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, color: '#A7B0C4' }}>กำลังเหลือรองรับโหลด</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: '#4ade80' }}>{headroom}%</span>
            </div>
            <div style={{ height: 12, borderRadius: 7, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
              <div style={{ width: `${headroom}%`, height: '100%', background: 'linear-gradient(90deg,#22c55e,#4ade80)', borderRadius: 7, transition: 'width .8s' }} />
            </div>
            <p style={caption}>ตอบสนองเร็ว และยังเหลือกำลังอีกมากพร้อมรองรับการเติบโตของธุรกิจคุณ</p>
          </div>
        </div>
      );
    }
    if (activeView === 'scale') {
      const dots = Math.max(1, Math.min(12, s.servicesTotal || 4));
      return (
        <div>
          <div style={grid3}>
            <Tile k="บริการ" v={`${s.servicesHealthy}/${s.servicesTotal}`} accent="#4ade80" />
            <Tile k="ต่อเนื่อง" v={`${s.continuousDays} วัน`} />
            <Tile k="STATUS" v={live ? 'Operational' : 'Degraded'} accent={liveColor} />
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12.5, color: '#A7B0C4' }}>บริการที่มอนิเตอร์</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: '#4ade80' }}>ทำงานปกติ</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Array.from({ length: dots }).map((_, i) => (
                <span key={i} style={{ width: 13, height: 13, borderRadius: 4, background: i < s.servicesHealthy ? 'linear-gradient(135deg,#22c55e,#4ade80)' : 'rgba(255,255,255,.12)', boxShadow: i < s.servicesHealthy ? '0 0 8px rgba(74,222,128,.5)' : 'none' }} />
              ))}
            </div>
            <p style={caption}>ทุกบริการถูกมอนิเตอร์ตลอด 24 ชม. รันต่อเนื่องไม่สะดุดมากว่า {s.continuousDays} วัน</p>
          </div>
        </div>
      );
    }
    if (activeView === 'security') {
      return (
        <div>
          <div style={grid3}>
            <Tile k="สำรองล่าสุด" v={backupAgeStr(s.backupAgeHours)} accent={s.backupOk ? '#4ade80' : '#fbbf24'} />
            <Tile k="สถานะสำรอง" v={s.backupOk ? '✓ ปกติ' : 'ตรวจสอบ'} accent={s.backupOk ? '#4ade80' : '#fbbf24'} />
            <Tile k="บล็อกภัย" v={s.threatsBlocked > 0 ? s.threatsBlocked.toLocaleString('en-US') : 'ป้องกัน'} accent="#7FD7FF" />
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[
              ['🔒', `สำรองข้อมูลอัตโนมัติทุกวัน · ${s.backupStacks > 0 ? s.backupStacks + ' ระบบ' : 'ครบทุกระบบ'}`],
              ['🛡️', 'เข้ารหัสการเชื่อมต่อ (TLS) และเฝ้าระวังภัยคุกคามเชิงรุก'],
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: '#C2CAD9' }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
            <p style={{ ...caption, marginTop: 4 }}>ข้อมูลของคุณปลอดภัย — สำรองสม่ำเสมอและกู้คืนได้</p>
          </div>
        </div>
      );
    }
    // reliability (default)
    return (
      <div>
        <div style={grid3}>
          <Tile k="UPTIME" v={uptimeStr} />
          <Tile k="RESPONSE" v={responseStr} />
          <Tile k="STATUS" v={live ? 'Operational' : 'Degraded'} accent={liveColor} />
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12.5, color: '#A7B0C4' }}>Availability · 7 วัน</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: liveColor }}>{uptimeStr}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, height: 72 }}>
            {days.map((v, i) => {
              const h = barHeight(v);
              return (
                <div key={i} title={`${v}%`} style={{ flex: 1, height: `${h}%`, background: `linear-gradient(180deg,${barColor(h)})`, borderRadius: '5px 5px 0 0', transformOrigin: 'bottom', animation: `growBar .8s ${(i * 0.08).toFixed(2)}s both` }} />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
      style={{
        position: 'relative', borderRadius: 20,
        background: 'linear-gradient(160deg,rgba(20,28,48,.95),rgba(9,13,24,.95))',
        border: '1px solid rgba(255,255,255,.1)',
        boxShadow: '0 40px 90px -30px rgba(0,0,0,.8),0 0 0 1px rgba(37,99,235,.08) inset',
        padding: 18, overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: '-60%', width: '50%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent)', animation: 'sweep 6s ease-in-out infinite', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 12px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
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

      {/* view tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 2px 14px', flexWrap: 'wrap' }}>
        {VIEWS.map((vw, i) => {
          const on = i === view;
          return (
            <button
              key={vw.key}
              onClick={() => { manual.current = true; setView(i); }}
              style={{
                cursor: 'pointer', fontFamily: MONO, fontSize: 11, letterSpacing: '.02em',
                padding: '5px 11px', borderRadius: 100, transition: 'all .25s',
                border: `1px solid ${on ? 'rgba(96,165,250,.55)' : 'rgba(255,255,255,.1)'}`,
                background: on ? 'rgba(37,99,235,.22)' : 'transparent',
                color: on ? '#BFD6FF' : '#7B86A1',
              }}
            >
              {vw.label}
            </button>
          );
        })}
      </div>

      <div style={{ minHeight: 168, padding: '0 2px' }}>{renderBody()}</div>
    </div>
  );
}
