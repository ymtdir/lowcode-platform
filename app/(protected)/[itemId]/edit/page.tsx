import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canManageStructure } from '@/lib/permissions';
import { getItemById, getTables } from '@/features/item/api';
import { getColumnSchema } from '@/features/column/types/schema';
import { TableEditLayout } from '@/features/table/components/edit';
import { FolderEditLayout } from '@/features/folder/components/edit';

export const dynamic = 'force-dynamic';

/**
 * アイテム編集ページのProps型
 */
type ItemEditPageProps = {
  params: Promise<{ itemId: string }>;
};

/**
 * アイテム編集ページ（フォルダ/テーブル管理画面）
 * DEVELOPERロール以上がアクセス可能
 */
export default async function ItemEditPage({ params }: ItemEditPageProps) {
  // 権限チェック
  const currentUser = await getCurrentUser();
  if (!currentUser || !canManageStructure(currentUser.role)) {
    redirect('/');
  }

  const { itemId } = await params;

  const item = await getItemById(itemId);

  if (!item) {
    notFound();
  }

  // TABLE型の場合
  if (item.type === 'TABLE') {
    const columnSchema = getColumnSchema(item.meta);
    const columns = columnSchema?.columns || [];
    const tables = await getTables();

    return (
      <TableEditLayout
        itemId={itemId}
        itemName={item.name}
        columns={columns}
        tables={tables}
      />
    );
  }

  // FOLDER型の場合
  if (item.type === 'FOLDER') {
    return <FolderEditLayout folder={item} />;
  }

  // 未対応の型
  notFound();
}
