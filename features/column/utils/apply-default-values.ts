import { format } from 'date-fns';
import type { Column } from '../types/column';
import type { RecordData } from '@/features/record/types';

/**
 * カラム定義に基づいてデフォルト値を適用
 */
export function applyDefaultValues(columns: Column[]): RecordData {
  const data: RecordData = {};

  for (const column of columns) {
    // デフォルト値が定義されているカラムタイプを処理
    if (column.type === 'TEXT' && column.config?.defaultValue) {
      data[column.id] = column.config.defaultValue;
    } else if (column.type === 'TEXTAREA' && column.config?.defaultValue) {
      data[column.id] = column.config.defaultValue;
    } else if (column.type === 'SELECT' && column.config?.defaultValue) {
      data[column.id] = column.config.defaultValue;
    } else if (
      column.type === 'CHECKBOX' &&
      column.config?.defaultValue !== undefined
    ) {
      data[column.id] = column.config.defaultValue;
    } else if (
      column.type === 'NUMBER' &&
      column.config?.defaultValue !== undefined
    ) {
      data[column.id] = column.config.defaultValue;
    } else if (
      column.type === 'DATE' &&
      column.config?.defaultValue !== undefined
    ) {
      // DATE型のデフォルト値処理（相対日数）
      const relativeDay = column.config.defaultValue;
      const today = new Date();
      today.setDate(today.getDate() + relativeDay); // 相対日数を加算

      const precision = column.config.precision || 'day';
      const formats: Record<string, string> = {
        year: 'yyyy',
        month: 'yyyy-MM',
        day: 'yyyy-MM-dd',
        day_weekday: 'yyyy-MM-dd', // 保存時は day と同じ
      };
      data[column.id] = format(today, formats[precision]);
    }
    // 他のカラムタイプは明示的に値を設定しない（undefined）
  }

  return data;
}
