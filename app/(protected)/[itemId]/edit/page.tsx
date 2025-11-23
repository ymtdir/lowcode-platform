import { getItemById } from '@/features/item/api';
import { getColumnSchema } from '@/features/column/types/schema';
import { TableEditLayout } from '@/features/table/components';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * テーブル編集ページのProps型
 */
type TableEditPageProps = {
  params: Promise<{ itemId: string }>;
};

/**
 * テーブル編集ページ（管理者向け）
 */
export default async function TableEditPage({ params }: TableEditPageProps) {
  const { itemId } = await params;

  const item = await getItemById(itemId);

  if (!item) {
    notFound();
  }

  // FOLDER型の場合はリダイレクト
  if (item.type === 'FOLDER') {
    redirect(`/${itemId}`);
  }

  // カラムスキーマを取得
  const columnSchema = getColumnSchema(item.meta);
  const columns = columnSchema?.columns || [];

  return (
    <TableEditLayout itemId={itemId} itemName={item.name} columns={columns} />
  );
}
