import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canManageUsers } from '@/lib/permissions';
import { getUsers } from '@/features/user/api';
import { UsersLayout } from '@/features/user/components';

export const dynamic = 'force-dynamic';

/**
 * ユーザー管理ページのProps型
 */
type UsersPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * ユーザー管理ページ
 * ADMINロールのみアクセス可能
 */
export default async function UsersPage({ searchParams }: UsersPageProps) {
  // 権限チェック
  const currentUser = await getCurrentUser();
  if (!currentUser || !canManageUsers(currentUser.role)) {
    redirect('/');
  }

  const resolvedSearchParams = await searchParams;

  // URLからフィルタとソート条件を抽出
  const filtersParam = resolvedSearchParams.filters;
  const sortingParam = resolvedSearchParams.sorting;

  const filters = filtersParam
    ? JSON.parse(
        typeof filtersParam === 'string'
          ? filtersParam
          : filtersParam[0] || '[]'
      )
    : [];
  const sorting = sortingParam
    ? JSON.parse(
        typeof sortingParam === 'string'
          ? sortingParam
          : sortingParam[0] || '[]'
      )
    : [];

  const users = await getUsers();

  return (
    <UsersLayout
      users={users}
      initialFilters={filters}
      initialSorting={sorting}
    />
  );
}
