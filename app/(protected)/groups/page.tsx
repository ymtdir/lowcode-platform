import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canManageGroups } from '@/lib/permissions';
import { getGroups } from '@/features/group/api';
import { getUsers } from '@/features/user/api';
import { GroupsLayout } from '@/features/group/components';
import type {
  ExportColumnFilter,
  ExportSorting,
} from '@/features/table/types/export';

export const dynamic = 'force-dynamic';

/**
 * グループ管理ページのProps型
 */
type GroupsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * グループ管理ページ
 * ADMINロールのみアクセス可能
 */
export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  // 権限チェック
  const currentUser = await getCurrentUser();
  if (!currentUser || !canManageGroups(currentUser.role)) {
    redirect('/');
  }

  const resolvedSearchParams = await searchParams;

  // URLからフィルタとソート条件を抽出
  const filtersParam = resolvedSearchParams.filters;
  const sortingParam = resolvedSearchParams.sorting;

  let filters: ExportColumnFilter[] = [];
  let sorting: ExportSorting[] = [];

  try {
    if (filtersParam) {
      const parsed = JSON.parse(
        typeof filtersParam === 'string' ? filtersParam : filtersParam[0] || '[]'
      );
      if (Array.isArray(parsed)) filters = parsed;
    }
    if (sortingParam) {
      const parsed = JSON.parse(
        typeof sortingParam === 'string' ? sortingParam : sortingParam[0] || '[]'
      );
      if (Array.isArray(parsed)) sorting = parsed;
    }
  } catch {
    // 不正なパラメータは無視してデフォルト値を使用
  }

  const [groups, users] = await Promise.all([getGroups(), getUsers()]);

  return (
    <GroupsLayout
      groups={groups}
      users={users}
      initialFilters={filters}
      initialSorting={sorting}
    />
  );
}
