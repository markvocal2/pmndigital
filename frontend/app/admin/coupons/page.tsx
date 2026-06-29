import { adminListCoupons } from '@/lib/cms';
import { CouponsList } from '@/components/admin/CouponsList';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  const items = await adminListCoupons().catch(() => []);
  return <CouponsList items={items} />;
}
