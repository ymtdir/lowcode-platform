import type { Column } from '@/features/column/types';

/**
 * バリデーションエラーの種類
 */
export type ValidationErrorType =
  | 'MISSING_HEADER' // 必須ヘッダーが存在しない
  | 'UNKNOWN_HEADER' // 不明なヘッダーが存在する
  | 'REQUIRED_FIELD' // 必須フィールドが空
  | 'INVALID_TYPE' // データ型が不正
  | 'INVALID_DATE' // 日付形式が不正
  | 'INVALID_NUMBER' // 数値形式が不正
  | 'INVALID_SELECT' // SELECT型の選択肢が不正
  | 'INVALID_RELATION' // RELATION型の参照先が存在しない
  | 'DUPLICATE_ID' // レコードIDが重複している
  | 'RECORD_NOT_FOUND'; // 更新対象のレコードが存在しない

/**
 * バリデーションエラー
 */
export type ValidationError = {
  type: ValidationErrorType;
  row?: number; // エラーが発生した行番号（0始まり、ヘッダー除く）
  column?: string; // エラーが発生したカラム名
  value?: string; // エラーの原因となった値
  message: string; // エラーメッセージ
};

/**
 * インポートモード
 */
export type ImportMode = 'INSERT' | 'UPSERT';

/**
 * インポートオプション
 */
export type ImportOptions = {
  mode?: ImportMode; // デフォルト: 'UPSERT'（IDがあれば更新、なければ挿入）
  skipValidation?: boolean; // バリデーションをスキップするか（デフォルト: false）
};

/**
 * バリデーション結果
 */
export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[]; // 警告（処理は続行可能）
};

/**
 * インポート結果
 */
export type ImportResult = {
  success: boolean;
  insertedCount: number; // 新規挿入件数
  updatedCount: number; // 更新件数
  skippedCount: number; // スキップ件数
  totalCount: number; // 総件数
  errors?: ValidationError[]; // エラー一覧
  message: string; // 結果メッセージ
};

/**
 * パース済みインポートデータ（1行分）
 */
export type ParsedImportRow = {
  recordId?: string; // レコードID（更新時に使用）
  data: Record<string, unknown>; // カラムIDをキーとしたデータ
};

/**
 * パース済みインポートデータ（全体）
 */
export type ParsedImportData = {
  rows: ParsedImportRow[];
  columnMapping: Map<string, Column>; // カラム名 → カラム定義のマッピング
};
