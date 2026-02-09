import type { Table } from '@tanstack/react-table';
import { convertToCSV } from './csv';
import { downloadCSV } from './download';

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
      // Date型の場合はISO 8601形式でフォーマット
      if (value instanceof Date) {
        return value.toISOString().split('T')[0]; // YYYY-MM-DD
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
