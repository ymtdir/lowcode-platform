import { getItemById } from '@/features/item/api';
import { getColumnSchema } from '@/features/column/types/schema';
import { getRecords, getRelationRecords } from '@/features/record/api';
import { TableLayout } from '@/features/table/components';
import { FolderLayout } from '@/features/folder/components';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canAccessItem } from '@/lib/permissions';
import type { ExportColumnFilter } from '@/features/table/types/export';

export const dynamic = 'force-dynamic';

/**
 * アイテムページのProps型
 */
type ItemPageProps = {
  params: Promise<{ itemId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * アイテム詳細ページ（フォルダ/テーブル）
 */
export default async function ItemPage({
  params,
  searchParams,
}: ItemPageProps) {
  const { itemId } = await params;
  const resolvedSearchParams = await searchParams;

  // 認証チェック
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    notFound();
  }

  const item = await getItemById(itemId);

  if (!item) {
    notFound();
  }

  // 権限チェック
  const { canAccess, level } = await canAccessItem(
    itemId,
    currentUser.id,
    currentUser.role
  );

  if (!canAccess) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            アクセス権限がありません
          </h1>
          <p className="text-muted-foreground">
            このアイテムにアクセスする権限がありません。
          </p>
        </div>
      </div>
    );
  }

  // TABLE型の場合
  if (item.type === 'TABLE') {
    const columnSchema = getColumnSchema(item.meta);
    const columns = columnSchema?.columns || [];

    // searchParamsからフィルタ条件を抽出
    const filtersParam = resolvedSearchParams.filters;

    let filters: ExportColumnFilter[] = [];

    try {
      if (filtersParam) {
        const parsed = JSON.parse(
          typeof filtersParam === 'string'
            ? filtersParam
            : filtersParam[0] || '[]'
        );
        if (Array.isArray(parsed)) filters = parsed;
      }
    } catch {
      // 不正なパラメータは無視してデフォルト値を使用
    }

    // レコードとリレーション用データを並列取得
    const [records, relationRecords] = await Promise.all([
      getRecords(itemId, { filters }),
      getRelationRecords(columns),
    ]);

    return (
      <TableLayout
        itemId={itemId}
        itemName={item.name}
        columns={columns}
        records={records}
        relationRecords={relationRecords}
        permissionLevel={level}
        initialFilters={filters}
      />
    );
  }

  // FOLDER型の場合
  if (item.type === 'FOLDER') {
    return (
      <FolderLayout
        item={item}
        canEdit={
          currentUser.role === 'ADMIN' || currentUser.role === 'DEVELOPER'
        }
      />
    );
  }

  // 未対応の型
  notFound();
}
