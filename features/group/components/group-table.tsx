'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  PaginationState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { CreateGroupButton } from './create-group-button';
import { BulkDeleteButton } from './bulk-delete-button';
import { createColumns } from './columns';
import { ColumnVisibilityButton } from '@/features/table/components/column-visibility-button';
import { FilterButton } from '@/features/table/components/filter-button';
import type { Column } from '@/features/column/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Group } from '../types';

/**
 * ユーザー型
 */
type User = {
  id: string;
  email: string;
  name: string | null;
};

/**
 * グループテーブルのProps型
 */
type GroupTableProps = {
  groups: Group[];
  users: User[];
  initialFilters?: ColumnFiltersState;
  initialSorting?: SortingState;
};

/**
 * グループテーブル用のフィルター可能なカラム定義
 */
const filterableColumns: Column[] = [
  {
    id: 'name',
    name: 'グループ名',
    type: 'TEXT',
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    enableFilter: true,
  },
  {
    id: 'description',
    name: '説明',
    type: 'TEXT',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    enableFilter: true,
  },
  {
    id: 'createdAt',
    name: '作成日',
    type: 'DATE',
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    enableFilter: true,
  },
];

/**
 * グループテーブルコンポーネント
 */
export function GroupTable({
  groups,
  users,
  initialFilters = [],
  initialSorting = [],
}: GroupTableProps) {
  const columns = createColumns(groups, users);
  const [rowSelection, setRowSelection] = React.useState({});

  // URLパラメータの取得
  const searchParams = useSearchParams();

  // URLからページ番号を取得（1-indexed → 0-indexed変換）
  const initialPageIndex = React.useMemo(() => {
    const page = searchParams.get('page');
    return Math.max(0, Number(page || '1') - 1);
  }, [searchParams]);

  // ページネーション状態を制御
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: initialPageIndex,
    pageSize: 10,
  });

  // localStorageに保存するテーブル状態
  const [columnVisibility, setColumnVisibility] =
    useLocalStorage<VisibilityState>('group-table-column-visibility', {});

  // フィルタとソートの状態をクライアント側で管理（即座に反映）
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialFilters);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: groups,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    enableSortingRemoval: true,
    autoResetPageIndex: false, // データ変更時にページネーションをリセットしない
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  // ページ変更時にURLを更新
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPage = params.get('page');
    const expectedPage = String(pagination.pageIndex + 1); // 0-indexed → 1-indexed

    // URLと現在のページが異なる場合のみ更新
    if (urlPage !== expectedPage) {
      params.set('page', expectedPage);
      window.history.replaceState(null, '', `?${params.toString()}`);
    }
  }, [pagination.pageIndex]);

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedGroupIds = selectedRows.map((row) => row.original.id);

  const handleDeleteComplete = () => {
    table.resetRowSelection();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <FilterButton
          columns={filterableColumns}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
        <div className="flex items-center gap-2">
          <ColumnVisibilityButton table={table} />
          <CreateGroupButton groups={groups} />
        </div>
      </div>
      <div className="overflow-hidden border-y">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
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
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  結果が見つかりませんでした
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        {selectedRows.length > 0 && (
          <div className="text-muted-foreground flex flex-1 items-center gap-2 text-sm">
            {selectedRows.length} / {table.getFilteredRowModel().rows.length}{' '}
            行を選択中
            <BulkDeleteButton
              selectedGroupIds={selectedGroupIds}
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
