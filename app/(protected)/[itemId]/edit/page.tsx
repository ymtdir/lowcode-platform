import { getItemById } from '@/features/item/api';
import { getColumnSchema } from '@/features/column/types/schema';
import { TableEditLayout } from '@/features/table/components/edit';
import { FolderEditLayout } from '@/features/folder/components/edit';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * アイテム編集ページのProps型
 */
type ItemEditPageProps = {
  params: Promise<{ itemId: string }>;
};

/**
 * アイテム編集ページ（フォルダ/テーブル管理画面）
 */
export default async function ItemEditPage({ params }: ItemEditPageProps) {
  const { itemId } = await params;

  const item = await getItemById(itemId);

  if (!item) {
    notFound();
  }

  // TABLE型の場合
  if (item.type === 'TABLE') {
    const columnSchema = getColumnSchema(item.meta);
    const columns = columnSchema?.columns || [];

    return (
      <TableEditLayout itemId={itemId} itemName={item.name} columns={columns} />
    );
  }

  // FOLDER型の場合
  if (item.type === 'FOLDER') {
    return <FolderEditLayout folder={item} />;
  }

  // 未対応の型
  notFound();
}
