'use client';

import { UserTable } from '@/features/user/components';
import type { User } from '@/features/user/types';
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';

type UsersLayoutProps = {
  users: User[];
  initialFilters?: ColumnFiltersState;
  initialSorting?: SortingState;
};

/**
 * ユーザー管理ページのレイアウトコンポーネント
 */
export function UsersLayout({
  users,
  initialFilters = [],
  initialSorting = [],
}: UsersLayoutProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ユーザー管理</h1>
        </div>
      </div>

      <UserTable
        users={users}
        initialFilters={initialFilters}
        initialSorting={initialSorting}
      />
    </div>
  );
}
