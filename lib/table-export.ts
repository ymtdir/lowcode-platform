import type { Table } from '@tanstack/react-table';
import { convertToCSV, downloadCSV } from './csv';

/**
 * TanStack Tableからフィルター・ソート済みのデータをCSVエクスポートする
 * @param table - TanStack Tableインスタンス
 * @param tableName - エクスポートするテーブル名（ファイル名に使用）
 */
export function exportTableToCSV<TData>(
  table: Table<TData>,
  tableName: string
): void {
  const filteredRows = table.getFilteredRowModel().rows;
  const visibleColumns = table
    .getAllLeafColumns()
    .filter(
      (col) => col.getIsVisible() && col.id !== 'select' && col.id !== 'actions'
    );

  // ヘッダー行を取得
  const headers = visibleColumns.map((col) => {
    const columnDef = col.columnDef;
    if (typeof columnDef.header === 'string') {
      return columnDef.header;
    }
    return col.id;
  });

  // データ行を取得
  const rows = filteredRows.map((row) => {
    return visibleColumns.map((col) => {
      const value = row.getValue(col.id);
      // Date型の場合は日本語ロケールでフォーマット
      if (value instanceof Date) {
        return value.toLocaleString('ja-JP');
      }
      return value as string | number | boolean | null | undefined;
    });
  });

  // CSV変換とダウンロード
  const csv = convertToCSV(headers, rows);
  const timestamp = new Date()
    .toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(/[/:\s]/g, '-');
  const filename = `${tableName}_${timestamp}.csv`;
  downloadCSV(csv, filename);
}
