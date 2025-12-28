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
import { EditGroupOption } from './edit-group-option';
import { DeleteGroupOption } from './delete-group-option';
import { ManageMembersOption } from './manage-members-option';
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
 * テキストフィルタ関数
 */
const textFilterFn: FilterFn<Group> = (row, columnId, filterValue) => {
  const value = row.getValue(columnId) as string | null;
  const search = filterValue as string;
  if (!search) return true;
  return (value || '').toLowerCase().includes(search.toLowerCase());
};

/**
 * DATEフィルタ関数
 */
const dateFilterFn: FilterFn<Group> = (row, columnId, filterValue) => {
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
 * グループテーブルのカラム定義を生成する関数
 */
export const createColumns = (
  allGroups: Group[],
  allUsers: User[]
): ColumnDef<Group>[] => [
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
    accessorKey: 'name',
    header: ({ column }) => (
      <SortableHeader column={column} title="グループ名" />
    ),
    cell: ({ row }) => <div>{row.getValue('name')}</div>,
    meta: { width: 'w-[15%]' },
    filterFn: textFilterFn,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <SortableHeader column={column} title="説明" />,
    cell: ({ row }) => <div>{row.getValue('description') || '-'}</div>,
    meta: { width: 'w-[20%]' },
    filterFn: textFilterFn,
  },
  {
    accessorKey: 'parentId',
    header: ({ column }) => (
      <SortableHeader column={column} title="親グループ" />
    ),
    cell: ({ row }) => {
      const group = row.original;
      return <div>{group.parent?.name || '-'}</div>;
    },
    meta: { width: 'w-[15%]' },
  },
  {
    accessorKey: 'members',
    header: ({ column }) => (
      <SortableHeader column={column} title="メンバー数" />
    ),
    cell: ({ row }) => {
      const group = row.original;
      return <div>{group._count?.members || 0}人</div>;
    },
    meta: { width: 'w-[15%]' },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <SortableHeader column={column} title="作成日" />,
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
      const group = row.original;
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
            <EditGroupOption
              group={group}
              allGroups={allGroups}
              onOpenChange={setOpen}
            />
            <ManageMembersOption
              group={group}
              allUsers={allUsers}
              onOpenChange={setOpen}
            />
            <DeleteGroupOption group={group} onOpenChange={setOpen} />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    meta: { width: 'w-[10%]' },
  },
];
