import { adminListPromotions } from '@/lib/cms';
import { PromotionsList } from '@/components/admin/PromotionsList';

export const dynamic = 'force-dynamic';

export default async function AdminPromotionsPage() {
  const items = await adminListPromotions().catch(() => []);
  return <PromotionsList items={items} />;
}
