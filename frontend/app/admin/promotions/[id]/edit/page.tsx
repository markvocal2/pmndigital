import { notFound } from 'next/navigation';
import { adminGetPromotion } from '@/lib/cms';
import { PromotionEditor } from '@/components/admin/PromotionEditor';

export const dynamic = 'force-dynamic';

export default async function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();
  const promotion = await adminGetPromotion(numId).catch(() => null);
  if (!promotion) notFound();
  return <PromotionEditor promotion={promotion} />;
}
