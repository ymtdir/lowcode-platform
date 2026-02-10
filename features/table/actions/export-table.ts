'use server';

import { getRecords } from '@/features/record/api/get-records';
import { getItemById } from '@/features/item/api';
import { getColumnSchema } from '@/features/column/types/schema';
import { convertToCSV } from '@/lib/csv';
import { prisma } from '@/lib/prisma';
import type { ExportColumnFilter } from '../types/export';
import type { RecordData } from '@/features/record/types';
import type { RelationColumn } from '@/features/column/types';

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

  // RELATION型カラムのリレーション先データを取得
  const relationColumns = columns.filter(
    (col) => col.type === 'RELATION'
  ) as RelationColumn[];
  const relationDataMap = new Map<string, Map<string, string>>();

  for (const relationCol of relationColumns) {
    const referencedTableId = relationCol.config.referencedTableId;
    const displayField = relationCol.config.displayField;

    // リレーション先のテーブルを取得
    const referencedTable = await getItemById(referencedTableId);
    if (!referencedTable || referencedTable.type !== 'TABLE') continue;

    // 実際に使用されているレコードIDを収集
    const usedRecordIds = new Set<string>();
    for (const record of records) {
      const data = record.data as RecordData;
      const value = data[relationCol.id];
      if (value) {
        // 文字列または配列の両方に対応
        const ids = Array.isArray(value) ? value : [value];
        ids.forEach((id) => {
          if (typeof id === 'string') {
            usedRecordIds.add(id);
          }
        });
      }
    }

    // 使用されているIDのみ取得（パフォーマンス・セキュリティ改善）
    const referencedRecords = await prisma.record.findMany({
      where: {
        tableId: referencedTableId,
        id: { in: Array.from(usedRecordIds) },
      },
    });

    // レコードIDから表示値へのマップを作成
    const idToValueMap = new Map<string, string>();
    for (const record of referencedRecords) {
      const data = record.data as RecordData;
      const displayValue = data[displayField];
      idToValueMap.set(record.id, String(displayValue ?? ''));
    }

    relationDataMap.set(relationCol.id, idToValueMap);
  }

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

      // SELECT型カラムの場合はIDをラベルに変換
      // NOTE: エクスポート時は DB から直接データを取得するため、
      // allowMultiple切り替え前の古いデータ形式が残っている可能性がある
      if (col.type === 'SELECT' && col.config?.options && value) {
        // 配列または文字列を配列に統一（互換性のため）
        const ids = Array.isArray(value) ? value : [value];
        return ids
          .map((id) => {
            const option = col.config.options.find((opt) => opt.id === id);
            return option?.label || id;
          })
          .join(', ');
      }

      // RELATION型カラムの場合はIDを表示値に変換
      // NOTE: エクスポート時は DB から直接データを取得するため、
      // allowMultiple切り替え前の古いデータ形式が残っている可能性がある
      if (col.type === 'RELATION' && value) {
        const idToValueMap = relationDataMap.get(col.id);
        if (!idToValueMap) return '';

        // 配列または文字列を配列に統一（互換性のため）
        const ids = Array.isArray(value) ? value : [value];
        return ids.map((id) => idToValueMap.get(id as string) || id).join(', ');
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
  const safeName = item.name.replace(/[\\/:*?"<>|]/g, '_');
  const filename = `${safeName}_${timestamp}.csv`;

  return { csv, filename };
}
