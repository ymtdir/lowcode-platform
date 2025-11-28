import type { Column } from '../types/column';
import type { RecordData } from '@/features/record/types';

/**
 * カラム定義に基づいてデフォルト値を適用
 */
export function applyDefaultValues(columns: Column[]): RecordData {
  const data: RecordData = {};

  for (const column of columns) {
    // デフォルト値が定義されているカラムタイプを処理
    if (column.type === 'SELECT' && column.config?.defaultValue) {
      data[column.id] = column.config.defaultValue;
    } else if (column.type === 'MULTI_SELECT' && column.config?.defaultValue) {
      data[column.id] = column.config.defaultValue;
    } else if (
      column.type === 'CHECKBOX' &&
      column.config?.defaultValue !== undefined
    ) {
      data[column.id] = column.config.defaultValue;
    }
    // 他のカラムタイプは明示的に値を設定しない（undefined）
  }

  return data;
}
