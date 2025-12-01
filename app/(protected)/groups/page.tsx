import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canManageGroups } from '@/lib/permissions';
import { getGroups } from '@/features/group/api';
import { getUsers } from '@/features/user/api';
import { GroupTable } from '@/features/group/components';

export const dynamic = 'force-dynamic';

/**
 * グループ管理ページ
 * ADMINロールのみアクセス可能
 */
export default async function GroupsPage() {
  // 権限チェック
  const currentUser = await getCurrentUser();
  if (!currentUser || !canManageGroups(currentUser.role)) {
    redirect('/');
  }

  const [groups, users] = await Promise.all([getGroups(), getUsers()]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">グループ管理</h1>
        </div>
      </div>

      <GroupTable groups={groups} users={users} />
    </div>
  );
}
