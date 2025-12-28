'use server';

import { getRecords } from '@/features/record/api/get-records';
import { getItemById } from '@/features/item/api';
import { getColumnSchema } from '@/features/column/types/schema';
import { convertToCSV } from '@/lib/csv';
import type { ExportColumnFilter, ExportSorting } from '../types/export';
import type { RecordData } from '@/features/record/types';

/**
 * テーブルデータをCSVエクスポートするServer Action
 */
export async function exportTableAction(
  itemId: string,
  filters: ExportColumnFilter[],
  sorting: ExportSorting[]
) {
  // アイテム情報を取得
  const item = await getItemById(itemId);
  if (!item || item.type !== 'TABLE') {
    return { error: 'テーブルが見つかりません' };
  }

  // カラム定義を取得
  const columnSchema = getColumnSchema(item.meta);
  const columns = columnSchema?.columns || [];

  // フィルタ適用済みのレコードを取得
  const records = await getRecords(itemId, { filters });

  // ヘッダー行を作成（カラム名）
  const headers = columns.map((col) => col.name);

  // データ行を作成
  const rows = records.map((record) => {
    const data = record.data as RecordData;
    return columns.map((col) => {
      const value = data[col.id];
      // Date型の場合はフォーマット
      if (value instanceof Date) {
        return value.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      return value as string | number | boolean | null | undefined;
    });
  });

  // CSV変換
  const csv = convertToCSV(headers, rows);

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
  const filename = `${item.name}_${timestamp}.csv`;

  return { csv, filename };
}
