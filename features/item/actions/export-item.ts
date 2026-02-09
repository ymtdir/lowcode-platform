'use server';

import { getItemById } from '@/features/item/api';
import { getStyles } from '@/features/style/api/get-styles';
import { getScripts } from '@/features/script/api/get-scripts';
import { getRecords } from '@/features/record/api/get-records';
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
  options: ItemExportOptions
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
      const childData = await buildItemExportData(child.id, options);
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
    const exportData = await buildItemExportData(itemId, options);
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
    const filename = `${exportData.name}_${timestamp}.json`;

    return { json, filename };
  } catch (error) {
    console.error('アイテムのエクスポートに失敗しました:', error);
    return { error: 'アイテムのエクスポートに失敗しました' };
  }
}
