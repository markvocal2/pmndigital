'use client';

import type { ReactNode } from 'react';
import { ImageUpload } from './ui';

export interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'image';
  full?: boolean;
}

function inputCls() {
  return 'w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20';
}

export function ObjectListEditor<T extends object>({
  label,
  items,
  fields,
  onChange,
  newItem,
}: {
  label: string;
  items: T[];
  fields: FieldDef[];
  onChange: (items: T[]) => void;
  newItem: () => T;
}) {
  const get = (item: T, key: string) => (item as Record<string, unknown>)[key];
  const update = (i: number, key: string, value: unknown) => {
    const next = items.slice();
    next[i] = { ...(next[i] as Record<string, unknown>), [key]: value } as T;
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
        <button type="button" onClick={() => onChange([...items, newItem()])} className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-blue-200 hover:border-blue-400/40">
          + เพิ่ม
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">#{i + 1}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} className="rounded px-1.5 text-slate-400 hover:text-white">↑</button>
                <button type="button" onClick={() => move(i, 1)} className="rounded px-1.5 text-slate-400 hover:text-white">↓</button>
                <button type="button" onClick={() => remove(i)} className="rounded px-1.5 text-rose-300/80 hover:text-rose-200">✕</button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {fields.map((f) => {
                if (f.type === 'image') {
                  return (
                    <div key={f.key} className="sm:col-span-2">
                      <ImageUpload
                        label={f.label}
                        value={String(get(item, f.key) ?? '')}
                        onChange={(url) => update(i, f.key, url)}
                      />
                    </div>
                  );
                }
                const node: ReactNode =
                  f.type === 'textarea' ? (
                    <textarea
                      value={String(get(item, f.key) ?? '')}
                      onChange={(e) => update(i, f.key, e.target.value)}
                      rows={2}
                      placeholder={f.label}
                      className={inputCls()}
                    />
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={String(get(item, f.key) ?? '')}
                      onChange={(e) => update(i, f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                      placeholder={f.label}
                      className={inputCls()}
                    />
                  );
                return (
                  <label key={f.key} className={f.full || f.type === 'textarea' ? 'block sm:col-span-2' : 'block'}>
                    <span className="mb-1 block text-[10px] text-slate-500">{f.label}</span>
                    {node}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-slate-600">ยังไม่มีรายการ</p>}
      </div>
    </div>
  );
}

export function StringListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
        <button type="button" onClick={() => onChange([...items, ''])} className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-blue-200 hover:border-blue-400/40">
          + เพิ่ม
        </button>
      </div>
      <div className="space-y-2">
        {items.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={v}
              placeholder={placeholder}
              onChange={(e) => {
                const next = items.slice();
                next[i] = e.target.value;
                onChange(next);
              }}
              className={inputCls()}
            />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="rounded px-2 text-rose-300/80 hover:text-rose-200">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
