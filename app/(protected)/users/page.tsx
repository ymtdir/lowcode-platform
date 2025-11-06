import { getUsers } from '@/features/user/api';
import { UserTable } from '@/features/user/components';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
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
