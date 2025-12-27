'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type RowSelectionState,
  type VisibilityState,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import type { Permission } from '@prisma/client';
import type { Column, RelationRecord } from '@/features/column/types';
import type { Record, RecordData } from '@/features/record/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { updateRecord } from '@/features/record/api/update-record';
import { createRecord } from '@/features/record/api/create-record';
import { applyDefaultValues } from '@/features/column/utils';
import { hasPermission } from '@/lib/permissions';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { exportTableToCSV } from '@/lib/table-export';
import { createColumns } from './columns';
import { BulkDeleteButton } from './bulk-delete-button';
import { FilterButton } from './filter-button';
import { ColumnVisibilityButton } from './column-visibility-button';

/**
 * データテーブルのProps型
 */
type DataTableProps = {
  tableId: string;
  tableName: string;
  columns: Column[];
  initialRecords: Record[];
  relationRecords: Map<string, RelationRecord[]>;
  permissionLevel: Permission;
  onExportCSV?: (exportFn: () => void) => void;
};

/**
 * データテーブルコンポーネント
 */
export function DataTable({
  tableId,
  tableName,
  columns,
  initialRecords,
  relationRecords,
  permissionLevel,
  onExportCSV,
}: DataTableProps) {
  const [records, setRecords] = useState<Record[]>(initialRecords);
  const [isPending, startTransition] = useTransition();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // localStorageに保存するテーブル状態
  const [columnVisibilityRaw, setColumnVisibility] =
    useLocalStorage<VisibilityState>(`table-${tableId}-column-visibility`, {});
  const [sortingRaw, setSorting] = useLocalStorage<SortingState>(
    `table-${tableId}-sorting`,
    []
  );
  const [columnFiltersRaw, setColumnFilters] =
    useLocalStorage<ColumnFiltersState>(`table-${tableId}-filters`, []);

  // initialRecordsをrefで保持して、handleCellChangeの依存配列から除外する
  const initialRecordsRef = useRef(initialRecords);
  useEffect(() => {
    initialRecordsRef.current = initialRecords;
  }, [initialRecords]);

  // カラム構成変更時に古い状態をクリーンアップ（同期処理）
  const validColumnIds = useMemo(
    () => new Set(columns.map((c) => c.id)),
    [columns]
  );

  const columnVisibility = useMemo(() => {
    const validVisibility: VisibilityState = {};
    for (const [columnId, visible] of Object.entries(columnVisibilityRaw)) {
      if (validColumnIds.has(columnId)) {
        validVisibility[columnId] = visible;
      }
    }
    return validVisibility;
  }, [columnVisibilityRaw, validColumnIds]);

  const sorting = useMemo(() => {
    return sortingRaw.filter((s) => validColumnIds.has(s.id));
  }, [sortingRaw, validColumnIds]);

  const columnFilters = useMemo(() => {
    return columnFiltersRaw.filter((f) => validColumnIds.has(f.id));
  }, [columnFiltersRaw, validColumnIds]);

  // クリーンアップされた状態をlocalStorageに保存
  useEffect(() => {
    if (
      JSON.stringify(columnVisibility) !== JSON.stringify(columnVisibilityRaw)
    ) {
      setColumnVisibility(columnVisibility);
    }
  }, [columnVisibility, columnVisibilityRaw, setColumnVisibility]);

  useEffect(() => {
    if (JSON.stringify(sorting) !== JSON.stringify(sortingRaw)) {
      setSorting(sorting);
    }
  }, [sorting, sortingRaw, setSorting]);

  useEffect(() => {
    if (JSON.stringify(columnFilters) !== JSON.stringify(columnFiltersRaw)) {
      setColumnFilters(columnFilters);
    }
  }, [columnFilters, columnFiltersRaw, setColumnFilters]);

  // WRITE権限があるかチェック
  const canWrite = hasPermission(permissionLevel, 'WRITE');

  // セル値の更新ハンドラ
  const handleCellChange = useCallback(
    (recordId: string, columnId: string, value: unknown) => {
      // 楽観的更新
      setRecords((prev) =>
        prev.map((record) =>
          record.id === recordId
            ? {
                ...record,
                data: {
                  ...(record.data as RecordData),
                  [columnId]: value,
                },
              }
            : record
        )
      );

      // サーバーに保存
      startTransition(async () => {
        const result = await updateRecord(recordId, { [columnId]: value });
        if (result.error) {
          console.error('更新エラー:', result.error);
          // エラー時はリバート（簡易実装）
          setRecords(initialRecordsRef.current);
        }
      });
    },
    []
  );

  // 新規レコード作成
  const handleCreateRecord = useCallback(() => {
    startTransition(async () => {
      // デフォルト値を適用
      const defaultData = applyDefaultValues(columns);

      const formData = new FormData();
      formData.set('tableId', tableId);
      formData.set('data', JSON.stringify(defaultData));

      const result = await createRecord({}, formData);
      if (result.error) {
        console.error('作成エラー:', result.error);
        return;
      }

      // 作成されたレコードをローカルstateに追加
      if (result.record) {
        setRecords((prev) => [...prev, result.record as Record]);
      }
    });
  }, [tableId, columns]);

  // 削除完了時のハンドラ
  const handleDeleteComplete = useCallback((deletedIds: string[]) => {
    // 選択されたレコードをローカルstateから削除
    setRecords((prev) =>
      prev.filter((record) => !deletedIds.includes(record.id))
    );
    setRowSelection({});
  }, []);

  // レコードを新しい順にソート
  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [records]
  );

  // TanStack Table用のカラム定義
  const tableColumns = useMemo(
    () => createColumns(columns, handleCellChange, !canWrite, relationRecords),
    [columns, handleCellChange, canWrite, relationRecords]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: sortedRecords,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      rowSelection,
      columnVisibility,
      sorting,
      columnFilters,
    },
  });

  // 選択されたレコードのID一覧
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedRecordIds = selectedRows.map((row) => row.original.id);

  // CSVエクスポート関数
  const handleExportCSV = useCallback(() => {
    exportTableToCSV(table, tableName);
  }, [table, tableName]);

  // エクスポート関数を親コンポーネントに渡す
  useEffect(() => {
    onExportCSV?.(() => handleExportCSV);
  }, [onExportCSV, handleExportCSV]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* ツールバー */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <FilterButton
            columns={columns}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            relationRecords={relationRecords}
          />
        </div>
        <div className="flex items-center gap-2">
          <ColumnVisibilityButton table={table} />
          {canWrite && (
            <Button
              onClick={handleCreateRecord}
              disabled={isPending || columns.length === 0}
            >
              <Plus />
              レコード追加
            </Button>
          )}
        </div>
      </div>

      {/* テーブル */}
      <ScrollArea className="border-y **:data-[slot=table-container]:overflow-visible">
        <Table className="table-auto w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.columnDef.meta?.width as string}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === 'select'
                          ? ''
                          : `p-0 ${cell.column.columnDef.meta?.width}`
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length || 1}
                  className="h-24 text-center"
                >
                  {columns.length === 0
                    ? 'カラムを追加してください'
                    : '結果が見つかりませんでした'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* ページネーション */}
      <div className="flex items-center justify-end space-x-2 py-4">
        {canWrite && selectedRows.length > 0 && (
          <div className="text-muted-foreground flex flex-1 items-center gap-2 text-sm">
            {selectedRows.length} / {table.getFilteredRowModel().rows.length}{' '}
            行を選択中
            <BulkDeleteButton
              selectedRecordIds={selectedRecordIds}
              onDeleteComplete={handleDeleteComplete}
            />
          </div>
        )}
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            前へ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            次へ
          </Button>
        </div>
      </div>
    </div>
  );
}
