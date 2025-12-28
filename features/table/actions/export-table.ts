'use server';

import { getRecords } from '@/features/record/api/get-records';
import { getItemById } from '@/features/item/api';
import { getColumnSchema } from '@/features/column/types/schema';
import { convertToCSV } from '@/lib/csv';
import type { ExportColumnFilter } from '../types/export';
import type { RecordData } from '@/features/record/types';

/**
 * テーブルデータをCSVエクスポートするServer Action
 */
export async function exportTableAction(
  itemId: string,
  filters: ExportColumnFilter[]
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

  // ヘッダー行を作成（IDを1列目に追加）
  const headers = ['ID', ...columns.map((col) => col.name)];

  // データ行を作成（record.idを1列目に追加）
  const rows = records.map((record) => {
    const data = record.data as RecordData;
    const columnValues = columns.map((col) => {
      const value = data[col.id];

      // DATE型カラムの場合はフォーマット（JSONから取得した値は文字列）
      if (col.type === 'DATE' && typeof value === 'string') {
        return value.split('T')[0]; // YYYY-MM-DD
      }

      // SELECT型カラムの場合はIDをラベルに変換（常に配列形式）
      if (col.type === 'SELECT' && col.config?.options && Array.isArray(value)) {
        return value
          .map((id) => {
            const option = col.config.options.find((opt) => opt.id === id);
            return option?.label || id;
          })
          .join(', ');
      }

      return value as string | number | boolean | null | undefined;
    });
    return [record.id, ...columnValues];
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
