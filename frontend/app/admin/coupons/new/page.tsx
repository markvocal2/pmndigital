import { CouponEditor } from '@/components/admin/CouponEditor';

export const dynamic = 'force-dynamic';

export default function NewCouponPage() {
  return <CouponEditor coupon={null} />;
}
