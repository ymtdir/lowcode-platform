import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { canManageStructure } from '@/lib/permissions';
import { getItemById, getTables } from '@/features/item/api';
import { getColumnSchema } from '@/features/column/types/schema';
import { getPermissions, extractPermissions } from '@/features/permission/api';
import { getUsers } from '@/features/user/api';
import { getGroups } from '@/features/group/api';
import { getStyles, extractStyles } from '@/features/style';
import { getScripts, extractScripts } from '@/features/script';
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

    // データを並列取得
    const [
      tables,
      permissionsResult,
      users,
      groups,
      stylesResult,
      scriptsResult,
    ] = await Promise.all([
      getTables(),
      getPermissions(itemId),
      getUsers(),
      getGroups(),
      getStyles(itemId),
      getScripts(itemId),
    ]);

    // データの展開
    const permissions = extractPermissions(permissionsResult);
    const styles = extractStyles(stylesResult);
    const scripts = extractScripts(scriptsResult);

    return (
      <TableEditLayout
        itemId={itemId}
        itemName={item.name}
        itemIcon={item.icon}
        columns={columns}
        tables={tables}
        initialPermissions={permissions}
        users={users}
        groups={groups}
        styles={styles}
        scripts={scripts}
      />
    );
  }

  // FOLDER型の場合
  if (item.type === 'FOLDER') {
    // データを並列取得
    const [permissionsResult, users, groups] = await Promise.all([
      getPermissions(itemId),
      getUsers(),
      getGroups(),
    ]);

    // 権限データの展開
    const permissions = extractPermissions(permissionsResult);

    return (
      <FolderEditLayout
        folder={item}
        initialPermissions={permissions}
        users={users}
        groups={groups}
      />
    );
  }

  // 未対応の型
  notFound();
}
