'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditUserOption } from './edit-user-option';
import { DeleteUserOption } from './delete-user-option';
import type { User } from '../types';

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
    header: 'メールアドレス',
    cell: ({ row }) => <div className="lowercase">{row.getValue('email')}</div>,
    meta: { width: 'w-[30%]' },
  },
  {
    accessorKey: 'name',
    header: '名前',
    cell: ({ row }) => <div>{row.getValue('name') || 'Unknown'}</div>,
    meta: { width: 'w-[15%]' },
  },
  {
    accessorKey: 'role',
    header: 'ロール',
    cell: ({ row }) => {
      const role = row.getValue('role') as string;
      return <div>{role === 'ADMIN' ? '管理者' : 'メンバー'}</div>;
    },
    meta: { width: 'w-[15%]' },
  },
  {
    accessorKey: 'createdAt',
    header: '登録日',
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
