'use client';

import { useState } from 'react';
import { ColumnDef, FilterFn } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SortableHeader } from '@/features/table/components/sortable-header';
import { EditUserOption } from './edit-user-option';
import { DeleteUserOption } from './delete-user-option';
import type { User } from '../types';

/**
 * テキストフィルタ関数
 */
const textFilterFn: FilterFn<User> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId) as string | null;
  const search = filterValue as string;
  if (!search) return true;
  return (value || '').toLowerCase().includes(search.toLowerCase());
};

/**
 * SELECTフィルタ関数
 */
const selectFilterFn: FilterFn<User> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId) as string | null;
  const filter = filterValue as string[];
  if (!filter || filter.length === 0) return true;
  if (!value) return false;
  return filter.includes(value);
};

/**
 * DATEフィルタ関数
 */
const dateFilterFn: FilterFn<User> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId) as Date | string | null;
  const filter = filterValue as {
    preset?: string;
    startDate: Date | null;
    endDate: Date | null;
  };
  if (!value) return false;
  if (!filter.startDate && !filter.endDate) return true;

  const date = new Date(value);
  const start = filter.startDate ? new Date(filter.startDate) : new Date(0);
  const end = filter.endDate
    ? new Date(filter.endDate)
    : new Date(8640000000000000);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
};

/**
 * ユーザーテーブルのカラム定義を生成する関数
 */
export const createColumns = (): ColumnDef<User>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: { width: 'w-[10%]' },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <SortableHeader column={column} title="メールアドレス" />
    ),
    cell: ({ row }) => <div className="lowercase">{row.getValue('email')}</div>,
    meta: { width: 'w-[30%]' },
    filterFn: textFilterFn,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column} title="名前" />,
    cell: ({ row }) => <div>{row.getValue('name') || 'Unknown'}</div>,
    meta: { width: 'w-[15%]' },
    filterFn: textFilterFn,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <SortableHeader column={column} title="ロール" />,
    cell: ({ row }) => {
      const role = row.getValue('role') as string;
      return <div>{role === 'ADMIN' ? '管理者' : 'メンバー'}</div>;
    },
    meta: { width: 'w-[15%]' },
    filterFn: selectFilterFn,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <SortableHeader column={column} title="登録日" />,
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as Date;
      return <div>{new Date(date).toLocaleDateString('ja-JP')}</div>;
    },
    meta: { width: 'w-[15%]' },
    filterFn: dateFilterFn,
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [open, setOpen] = useState(false);

      return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 ">
              <span className="sr-only">メニューを開く</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom">
            <EditUserOption user={user} onOpenChange={setOpen} />
            <DeleteUserOption user={user} onOpenChange={setOpen} />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    meta: { width: 'w-[15%]' },
  },
];
