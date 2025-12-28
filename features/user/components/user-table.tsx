'use client';

import * as React from 'react';
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
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { CreateUserButton } from './create-user-button';
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
import type { User } from '../types';

/**
 * ユーザーテーブルのProps型
 */
type UserTableProps = {
  users: User[];
  initialFilters?: ColumnFiltersState;
  initialSorting?: SortingState;
};

/**
 * ユーザーテーブル用のフィルター可能なカラム定義
 */
const filterableColumns: Column[] = [
  {
    id: 'email',
    name: 'メールアドレス',
    type: 'TEXT',
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    enableFilter: true,
  },
  {
    id: 'name',
    name: '名前',
    type: 'TEXT',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    enableFilter: true,
  },
  {
    id: 'role',
    name: 'ロール',
    type: 'SELECT',
    order: 2,
    config: {
      options: [
        { id: 'ADMIN', label: '管理者' },
        { id: 'MEMBER', label: 'メンバー' },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    enableFilter: true,
  },
  {
    id: 'createdAt',
    name: '登録日',
    type: 'DATE',
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    enableFilter: true,
  },
];

/**
 * ユーザーテーブルコンポーネント
 */
export function UserTable({
  users,
  initialFilters = [],
  initialSorting = [],
}: UserTableProps) {
  const columns = createColumns();
  const [rowSelection, setRowSelection] = React.useState({});

  // localStorageに保存するテーブル状態
  const [columnVisibility, setColumnVisibility] =
    useLocalStorage<VisibilityState>('user-table-column-visibility', {});

  // フィルタとソートの状態をクライアント側で管理（即座に反映）
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialFilters);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableSortingRemoval: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedUserIds = selectedRows.map((row) => row.original.id);

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
          <CreateUserButton />
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
              selectedUserIds={selectedUserIds}
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
