import type { Metadata } from 'next';
import Link from 'next/link';
import { getStatusPage, getPublicSettings } from '@/lib/cms';
import { StatusPageView } from '@/components/status/StatusPageView';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings();
  const name = s?.siteName || 'PMN Digital';
  const title = `สถานะระบบ · ${name}`;
  const description = `สถานะการให้บริการและความพร้อมใช้งานของระบบ ${name} แบบเรียลไทม์`;
  return {
    title,
    description,
    alternates: { canonical: '/status' },
    openGraph: { title, description, type: 'website', siteName: name },
  };
}

export default async function StatusPage() {
  const [sp, settings] = await Promise.all([getStatusPage(), getPublicSettings()]);
  const logo = settings?.logoDarkUrl || settings?.logoLightUrl || '/assets/logo-white.png';
  const name = settings?.siteName || 'PMN Digital';
  return (
    <main className="min-h-screen bg-[#05070E] text-slate-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Link href="/">
            <img src={logo} alt={name} style={{ height: settings?.logoHeight || 26, width: 'auto' }} />
          </Link>
          <Link href="/" className="text-sm text-slate-400 transition hover:text-blue-200">← กลับหน้าหลัก</Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-7">
          <span className="rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-blue-200">
            System Status
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">สถานะระบบ</h1>
          <p className="mt-2 text-[#8B95AC]">ความพร้อมใช้งานของบริการ {name} แบบเรียลไทม์</p>
        </div>
        {sp ? (
          <StatusPageView initial={sp} />
        ) : (
          <p className="py-16 text-center text-slate-500">ไม่สามารถโหลดสถานะได้ในขณะนี้ — กรุณาลองใหม่อีกครั้ง</p>
        )}
      </div>
    </main>
  );
}
