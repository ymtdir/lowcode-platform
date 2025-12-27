'use client';

import { useExport } from '@/features/layout/providers/export-provider';
import { GroupTable } from '@/features/group/components';
import type { Group } from '@/features/group/types';

type User = {
  id: string;
  email: string;
  name: string | null;
};

type GroupsLayoutProps = {
  groups: Group[];
  users: User[];
};

/**
 * グループ管理ページのレイアウトコンポーネント
 */
export function GroupsLayout({ groups, users }: GroupsLayoutProps) {
  const { setExportFn } = useExport();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">グループ管理</h1>
        </div>
      </div>

      <GroupTable groups={groups} users={users} onExportCSV={setExportFn} />
    </div>
  );
}
