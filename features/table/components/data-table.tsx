'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type RowSelectionState,
  type VisibilityState,
} from '@tanstack/react-table';
import { ChevronDown, Plus } from 'lucide-react';
import type { Permission } from '@prisma/client';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Column } from '@/features/column/types';
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
import { Input } from '@/components/ui/input';
import { updateRecord } from '@/features/record/api/update-record';
import { createRecord } from '@/features/record/api/create-record';
import { applyDefaultValues } from '@/features/column/utils';
import { hasPermission } from '@/lib/permissions';
import { createColumns } from './columns';
import { BulkDeleteButton } from './bulk-delete-button';

/**
 * データテーブルのProps型
 */
type DataTableProps = {
  tableId: string;
  columns: Column[];
  initialRecords: Record[];
  permissionLevel: Permission;
};

/**
 * データテーブルコンポーネント
 */
export function DataTable({
  tableId,
  columns,
  initialRecords,
  permissionLevel,
}: DataTableProps) {
  const [records, setRecords] = useState<Record[]>(initialRecords);
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

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
          setRecords(initialRecords);
        }
      });
    },
    [initialRecords]
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

  // 検索フィルタリング
  const filteredRecords = useMemo(() => {
    if (!searchValue) return sortedRecords;
    return sortedRecords.filter((record) => {
      const data = record.data as RecordData;
      return Object.values(data).some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(searchValue.toLowerCase())
      );
    });
  }, [sortedRecords, searchValue]);

  // TanStack Table用のカラム定義
  const tableColumns = useMemo(
    () => createColumns(columns, handleCellChange, !canWrite),
    [columns, handleCellChange, canWrite]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredRecords,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      rowSelection,
      columnVisibility,
    },
  });

  // 選択されたレコードのID一覧
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedRecordIds = selectedRows.map((row) => row.original.id);

  return (
    <div className="w-full">
      {/* ツールバー */}
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="検索..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                項目 <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                  >
                    {column.columnDef.header as string}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
      <div className="overflow-hidden border-y">
        <Table className="table-fixed">
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
                      className={cell.column.id === 'select' ? '' : 'p-0'}
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
      </div>

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
