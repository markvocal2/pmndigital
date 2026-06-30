'use client';

import { useEffect, useState } from 'react';

const MCP_URL = 'https://pmndigital.co/mcp';

export function McpConnectCard() {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'checking' | 'live' | 'down'>('checking');

  useEffect(() => {
    let alive = true;
    // The protected-resource metadata is public; its presence means the connector is live + secured.
    fetch('/.well-known/oauth-protected-resource/mcp', { cache: 'no-store' })
      .then((r) => alive && setStatus(r.ok ? 'live' : 'down'))
      .catch(() => alive && setStatus('down'));
    return () => {
      alive = false;
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(MCP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const badge = {
    checking: ['● กำลังตรวจสอบ…', 'bg-slate-500/15 text-slate-300 ring-slate-400/20'],
    live: ['🟢 พร้อมเชื่อมต่อ', 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30'],
    down: ['🔴 ยังไม่พร้อม (รอ deploy/ตรวจ Caddy)', 'bg-rose-500/15 text-rose-300 ring-rose-400/30'],
  }[status];

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/[0.08] to-blue-500/[0.04] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">MCP Connector URL</h3>
          <p className="mt-0.5 text-xs text-slate-400">ใช้ URL นี้เพิ่มเป็น Custom Connector ใน claude.ai</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs ring-1 ${badge[1]}`}>{badge[0]}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 select-all rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2.5 font-mono text-sm text-blue-200">
          {MCP_URL}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          {copied ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
        </button>
      </div>
    </section>
  );
}
