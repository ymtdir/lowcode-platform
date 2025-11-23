import { getItemById } from '@/features/item/api';
import { getColumnSchema } from '@/features/column/types/schema';
import { getRecords } from '@/features/record/api';
import { TableLayout } from '@/features/table/components';
import { FolderLayout } from '@/features/folder/components';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * アイテムページのProps型
 */
type ItemPageProps = {
  params: Promise<{ itemId: string }>;
};

/**
 * アイテム詳細ページ（フォルダ/テーブル）
 */
export default async function ItemPage({ params }: ItemPageProps) {
  const { itemId } = await params;

  const item = await getItemById(itemId);

  if (!item) {
    notFound();
  }

  // TABLE型の場合
  if (item.type === 'TABLE') {
    const columnSchema = getColumnSchema(item.meta);
    const columns = columnSchema?.columns || [];
    const records = await getRecords(itemId);

    return (
      <TableLayout
        itemId={itemId}
        itemName={item.name}
        columns={columns}
        records={records}
      />
    );
  }

  // FOLDER型の場合
  if (item.type === 'FOLDER') {
    return <FolderLayout item={item} />;
  }

  // 未対応の型
  notFound();
}
