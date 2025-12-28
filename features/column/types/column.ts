/**
 * カラムタイプの列挙型
 */
export const COLUMN_TYPES = {
  TEXT: 'TEXT',
  TEXTAREA: 'TEXTAREA',
  NUMBER: 'NUMBER',
  DATE: 'DATE',
  SELECT: 'SELECT',
  CHECKBOX: 'CHECKBOX',
  RELATION: 'RELATION',
} as const;

export type ColumnType = (typeof COLUMN_TYPES)[keyof typeof COLUMN_TYPES];

/**
 * 選択肢の型（SELECT型で使用）
 */
export type SelectOption = {
  id: string;
  label: string;
  color?: string;
};

/**
 * リレーション参照レコードの型（RELATION型で使用）
 */
export type RelationRecord = {
  id: string;
  displayValue: string;
  exists: boolean;
};

/**
 * 日付精度の型
 */
export type DatePrecision = 'year' | 'month' | 'day' | 'day_weekday';

/**
 * 日付フォーマットの型
 */
export type DateFormatType =
  | 'YYYY-MM-DD' // 日付のみ
  | 'YYYY/MM/DD' // 日付のみ（スラッシュ区切り）
  | 'YYYY-MM'; // 年月のみ

/**
 * 各カラムタイプ固有の設定
 */
export type ColumnTypeConfig = {
  TEXT: {
    placeholder?: string; // プレースホルダー
    defaultValue?: string; // デフォルト値
  };
  TEXTAREA: {
    placeholder?: string; // プレースホルダー
    defaultValue?: string; // デフォルト値
  };
  NUMBER: {
    min?: number; // 最小値
    max?: number; // 最大値
    unit?: string; // 単位（円、個など）表示専用
    unitPosition?: 'prefix' | 'suffix'; // 単位の位置
    thousandSeparator?: boolean; // 千の位区切り表示
    defaultValue?: number; // デフォルト値
    step?: number; // 増減のステップ値（デフォルト: 1）
    placeholder?: string;
  };
  DATE: {
    precision?: DatePrecision; // 精度（デフォルト: 'day'）
    format?: DateFormatType; // 表示フォーマット
    defaultValue?: number; // デフォルト値（相対日数: 0=今日、正数=未来、負数=過去）
    min?: string; // 入力可能な最小日付（ISO 8601形式）
    max?: string; // 入力可能な最大日付（ISO 8601形式）
    allowPast?: boolean; // 過去日付を許可（デフォルト: true）
    allowFuture?: boolean; // 未来日付を許可（デフォルト: true）
    placeholder?: string; // プレースホルダー
  };
  SELECT: {
    options: SelectOption[];
    allowMultiple?: boolean; // 複数選択を許可（デフォルト: false）
    defaultValue?: string | string[]; // デフォルト値（選択肢のIDまたはIDの配列。保存時は常に配列に変換される）
  };
  CHECKBOX: {
    checkedLabel?: string; // チェック時のラベル（例: 「完了」）
    uncheckedLabel?: string; // 未チェック時のラベル（例: 「未完了」）
    defaultValue?: boolean; // デフォルト値
    displayStyle?: 'checkbox' | 'switch'; // 表示スタイル（デフォルト: 'checkbox'）
  };
  RELATION: {
    referencedTableId: string; // 参照先テーブルID
    displayField: string; // 表示用フィールドID（参照先テーブルのカラムID）
    allowMultiple?: boolean; // 複数レコード参照を許可（デフォルト: false）
  };
};

/**
 * バリデーションルールの型
 */
export type ValidationRule = {
  required?: boolean;
  message?: string;
};

/**
 * 基本カラム定義
 */
type BaseColumn = {
  id: string;
  name: string;
  description?: string;
  order: number;
  validation?: ValidationRule;
  enableFilter?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 各カラムタイプの定義（Discriminated Union）
 */
export type TextColumn = BaseColumn & {
  type: 'TEXT';
  config?: ColumnTypeConfig['TEXT'];
};

export type TextareaColumn = BaseColumn & {
  type: 'TEXTAREA';
  config?: ColumnTypeConfig['TEXTAREA'];
};

export type NumberColumn = BaseColumn & {
  type: 'NUMBER';
  config?: ColumnTypeConfig['NUMBER'];
};

export type DateColumn = BaseColumn & {
  type: 'DATE';
  config?: ColumnTypeConfig['DATE'];
};

export type SelectColumn = BaseColumn & {
  type: 'SELECT';
  config: ColumnTypeConfig['SELECT']; // SELECT型はoptionsが必須
};

export type CheckboxColumn = BaseColumn & {
  type: 'CHECKBOX';
  config?: ColumnTypeConfig['CHECKBOX'];
};

export type RelationColumn = BaseColumn & {
  type: 'RELATION';
  config: ColumnTypeConfig['RELATION']; // RELATION型はconfigが必須
};

/**
 * カラム型の統合型（Discriminated Union）
 */
export type Column =
  | TextColumn
  | TextareaColumn
  | NumberColumn
  | DateColumn
  | SelectColumn
  | CheckboxColumn
  | RelationColumn;

/**
 * カラム作成用の入力型
 */
export type CreateColumnInput = Omit<Column, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * カラム更新用の入力型
 */
export type UpdateColumnInput = Partial<
  Omit<Column, 'id' | 'createdAt' | 'updatedAt'>
>;
