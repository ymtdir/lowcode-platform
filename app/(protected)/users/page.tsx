import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canManageUsers } from '@/lib/permissions';
import { getUsers } from '@/features/user/api';
import { UsersLayout } from '@/features/user/components';
import type {
  ExportColumnFilter,
  ExportSorting,
} from '@/features/table/types/export';

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

  let filters: ExportColumnFilter[] = [];
  let sorting: ExportSorting[] = [];

  try {
    if (filtersParam) {
      const parsed = JSON.parse(
        typeof filtersParam === 'string'
          ? filtersParam
          : filtersParam[0] || '[]'
      );
      if (Array.isArray(parsed)) filters = parsed;
    }
    if (sortingParam) {
      const parsed = JSON.parse(
        typeof sortingParam === 'string'
          ? sortingParam
          : sortingParam[0] || '[]'
      );
      if (Array.isArray(parsed)) sorting = parsed;
    }
  } catch {
    // 不正なパラメータは無視してデフォルト値を使用
  }

  const users = await getUsers();

  return (
    <UsersLayout
      users={users}
      initialFilters={filters}
      initialSorting={sorting}
    />
  );
}
