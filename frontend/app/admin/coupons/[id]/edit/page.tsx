import { notFound } from 'next/navigation';
import { adminGetCoupon } from '@/lib/cms';
import { CouponEditor } from '@/components/admin/CouponEditor';

export const dynamic = 'force-dynamic';

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();
  const coupon = await adminGetCoupon(numId).catch(() => null);
  if (!coupon) notFound();
  return <CouponEditor coupon={coupon} />;
}
