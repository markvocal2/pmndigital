'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { IntegrationStatus } from '@/lib/cms';
import {
  saveIntegrationAction,
  testIntegrationAction,
  disconnectIntegrationAction,
} from '@/lib/cms-actions';

type ProviderMeta = {
  title: string;
  blurb: string;
  keyLabel: string;
  keyPlaceholder: string;
  getKeyUrl: string;
  getKeyLabel: string;
  note?: string;
};

const META: Record<IntegrationStatus['provider'], ProviderMeta> = {
  ANTHROPIC: {
    title: 'Claude (Anthropic)',
    blurb: 'เขียน/วิเคราะห์/เรียบเรียงบทความ และขับเคลื่อนงานอัตโนมัติฝั่งเซิร์ฟเวอร์',
    keyLabel: 'Anthropic API Key',
    keyPlaceholder: 'sk-ant-...',
    getKeyUrl: 'https://console.anthropic.com/settings/keys',
    getKeyLabel: 'Anthropic Console',
    note: 'งานสั่งสดผ่าน Claude Connect (claude.ai) ใช้ Subscription ของคุณอยู่แล้ว — API key นี้ใช้สำหรับงานอัตโนมัติฝั่งเซิร์ฟเวอร์',
  },
  GEMINI: {
    title: 'Google Gemini',
    blurb: 'สร้างภาพประกอบ/ภาพปกบทความ (Claude สร้างภาพไม่ได้)',
    keyLabel: 'Gemini API Key',
    keyPlaceholder: 'AIza...',
    getKeyUrl: 'https://aistudio.google.com/apikey',
    getKeyLabel: 'Google AI Studio',
  },
  OPENAI: {
    title: 'OpenAI (ทางเลือกเสริม)',
    blurb: 'GPT / DALL·E เป็นตัวเลือกสำรอง',
    keyLabel: 'OpenAI API Key',
    keyPlaceholder: 'sk-...',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    getKeyLabel: 'OpenAI Platform',
  },
};

function StatusBadge({ s }: { s: IntegrationStatus }) {
  const status = (s.status as 'ok' | 'error' | 'untested') || 'untested';
  const cfg = {
    ok: ['● เชื่อมต่อแล้ว', 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30'],
    error: ['● ผิดพลาด', 'bg-rose-500/15 text-rose-300 ring-rose-400/30'],
    untested: [
      s.configured ? '○ ยังไม่ทดสอบ' : '○ ยังไม่ตั้งค่า',
      'bg-slate-500/15 text-slate-300 ring-slate-400/20',
    ],
  }[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs ring-1 ${cfg[1]}`}>{cfg[0]}</span>;
}

function ProviderCard({ init }: { init: IntegrationStatus }) {
  const m = META[init.provider];
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; text: string }>) =>
    start(async () => {
      setMsg(null);
      const r = await fn();
      setMsg(r);
      router.refresh();
    });

  const save = () =>
    run(async () => {
      const r = await saveIntegrationAction(init.provider, {
        apiKey: apiKey.trim() || undefined,
      });
      if (r.ok) setApiKey('');
      return { ok: r.ok, text: r.ok ? 'บันทึกเรียบร้อย' : r.error };
    });

  const test = () =>
    run(async () => {
      const r = await testIntegrationAction(init.provider);
      return r.ok ? { ok: r.data.ok, text: r.data.detail } : { ok: false, text: r.error };
    });

  const disconnect = () => {
    if (!window.confirm(`ยกเลิกการเชื่อมต่อ ${m.title}?`)) return;
    run(async () => {
      const r = await disconnectIntegrationAction(init.provider);
      return { ok: r.ok, text: r.ok ? 'ยกเลิกการเชื่อมต่อแล้ว' : r.error };
    });
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{m.title}</h3>
          <p className="mt-0.5 text-sm text-slate-400">{m.blurb}</p>
        </div>
        <StatusBadge s={init} />
      </div>

      {init.statusMsg && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            init.status === 'ok'
              ? 'bg-emerald-500/10 text-emerald-300'
              : init.status === 'error'
                ? 'bg-rose-500/10 text-rose-300'
                : 'bg-white/[0.04] text-slate-400'
          }`}
        >
          {init.statusMsg}
          {init.lastTestedAt && (
            <span className="text-slate-500">
              {' '}
              · ทดสอบล่าสุด {new Date(init.lastTestedAt).toLocaleString('th-TH')}
            </span>
          )}
        </p>
      )}

      {m.note && (
        <p className="mt-3 rounded-lg bg-blue-500/[0.07] px-3 py-2 text-xs text-blue-200/90">
          ℹ️ {m.note}
        </p>
      )}

      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-300">{m.keyLabel}</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={init.configured ? '•••••••• (มีค่าเดิม — กรอกเพื่อแทนที่)' : m.keyPlaceholder}
          autoComplete="off"
          className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-400/50 focus:outline-none"
        />
        <a
          href={m.getKeyUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-block text-xs text-blue-300 hover:underline"
        >
          ขอ API key ที่ {m.getKeyLabel} ↗
        </a>
      </div>

      {msg && (
        <p className={`mt-3 text-sm ${msg.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
          {msg.ok ? '✓' : '✗'} {msg.text}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          บันทึก
        </button>
        <button
          type="button"
          onClick={test}
          disabled={pending || (!init.configured && !apiKey.trim())}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05] disabled:opacity-50"
        >
          ทดสอบการเชื่อมต่อ
        </button>
        {init.configured && (
          <button
            type="button"
            onClick={disconnect}
            disabled={pending}
            className="rounded-lg border border-rose-400/20 px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
          >
            ยกเลิกการเชื่อมต่อ
          </button>
        )}
        {pending && <span className="self-center text-sm text-slate-400">กำลังทำงาน…</span>}
      </div>
    </section>
  );
}

export function IntegrationsForm({ items }: { items: IntegrationStatus[] }) {
  return (
    <div className="space-y-5">
      {items.map((it) => (
        <ProviderCard key={it.provider} init={it} />
      ))}
    </div>
  );
}
