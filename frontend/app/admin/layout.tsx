import type { ReactNode } from 'react';
import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminNav } from '@/components/admin/AdminNav';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin · PMN Digital',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/admin');
  if (session.user.role !== 'ADMIN') redirect('/');

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070A12]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-bold text-white">
                P
              </span>
              <span className="text-sm font-semibold tracking-tight">PMN Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/" className="hover:text-blue-200">
              ← ดูเว็บไซต์
            </Link>
            <span className="hidden sm:inline">{session.user.email}</span>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button className="rounded-md border border-white/10 px-3 py-1.5 text-slate-300 transition hover:border-rose-400/40 hover:text-rose-200">
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row">
        <aside className="lg:w-60 lg:flex-shrink-0">
          <AdminNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
