'use server';

import { requireAuth } from '@/lib/auth';
import { canAccessItem } from '@/lib/permissions';
import { getItemById } from '@/features/item/api';
import { getStyles } from '@/features/style/api/get-styles';
import { getScripts } from '@/features/script/api/get-scripts';
import { getRecords } from '@/features/record/api/get-records';
import type { UserRole } from '@prisma/client';
import type {
  ItemExportData,
  ItemExportFile,
  ItemExportOptions,
} from '@/features/item/types';

/**
 * 単一アイテムのエクスポートデータを構築する
 */
async function buildItemExportData(
  itemId: string,
  options: ItemExportOptions,
  userId: string,
  userRole: UserRole
): Promise<ItemExportData | null> {
  const item = await getItemById(itemId);
  if (!item) return null;

  // スタイル・スクリプトを取得
  const stylesResult = await getStyles(itemId);
  const scriptsResult = await getScripts(itemId);

  const styles = stylesResult.styles.map((s) => ({
    name: s.name,
    content: s.content,
    order: s.order,
  }));

  const scripts = scriptsResult.scripts.map((s) => ({
    name: s.name,
    content: s.content,
    order: s.order,
  }));

  const exportData: ItemExportData = {
    name: item.name,
    type: item.type,
    icon: item.icon,
    order: item.order,
    meta: item.meta,
    styles,
    scripts,
  };

  // レコードを含める（TABLE型の場合のみ）
  if (options.includeRecords && item.type === 'TABLE') {
    const records = await getRecords(itemId);
    exportData.records = records.map((r) => ({ data: r.data }));
  }

  // 子アイテムを含める（FOLDER型の場合のみ）
  if (options.includeChildren && item.type === 'FOLDER' && item.children) {
    const children: ItemExportData[] = [];
    for (const child of item.children) {
      const { canAccess } = await canAccessItem(child.id, userId, userRole);
      if (!canAccess) continue;

      const childData = await buildItemExportData(
        child.id,
        options,
        userId,
        userRole
      );
      if (childData) {
        children.push(childData);
      }
    }
    if (children.length > 0) {
      exportData.children = children;
    }
  }

  return exportData;
}

/**
 * アイテムをJSON形式でエクスポートするServer Action
 */
export async function exportItemAction(
  itemId: string,
  options: ItemExportOptions
): Promise<{ json?: string; filename?: string; error?: string }> {
  try {
    // 認証・権限チェック
    const currentUser = await requireAuth().catch(() => null);
    if (!currentUser) {
      return { error: '認証が必要です' };
    }

    const { canAccess } = await canAccessItem(
      itemId,
      currentUser.id,
      currentUser.role
    );
    if (!canAccess) {
      return { error: 'このアイテムへのアクセス権限がありません' };
    }

    const exportData = await buildItemExportData(
      itemId,
      options,
      currentUser.id,
      currentUser.role
    );
    if (!exportData) {
      return { error: 'アイテムが見つかりません' };
    }

    const exportFile: ItemExportFile = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items: [exportData],
    };

    const json = JSON.stringify(exportFile, null, 2);

    // タイムスタンプ付きファイル名を生成
    const timestamp = new Date()
      .toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      .replace(/[/:\s]/g, '-');
    const safeName = exportData.name.replace(/[\\/:*?"<>|]/g, '_');
    const filename = `${safeName}_${timestamp}.json`;

    return { json, filename };
  } catch (error) {
    console.error('アイテムのエクスポートに失敗しました:', error);
    return { error: 'アイテムのエクスポートに失敗しました' };
  }
}
