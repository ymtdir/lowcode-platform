/**
 * カラムタイプの列挙型
 */
export const COLUMN_TYPES = {
  TEXT: 'TEXT',
  TEXTAREA: 'TEXTAREA',
  NUMBER: 'NUMBER',
  DATE: 'DATE',
  SELECT: 'SELECT',
  MULTI_SELECT: 'MULTI_SELECT',
  CHECKBOX: 'CHECKBOX',
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
 * 日付フォーマットの型
 * 将来的に年月のみ、日時、秒数までなど細かい設定に対応可能
 */
export type DateFormatType =
  | 'YYYY-MM-DD' // 日付のみ
  | 'YYYY/MM/DD' // 日付のみ（スラッシュ区切り）
  | 'YYYY-MM' // 年月のみ（将来実装）
  | 'YYYY-MM-DD HH:mm' // 日時（将来実装）
  | 'YYYY-MM-DD HH:mm:ss'; // 日時秒（将来実装）

/**
 * 各カラムタイプ固有の設定
 */
export type ColumnTypeConfig = {
  TEXT: {
    maxLength?: number;
    placeholder?: string;
  };
  TEXTAREA: {
    maxLength?: number;
    placeholder?: string;
    rows?: number;
  };
  NUMBER: {
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
  };
  DATE: {
    format?: DateFormatType;
    min?: string; // ISO 8601形式
    max?: string; // ISO 8601形式
  };
  SELECT: {
    options: SelectOption[];
    allowCustom?: boolean; // カスタム入力を許可するか
  };
  MULTI_SELECT: {
    options: SelectOption[];
    allowCustom?: boolean; // カスタム入力を許可するか
  };
  CHECKBOX: {
    multiple?: boolean; // 複数選択を許可するか（将来実装）
    options?: SelectOption[]; // multiple=trueの場合に使用（将来実装）
    defaultValue?: boolean; // 単一選択の場合のデフォルト値
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

export type MultiSelectColumn = BaseColumn & {
  type: 'MULTI_SELECT';
  config: ColumnTypeConfig['MULTI_SELECT']; // MULTI_SELECT型はoptionsが必須
};

export type CheckboxColumn = BaseColumn & {
  type: 'CHECKBOX';
  config?: ColumnTypeConfig['CHECKBOX'];
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
  | MultiSelectColumn
  | CheckboxColumn;

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
