import { nanoid } from 'nanoid';
import type {
  Column,
  CreateColumnInput,
  UpdateColumnInput,
} from '../types/column';
import type { ColumnSchema } from '../types/schema';

/**
 * カラムをスキーマに追加
 */
export function addColumnToSchema(
  schema: ColumnSchema,
  input: CreateColumnInput
): ColumnSchema {
  const newColumn: Column = {
    ...input,
    id: nanoid(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Column;

  return {
    ...schema,
    columns: [...schema.columns, newColumn],
  };
}

/**
 * カラムを更新
 */
export function updateColumnInSchema(
  schema: ColumnSchema,
  columnId: string,
  input: UpdateColumnInput
): ColumnSchema {
  const columnIndex = schema.columns.findIndex((col) => col.id === columnId);

  if (columnIndex === -1) {
    throw new Error(`Column with id ${columnId} not found`);
  }

  const updatedColumn: Column = {
    ...schema.columns[columnIndex],
    ...input,
    updatedAt: new Date(),
  } as Column;

  const newColumns = [...schema.columns];
  newColumns[columnIndex] = updatedColumn;

  return {
    ...schema,
    columns: newColumns,
  };
}

/**
 * カラムを削除
 */
export function removeColumnFromSchema(
  schema: ColumnSchema,
  columnId: string
): ColumnSchema {
  const columnExists = schema.columns.some((col) => col.id === columnId);

  if (!columnExists) {
    throw new Error(`Column with id ${columnId} not found`);
  }

  return {
    ...schema,
    columns: schema.columns.filter((col) => col.id !== columnId),
  };
}

/**
 * カラムの並び替え
 * @param schema 現在のスキーマ
 * @param columnId 移動するカラムのID
 * @param newOrder 新しい並び順（0-indexed）
 */
export function reorderColumnInSchema(
  schema: ColumnSchema,
  columnId: string,
  newOrder: number
): ColumnSchema {
  const columnIndex = schema.columns.findIndex((col) => col.id === columnId);

  if (columnIndex === -1) {
    throw new Error(`Column with id ${columnId} not found`);
  }

  if (newOrder < 0 || newOrder >= schema.columns.length) {
    throw new Error(
      `Invalid order: ${newOrder}. Must be between 0 and ${schema.columns.length - 1}`
    );
  }

  // カラムを配列から取り出す
  const [movedColumn] = schema.columns.splice(columnIndex, 1);

  // 新しい位置に挿入
  const newColumns = [...schema.columns];
  newColumns.splice(newOrder, 0, movedColumn);

  // order値を再計算
  const reorderedColumns = newColumns.map((col, index) => ({
    ...col,
    order: index,
    updatedAt: new Date(),
  }));

  return {
    ...schema,
    columns: reorderedColumns,
  };
}

/**
 * カラムIDでカラムを取得
 */
export function getColumnById(
  schema: ColumnSchema,
  columnId: string
): Column | null {
  return schema.columns.find((col) => col.id === columnId) || null;
}

/**
 * カラム名でカラムを取得
 */
export function getColumnByName(
  schema: ColumnSchema,
  name: string
): Column | null {
  return schema.columns.find((col) => col.name === name) || null;
}

/**
 * カラム名の重複チェック
 */
export function hasColumnWithName(
  schema: ColumnSchema,
  name: string,
  excludeColumnId?: string
): boolean {
  return schema.columns.some(
    (col) => col.name === name && col.id !== excludeColumnId
  );
}

/**
 * スキーマの整合性チェック
 * - カラムIDの重複チェック
 * - カラム名の重複チェック
 */
export function validateSchema(schema: ColumnSchema): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // カラムIDの重複チェック
  const columnIds = schema.columns.map((col) => col.id);
  const uniqueIds = new Set(columnIds);
  if (columnIds.length !== uniqueIds.size) {
    errors.push('Duplicate column IDs found');
  }

  // カラム名の重複チェック
  const columnNames = schema.columns.map((col) => col.name);
  const uniqueNames = new Set(columnNames);
  if (columnNames.length !== uniqueNames.size) {
    errors.push('Duplicate column names found');
  }

  // カラム名が空でないかチェック
  const emptyNames = schema.columns.filter((col) => !col.name.trim());
  if (emptyNames.length > 0) {
    errors.push('Column names cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
