'use client';

import { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SortableHeaderProps<TData> = {
  column: Column<TData, unknown>;
  title: string;
};

/**
 * ソート可能なテーブルヘッダーコンポーネント
 */
export function SortableHeader<TData>({
  column,
  title,
}: SortableHeaderProps<TData>) {
  if (!column.getCanSort()) {
    return <div>{title}</div>;
  }

  const sorted = column.getIsSorted();

  const handleClick = () => {
    if (sorted === 'asc') {
      column.toggleSorting(true); // 降順へ
    } else if (sorted === 'desc') {
      column.clearSorting(); // ソート解除
    } else {
      column.toggleSorting(false); // 昇順へ
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={handleClick}
    >
      <span>{title}</span>
      {sorted === 'asc' ? (
        <ArrowUp className="ml-2 opacity-50" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-2 opacity-50" />
      ) : (
        <ArrowUpDown className="ml-2 opacity-50" />
      )}
    </Button>
  );
}
