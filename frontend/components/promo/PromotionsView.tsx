'use client';

import { useState } from 'react';
import type { Promotion } from '@/lib/cms';
import { PromotionCard } from './PromotionCard';

export function PromotionsView({ promotions }: { promotions: Promotion[] }) {
  const [tab, setTab] = useState<'all' | 'featured'>('all');
  const hasFeatured = promotions.some((p) => p.featured);
  const list = tab === 'featured' ? promotions.filter((p) => p.featured) : promotions;

  const tabCls = (active: boolean) =>
    active
      ? 'rounded-full bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white'
      : 'rounded-full border border-white/15 px-4 py-1.5 text-sm text-slate-300 hover:bg-white/5';

  return (
    <div>
      {hasFeatured && (
        <div className="mb-6 flex gap-2">
          <button onClick={() => setTab('all')} className={tabCls(tab === 'all')}>
            ทั้งหมด ({promotions.length})
          </button>
          <button onClick={() => setTab('featured')} className={tabCls(tab === 'featured')}>
            ★ โปรเด่น
          </button>
        </div>
      )}
      {list.length === 0 ? (
        <p className="py-16 text-center text-slate-500">ยังไม่มีโปรโมชั่นในขณะนี้ — กลับมาใหม่เร็ว ๆ นี้</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <PromotionCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
