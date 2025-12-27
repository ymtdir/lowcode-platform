import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canManageUsers } from '@/lib/permissions';
import { getUsers } from '@/features/user/api';
import { UsersLayout } from '@/features/user/components';

export const dynamic = 'force-dynamic';

/**
 * ユーザー管理ページ
 * ADMINロールのみアクセス可能
 */
export default async function UsersPage() {
  // 権限チェック
  const currentUser = await getCurrentUser();
  if (!currentUser || !canManageUsers(currentUser.role)) {
    redirect('/');
  }

  const users = await getUsers();

  return <UsersLayout users={users} />;
}
