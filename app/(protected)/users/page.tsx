import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canManageUsers } from '@/lib/permissions';
import { getUsers } from '@/features/user/api';
import { UserTable } from '@/features/user/components';

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

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ユーザー管理</h1>
        </div>
      </div>

      <UserTable users={users} />
    </div>
  );
}
