import { auth } from '@/auth';
import { adminListUsers } from '@/lib/admin-users';
import { UsersManager } from '@/components/admin/UsersManager';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await auth();
  const currentUserId = session?.user?.id
    ? parseInt(session.user.id, 10)
    : null;
  const data = await adminListUsers({ limit: 100 }).catch(() => ({
    items: [],
    total: 0,
    page: 1,
    limit: 100,
  }));
  return (
    <UsersManager initialUsers={data.items} currentUserId={currentUserId} />
  );
}
