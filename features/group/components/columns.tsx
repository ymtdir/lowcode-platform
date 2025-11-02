'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Group } from '../types';

export const columns: ColumnDef<Group>[] = [
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          グループ名
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue('name')}</div>,
    meta: { width: 'w-[25%]' },
  },
  {
    accessorKey: 'description',
    header: '説明',
    cell: ({ row }) => <div>{row.getValue('description') || '-'}</div>,
    meta: { width: 'w-[30%]' },
  },
  {
    accessorKey: 'parentId',
    header: '親グループ',
    cell: ({ row }) => {
      const group = row.original;
      return <div>{group.parent?.name || '-'}</div>;
    },
    meta: { width: 'w-[20%]' },
  },
  {
    accessorKey: 'createdAt',
    header: '作成日',
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as Date;
      return <div>{new Date(date).toLocaleDateString('ja-JP')}</div>;
    },
    meta: { width: 'w-[15%]' },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const group = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">メニューを開く</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom">
            {/* TODO: EditGroupItem と DeleteGroupItem を実装 */}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    meta: { width: 'w-[10%]' },
  },
];
