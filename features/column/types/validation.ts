import type { Column, ColumnType } from './column';

/**
 * バリデーションエラーの型
 */
export type ValidationError = {
  columnId: string;
  columnName: string;
  message: string;
};

/**
 * バリデーション結果の型
 */
export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
};

/**
 * カラムの値の型（各カラムタイプに対応）
 */
export type ColumnValue = {
  TEXT: string;
  TEXTAREA: string;
  NUMBER: number;
  DATE: string; // ISO 8601形式（将来的に年月のみ、日時秒なども対応）
  SELECT: string | string[]; // 単一選択: option.id、複数選択: option.id[]（将来実装）
  CHECKBOX: boolean | string[]; // 単一: boolean、複数選択: option.id[]（将来実装）
};

/**
 * レコードデータの型（カラムIDをキーとした値のマップ）
 */
export type RecordData = Record<string, unknown>;

/**
 * バリデーション関数の型
 */
export type ValidateColumnFn<T extends ColumnType = ColumnType> = (
  value: unknown,
  column: Extract<Column, { type: T }>
) => ValidationError | null;

/**
 * バリデータの型定義
 */
export type ColumnValidator = {
  [K in ColumnType]: ValidateColumnFn<K>;
};
