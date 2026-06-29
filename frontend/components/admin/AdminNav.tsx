'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV: { href: string; label: string; ready: boolean }[] = [
  { href: '/admin', label: 'แดชบอร์ด', ready: true },
  { href: '/admin/settings', label: 'ตั้งค่าเว็บไซต์', ready: true },
  { href: '/admin/home', label: 'จัดการหน้าหลัก', ready: true },
  { href: '/admin/promotions', label: 'โปรโมชั่น', ready: true },
  { href: '/admin/coupons', label: 'คูปอง', ready: true },
  { href: '/admin/articles', label: 'บทความ', ready: true },
  { href: '/admin/comments', label: 'ความคิดเห็น (Comments)', ready: true },
  { href: '/admin/media', label: 'คลังสื่อ (Media)', ready: true },
  { href: '/admin/leads', label: 'รายชื่อติดต่อ (Leads)', ready: true },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => {
        const active = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href);
        if (!n.ready) {
          return (
            <span key={n.href} className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-slate-600">
              {n.label} <span className="text-[10px]">เร็ว ๆ นี้</span>
            </span>
          );
        }
        return (
          <Link
            key={n.href}
            href={n.href}
            className={[
              'rounded-md px-3 py-2 text-sm transition',
              active
                ? 'bg-blue-500/15 font-semibold text-blue-100 ring-1 ring-blue-400/30'
                : 'text-slate-300 hover:bg-white/[0.04] hover:text-white',
            ].join(' ')}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
