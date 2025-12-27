'use client';

import { useTransition } from 'react';
import { Column } from '@tanstack/react-table';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ExportSorting } from '@/features/table/types/export';

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  if (!column.getCanSort()) {
    return <div>{title}</div>;
  }

  const sorted = column.getIsSorted();

  const handleClick = () => {
    // 3段階のソート切り替え: なし → asc → desc → なし
    let newSortDirection: false | 'asc' | 'desc';

    if (!sorted) {
      newSortDirection = 'asc';
    } else if (sorted === 'asc') {
      newSortDirection = 'desc';
    } else {
      newSortDirection = false;
    }

    // TanStack Tableの状態を更新（即座に反映）
    if (newSortDirection === false) {
      column.clearSorting();
    } else {
      column.toggleSorting(newSortDirection === 'desc');
    }

    // バックグラウンドでURLを更新（状態の永続化）
    const params = new URLSearchParams(searchParams.toString());
    let newSorting: ExportSorting[];

    if (newSortDirection === 'asc') {
      newSorting = [{ id: column.id, desc: false }];
    } else if (newSortDirection === 'desc') {
      newSorting = [{ id: column.id, desc: true }];
    } else {
      newSorting = [];
    }

    if (newSorting.length > 0) {
      params.set('sorting', JSON.stringify(newSorting));
    } else {
      params.delete('sorting');
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
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
