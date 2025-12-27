'use client';

import { useExport } from '@/features/layout/providers/export-provider';
import { UserTable } from '@/features/user/components';
import type { User } from '@/features/user/types';

type UsersLayoutProps = {
  users: User[];
};

/**
 * ユーザー管理ページのレイアウトコンポーネント
 */
export function UsersLayout({ users }: UsersLayoutProps) {
  const { setExportFn } = useExport();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ユーザー管理</h1>
        </div>
      </div>

      <UserTable users={users} onExportCSV={setExportFn} />
    </div>
  );
}
