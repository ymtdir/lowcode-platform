import type { Column } from '../types/column';

/**
 * カラムの値を正しい形式に正規化する
 *
 * 目的:
 * - allowMultiple切り替え時の既存データとの互換性を保つ
 * - データ取得時に早期に正規化することで、下流のコード（バリデーション、UI）を単純化
 *
 * 正規化ルール:
 * - SELECT/RELATION型でallowMultiple=false: 値をstringに統一（配列なら最初の要素）
 * - SELECT/RELATION型でallowMultiple=true: 値を配列に統一（文字列なら単一要素の配列）
 */
export function normalizeColumnValue(value: unknown, column: Column): unknown {
  // null/undefinedはそのまま
  if (value === null || value === undefined) {
    return value;
  }

  // SELECT型の正規化
  if (column.type === 'SELECT') {
    const allowMultiple = column.config.allowMultiple || false;

    if (allowMultiple) {
      // 複数選択: 配列に統一
      if (typeof value === 'string') {
        return [value];
      }
      if (Array.isArray(value)) {
        return value;
      }
      // 不正な型の場合はnullに
      return null;
    } else {
      // 単一選択: 文字列に統一
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value) && value.length > 0) {
        // 配列の場合は最初の要素を使用
        return value[0];
      }
      // 空配列や不正な型の場合はnullに
      return null;
    }
  }

  // RELATION型の正規化
  if (column.type === 'RELATION') {
    const allowMultiple = column.config.allowMultiple || false;

    if (allowMultiple) {
      // 複数参照: 配列に統一
      if (typeof value === 'string') {
        return [value];
      }
      if (Array.isArray(value)) {
        return value;
      }
      // 不正な型の場合はnullに
      return null;
    } else {
      // 単一参照: 文字列に統一
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value) && value.length > 0) {
        // 配列の場合は最初の要素を使用
        return value[0];
      }
      // 空配列や不正な型の場合はnullに
      return null;
    }
  }

  // その他のカラムタイプはそのまま返す
  return value;
}

/**
 * レコードデータ全体を正規化
 */
export function normalizeRecordData(
  data: Record<string, unknown>,
  columns: Column[]
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const column of columns) {
    const value = data[column.id];
    normalized[column.id] = normalizeColumnValue(value, column);
  }

  return normalized;
}
