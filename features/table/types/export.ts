/**
 * TanStack Tableのフィルタ条件
 */
export type ExportColumnFilter = {
  id: string;
  value: unknown;
};

/**
 * TanStack Tableのソート条件
 */
export type ExportSorting = {
  id: string;
  desc: boolean;
};

/**
 * エクスポートオプション
 */
export type ExportOptions = {
  filters?: ExportColumnFilter[];
  sorting?: ExportSorting[];
};
