import { adminListComments } from '@/lib/cms';
import { CommentsModeration } from '@/components/admin/CommentsModeration';

export const dynamic = 'force-dynamic';

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const valid = status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED';
  const { items, total } = await adminListComments('limit=200' + (valid ? '&status=' + status : ''));
  return <CommentsModeration items={items} status={valid ? (status as string) : 'ALL'} total={total} />;
}
