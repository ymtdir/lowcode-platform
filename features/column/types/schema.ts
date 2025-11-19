import type { Column } from './column';

/**
 * Itemモデルのmetaフィールドに保存するスキーマ定義
 * TABLE型のItemの場合のみ使用
 */
export type TableMeta = {
  schema: ColumnSchema;
  version?: number; // スキーマバージョン（将来のマイグレーション用）
};

/**
 * カラムスキーマ（テーブルの全カラム定義）
 */
export type ColumnSchema = {
  columns: Column[];
};

/**
 * FOLDER型のItemのmeta
 * 現在は特に使用しないが、将来の拡張用に定義
 */
export type FolderMeta = {
  // 将来的にフォルダの設定（アイコン、色など）を追加可能
  [key: string]: unknown;
};

/**
 * Itemのmeta型（type判別用）
 */
export type ItemMeta = {
  FOLDER: FolderMeta | null;
  TABLE: TableMeta;
};

/**
 * 空のスキーマを生成
 */
export function createEmptySchema(): ColumnSchema {
  return {
    columns: [],
  };
}

/**
 * 新しいTableMetaを生成
 */
export function createTableMeta(schema?: ColumnSchema): TableMeta {
  return {
    schema: schema || createEmptySchema(),
    version: 1,
  };
}

/**
 * metaがTableMetaかどうかを判定（型ガード）
 */
export function isTableMeta(meta: unknown): meta is TableMeta {
  if (!meta || typeof meta !== 'object') {
    return false;
  }

  const tableMeta = meta as TableMeta;
  return (
    typeof tableMeta.schema === 'object' &&
    tableMeta.schema !== null &&
    Array.isArray(tableMeta.schema.columns)
  );
}

/**
 * ItemのmetaからTableMetaを安全に取得
 */
export function getTableMeta(meta: unknown): TableMeta | null {
  if (isTableMeta(meta)) {
    return meta;
  }
  return null;
}

/**
 * ItemのmetaからColumnSchemaを安全に取得
 */
export function getColumnSchema(meta: unknown): ColumnSchema | null {
  const tableMeta = getTableMeta(meta);
  return tableMeta?.schema || null;
}
