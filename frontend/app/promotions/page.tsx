import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicPromotions, getPublicSettings } from '@/lib/cms';
import { PromotionsView } from '@/components/promo/PromotionsView';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings();
  const name = s?.siteName || 'PMN Digital';
  const title = `โปรโมชั่น & แคมเปญพิเศษ · ${name}`;
  const description = `ข้อเสนอและโปรโมชั่นล่าสุดจาก ${name} — รับส่วนลดและสิทธิพิเศษมีจำนวนจำกัด`;
  return {
    title,
    description,
    alternates: { canonical: '/promotions' },
    openGraph: { title, description, type: 'website', siteName: name },
  };
}

export default async function PromotionsPage() {
  const [promotions, settings] = await Promise.all([getPublicPromotions(), getPublicSettings()]);
  return (
    <main className="min-h-screen bg-[#05070E] px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-slate-400 transition hover:text-slate-200">
          ← กลับหน้าหลัก
        </Link>
        <div className="mt-5">
          <span className="rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-blue-200">
            Promotions
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">โปรโมชั่น &amp; แคมเปญพิเศษ</h1>
          <p className="mt-2 text-[#8B95AC]">ข้อเสนอล่าสุดจาก {settings?.siteName || 'PMN Digital'} — มีจำนวนจำกัด</p>
        </div>
        <div className="mt-10">
          <PromotionsView promotions={promotions} />
        </div>
      </div>
    </main>
  );
}
