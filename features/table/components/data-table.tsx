'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useSearchParams } from 'next/navigation';
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
  type PaginationState,
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
import {
  normalizeRecordData,
  normalizeColumnValue,
} from '@/features/column/utils/normalize-column-value';
import { hasPermission } from '@/lib/permissions';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { createColumns } from './columns';
import { BulkDeleteButton } from './bulk-delete-button';
import { FilterButton } from './filter-button';
import { ColumnVisibilityButton } from './column-visibility-button';

/**
 * データテーブルのProps型
 */
type DataTableProps = {
  tableId: string;
  columns: Column[];
  initialRecords: Record[];
  relationRecords: Map<string, RelationRecord[]>;
  permissionLevel: Permission;
  initialFilters?: { id: string; value: unknown }[];
};

/**
 * データテーブルコンポーネント
 */
export function DataTable({
  tableId,
  columns,
  initialRecords,
  relationRecords,
  permissionLevel,
  initialFilters = [],
}: DataTableProps) {
  // URLパラメータの取得
  const searchParams = useSearchParams();

  // URLからページ番号を取得（1-indexed → 0-indexed変換）
  const initialPageIndex = useMemo(() => {
    const page = searchParams.get('page');
    return Math.max(0, Number(page || '1') - 1);
  }, [searchParams]);

  // ページネーション状態を制御
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: initialPageIndex,
    pageSize: 10,
  });

  // 初期レコードのデータを正規化（SELECT/RELATION型の形式統一）
  const normalizedInitialRecords = useMemo(
    () =>
      initialRecords.map((record) => ({
        ...record,
        data: normalizeRecordData(record.data as RecordData, columns),
      })),
    [initialRecords, columns]
  );

  const [records, setRecords] = useState<Record[]>(normalizedInitialRecords);
  const [isPending, startTransition] = useTransition();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // localStorageに保存するテーブル状態
  const [columnVisibilityRaw, setColumnVisibility] =
    useLocalStorage<VisibilityState>(`table-${tableId}-column-visibility`, {});

  // フィルタとソートの状態をクライアント側で管理（即座に反映）
  // ソート: クライアントサイドのみ（初期値なし）
  // フィルタ: サーバーサイド処理（URLパラメータから初期値を取得）
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialFilters?.map((f) => ({ id: f.id, value: f.value })) || []
  );

  // initialRecordsをrefで保持して、handleCellChangeの依存配列から除外する
  const initialRecordsRef = useRef(initialRecords);
  useEffect(() => {
    initialRecordsRef.current = initialRecords;
  }, [initialRecords]);

  // 正規化されたレコードをステートに反映
  // サーバーから新しいデータが来た場合のみ同期（初期読み込み時など）
  // 楽観的更新を上書きしないように、initialRecordsの参照が変わった場合のみ同期
  const prevInitialRecordsRef = useRef(initialRecords);
  useEffect(() => {
    if (prevInitialRecordsRef.current !== initialRecords) {
      prevInitialRecordsRef.current = initialRecords;
      setRecords(normalizedInitialRecords);
    }
  }, [initialRecords, normalizedInitialRecords]);

  // カラム構成変更時に古い状態をクリーンアップ
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

  useEffect(() => {
    if (
      JSON.stringify(columnVisibility) !== JSON.stringify(columnVisibilityRaw)
    ) {
      setColumnVisibility(columnVisibility);
    }
  }, [columnVisibility, columnVisibilityRaw, setColumnVisibility]);

  // WRITE権限があるかチェック
  const canWrite = hasPermission(permissionLevel, 'WRITE');

  // セル値の更新ハンドラ
  const handleCellChange = useCallback(
    (recordId: string, columnId: string, value: unknown) => {
      // カラム定義を取得して値を正規化
      const column = columns.find((col) => col.id === columnId);
      const normalizedValue = column
        ? normalizeColumnValue(value, column)
        : value;

      // 楽観的更新（正規化済みの値を使用）
      setRecords((prev) =>
        prev.map((record) =>
          record.id === recordId
            ? {
                ...record,
                data: {
                  ...(record.data as RecordData),
                  [columnId]: normalizedValue,
                },
              }
            : record
        )
      );

      // サーバーに保存（正規化済みの値を使用）
      startTransition(async () => {
        const result = await updateRecord(recordId, {
          [columnId]: normalizedValue,
        });
        if (result.error) {
          console.error('更新エラー:', result.error);
          // エラー時はリバート（簡易実装）
          setRecords(initialRecordsRef.current);
        }
      });
    },
    [columns]
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
    onPaginationChange: setPagination,
    enableSortingRemoval: true,
    autoResetPageIndex: false, // データ変更時にページネーションをリセットしない
    state: {
      rowSelection,
      columnVisibility,
      sorting,
      columnFilters,
      pagination,
    },
  });

  // ページ変更時にURLを更新（履歴のみ置換、Next.jsのナビゲーションをトリガーしない）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPage = params.get('page');
    const expectedPage = String(pagination.pageIndex + 1); // 0-indexed → 1-indexed

    // URLと現在のページが異なる場合のみ更新
    if (urlPage !== expectedPage) {
      params.set('page', expectedPage);
      window.history.replaceState(null, '', `?${params.toString()}`);
    }
  }, [pagination.pageIndex]);

  // 選択されたレコードのID一覧
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedRecordIds = selectedRows.map((row) => row.original.id);

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
              className="cursor-pointer"
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
            className="cursor-pointer"
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            前へ
          </Button>
          <Button
            className="cursor-pointer"
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
