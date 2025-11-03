import { getGroups } from '@/features/group/api';
import { getUsers } from '@/features/user/api';
import { GroupTable } from '@/features/group/components';

export default async function GroupsPage() {
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
