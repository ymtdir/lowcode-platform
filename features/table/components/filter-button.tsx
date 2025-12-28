'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Settings2, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Column } from '@/features/column/types';
import type { ColumnFiltersState } from '@tanstack/react-table';
import type { RelationRecord } from '@/features/column/types';
import {
  TextFilter,
  NumberFilter,
  DateFilter,
  SelectFilter,
  RelationFilter,
  CheckboxFilter,
} from './filters';
import type {
  NumberFilterValue,
  DateFilterValue,
} from '@/features/table/utils/filter-functions';

/**
 * FilterButtonのProps型
 */
type FilterButtonProps = {
  columns: Column[];
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  relationRecords?: Map<string, RelationRecord[]>;
};

/**
 * アクティブフィルター型
 */
type ActiveFilter = {
  columnId: string;
  columnName: string;
  columnType: Column['type'];
  value: unknown;
};

/**
 * フィルターボタンコンポーネント
 */
export function FilterButton({
  columns,
  columnFilters,
  onColumnFiltersChange,
  relationRecords,
}: FilterButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // フィルター更新とURL同期
  const updateFilters = (newFilters: ColumnFiltersState) => {
    // 即座にクライアント側のフィルタを更新（リロードなし）
    onColumnFiltersChange(newFilters);

    // バックグラウンドでURLを更新（状態の永続化）
    const params = new URLSearchParams(searchParams.toString());
    if (newFilters.length > 0) {
      params.set('filters', JSON.stringify(newFilters));
    } else {
      params.delete('filters');
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  // フィルター有効なカラムのみ取得
  const filterableColumns = columns.filter(
    (column) => column.enableFilter !== false
  );

  // アクティブなフィルター一覧を取得
  const activeFilters: ActiveFilter[] = columnFilters
    .map((filter) => {
      const column = columns.find((col) => col.id === filter.id);
      if (!column) return null;
      return {
        columnId: column.id,
        columnName: column.name,
        columnType: column.type,
        value: filter.value,
      };
    })
    .filter((filter): filter is ActiveFilter => filter !== null);

  // フィルター追加
  const addFilter = (columnId: string) => {
    // 既にフィルターが存在する場合は何もしない
    if (columnFilters.some((f) => f.id === columnId)) {
      return;
    }

    const column = columns.find((col) => col.id === columnId);
    if (!column) return;

    // カラム種別に応じた初期値を設定
    let initialValue: unknown = null;
    switch (column.type) {
      case 'TEXT':
      case 'TEXTAREA':
        initialValue = '';
        break;
      case 'NUMBER':
        initialValue = { operator: 'eq', value1: null, value2: null };
        break;
      case 'DATE':
        initialValue = { preset: 'custom', startDate: null, endDate: null };
        break;
      case 'SELECT':
      case 'RELATION':
        initialValue = [];
        break;
      case 'CHECKBOX':
        initialValue = 'all';
        break;
    }

    const newFilters = [
      ...columnFilters,
      { id: columnId, value: initialValue },
    ];
    updateFilters(newFilters);
    setIsOpen(false);
  };

  // フィルター更新
  const updateFilter = (columnId: string, value: unknown) => {
    const existingFilterIndex = columnFilters.findIndex(
      (f) => f.id === columnId
    );
    if (existingFilterIndex >= 0) {
      const newFilters = [...columnFilters];
      newFilters[existingFilterIndex] = { id: columnId, value };
      updateFilters(newFilters);
    }
  };

  // フィルター削除
  const removeFilter = (columnId: string) => {
    const newFilters = columnFilters.filter((f) => f.id !== columnId);
    updateFilters(newFilters);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 flex-wrap">
        {/* フィルター追加ボタン */}
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings2 />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>フィルター</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start">
            <ScrollArea className="[&>div[data-radix-scroll-area-viewport]]:max-h-[240px]">
              {filterableColumns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  フィルター可能な項目がありません
                </p>
              ) : (
                filterableColumns.map((column) => {
                  const isActive = columnFilters.some(
                    (f) => f.id === column.id
                  );
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={isActive}
                      onCheckedChange={() => {
                        if (isActive) {
                          removeFilter(column.id);
                        } else {
                          addFilter(column.id);
                        }
                      }}
                      onSelect={(e) => {
                        e.preventDefault();
                      }}
                    >
                      {column.name}
                    </DropdownMenuCheckboxItem>
                  );
                })
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* アクティブフィルター */}
        {activeFilters.map((filter) => {
          const column = columns.find((col) => col.id === filter.columnId);
          return (
            <Popover key={filter.columnId}>
              <PopoverTrigger asChild>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-accent px-3 py-1.5"
                >
                  {filter.columnName}
                  <ChevronDown className="size-3" />
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="start">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {filter.columnName}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilter(filter.columnId)}
                      className="h-6 w-6 p-0 hover:bg-destructive/10"
                    >
                      <X />
                    </Button>
                  </div>
                  <div>
                    {renderFilterInput(
                      filter.columnId,
                      filter.columnType,
                      filter.value,
                      (value) => updateFilter(filter.columnId, value),
                      relationRecords,
                      column
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

/**
 * 型ガード関数: NumberFilterValue
 */
function isNumberFilterValue(value: unknown): value is NumberFilterValue {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    'operator' in v &&
    typeof v.operator === 'string' &&
    'value1' in v &&
    'value2' in v
  );
}

/**
 * 型ガード関数: DateFilterValue
 */
function isDateFilterValue(value: unknown): value is DateFilterValue {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    'preset' in v &&
    typeof v.preset === 'string' &&
    'startDate' in v &&
    'endDate' in v
  );
}

/**
 * 型ガード関数: string配列
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/**
 * 型ガード関数: CheckboxFilterValue
 */
function isCheckboxFilterValue(
  value: unknown
): value is 'all' | 'checked' | 'unchecked' {
  return value === 'all' || value === 'checked' || value === 'unchecked';
}

/**
 * カラム種別に応じたフィルター入力コンポーネントをレンダリング
 */
function renderFilterInput(
  columnId: string,
  columnType: Column['type'],
  value: unknown,
  onChange: (value: unknown) => void,
  relationRecords?: Map<string, RelationRecord[]>,
  column?: Column
) {
  switch (columnType) {
    case 'TEXT':
    case 'TEXTAREA':
      return (
        <TextFilter
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
        />
      );

    case 'NUMBER':
      return (
        <NumberFilter
          value={
            isNumberFilterValue(value)
              ? value
              : { operator: 'eq', value1: null, value2: null }
          }
          onChange={onChange}
        />
      );

    case 'DATE':
      return (
        <DateFilter
          value={
            isDateFilterValue(value)
              ? value
              : { preset: 'custom', startDate: null, endDate: null }
          }
          onChange={onChange}
        />
      );

    case 'SELECT':
      if (column?.type === 'SELECT') {
        return (
          <SelectFilter
            value={isStringArray(value) ? value : []}
            onChange={onChange}
            options={column.config?.options || []}
          />
        );
      }
      return null;

    case 'RELATION':
      return (
        <RelationFilter
          value={isStringArray(value) ? value : []}
          onChange={onChange}
          records={relationRecords?.get(columnId) || []}
        />
      );

    case 'CHECKBOX':
      return (
        <CheckboxFilter
          value={isCheckboxFilterValue(value) ? value : 'all'}
          onChange={onChange}
        />
      );

    default:
      return null;
  }
}
