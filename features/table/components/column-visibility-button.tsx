'use client';

import { EyeOff } from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

type ColumnVisibilityButtonProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: Table<any>;
};

/**
 * カラム表示切り替えボタンコンポーネント
 */
export function ColumnVisibilityButton({ table }: ColumnVisibilityButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">
          <EyeOff /> 表示項目
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ScrollArea className="[&>div[data-radix-scroll-area-viewport]]:max-h-[240px]">
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                {(column.columnDef.meta as { title?: string })?.title ||
                  column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
