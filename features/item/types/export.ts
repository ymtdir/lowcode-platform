/**
 * アイテムエクスポートのデータ構造
 */
export type ItemExportData = {
  name: string;
  type: 'TABLE' | 'FOLDER';
  icon: string | null;
  order: number;
  meta: unknown;
  styles: { name: string; content: string; order: number }[];
  scripts: { name: string; content: string; order: number }[];
  records?: { data: unknown }[];
  children?: ItemExportData[];
};

/**
 * エクスポートファイルのルート構造
 */
export type ItemExportFile = {
  version: number;
  exportedAt: string;
  items: ItemExportData[];
};

/**
 * エクスポートオプション
 */
export type ItemExportOptions = {
  includeChildren: boolean;
  includeRecords: boolean;
};
