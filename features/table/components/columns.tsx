'use client';

import { ColumnDef, FilterFn, SortingFn } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import type {
  Column,
  SelectColumn,
  RelationColumn,
  RelationRecord,
  ColumnType,
} from '@/features/column/types';
import type { Record, RecordData } from '@/features/record/types';
import { TextCell } from './cells/text-cell';
import { NumberCell } from './cells/number-cell';
import { SelectCell } from './cells/select-cell';
import { CheckboxCell } from './cells/checkbox-cell';
import { DateCell } from './cells/date-cell';
import { TextareaCell } from './cells/textarea-cell';
import { RelationCell } from './cells/relation-cell';
import { SortableHeader } from './sortable-header';

/**
 * セル変更ハンドラの型
 */
type CellChangeHandler = (
  recordId: string,
  columnId: string,
  value: unknown
) => void;

/**
 * カラム種別に応じたソート関数を取得
 */
function getSortingFn(
  columnType: ColumnType
): SortingFn<Record> | 'alphanumeric' | undefined {
  switch (columnType) {
    case 'NUMBER':
      return (rowA, rowB, columnId) => {
        const a = rowA.getValue(columnId) as number | null;
        const b = rowB.getValue(columnId) as number | null;
        if (a === null && b === null) return 0;
        if (a === null) return 1;
        if (b === null) return -1;
        return a - b;
      };
    case 'DATE':
      return (rowA, rowB, columnId) => {
        const a = rowA.getValue(columnId) as string | null;
        const b = rowB.getValue(columnId) as string | null;
        if (!a && !b) return 0;
        if (!a) return 1;
        if (!b) return -1;
        return new Date(a).getTime() - new Date(b).getTime();
      };
    case 'CHECKBOX':
      return (rowA, rowB, columnId) => {
        const a = rowA.getValue(columnId) as boolean;
        const b = rowB.getValue(columnId) as boolean;
        return a === b ? 0 : a ? 1 : -1;
      };
    default:
      // TEXT, TEXTAREA, SELECT, RELATIONはデフォルトのアルファベット順ソート
      return 'alphanumeric';
  }
}

/**
 * カラム種別に応じたフィルタ関数を取得
 */
function getFilterFn(columnType: ColumnType): FilterFn<Record> | undefined {
  switch (columnType) {
    case 'TEXT':
    case 'TEXTAREA':
      return (row, columnId, filterValue) => {
        const value = row.getValue(columnId) as string | null;
        const search = filterValue as string;
        if (!search) return true;
        return (value || '').toLowerCase().includes(search.toLowerCase());
      };
    case 'NUMBER':
      return (row, columnId, filterValue) => {
        const value = row.getValue(columnId) as number | null;
        const filter = filterValue as {
          operator: string;
          value1: number | null;
          value2: number | null;
        };
        if (value === null) return false;
        if (filter.value1 === null) return true;

        switch (filter.operator) {
          case 'eq':
            return value === filter.value1;
          case 'ne':
            return value !== filter.value1;
          case 'gt':
            return value > filter.value1;
          case 'gte':
            return value >= filter.value1;
          case 'lt':
            return value < filter.value1;
          case 'lte':
            return value <= filter.value1;
          case 'range':
            if (filter.value2 === null) return value >= filter.value1;
            return value >= filter.value1 && value <= filter.value2;
          default:
            return true;
        }
      };
    case 'DATE':
      return (row, columnId, filterValue) => {
        const value = row.getValue(columnId) as string | null;
        const filter = filterValue as {
          startDate: Date | null;
          endDate: Date | null;
        };
        if (!value) return false;
        if (!filter.startDate && !filter.endDate) return true;

        const date = new Date(value);
        const start = filter.startDate
          ? new Date(filter.startDate)
          : new Date(0);
        const end = filter.endDate
          ? new Date(filter.endDate)
          : new Date(8640000000000000);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return date >= start && date <= end;
      };
    case 'SELECT':
      return (row, columnId, filterValue) => {
        const value = row.getValue(columnId) as string | string[] | null;
        const filter = filterValue as string[];
        if (!filter || filter.length === 0) return true;
        if (!value) return false;

        if (Array.isArray(value)) {
          return value.some((v) => filter.includes(v));
        }
        return filter.includes(value);
      };
    case 'RELATION':
      return (row, columnId, filterValue) => {
        const value = row.getValue(columnId) as string | string[] | null;
        const filter = filterValue as string[];
        if (!filter || filter.length === 0) return true;
        if (!value) return false;

        if (Array.isArray(value)) {
          return value.some((v) => filter.includes(v));
        }
        return filter.includes(value);
      };
    case 'CHECKBOX':
      return (row, columnId, filterValue) => {
        const value = row.getValue(columnId) as boolean;
        const filter = filterValue as 'all' | 'checked' | 'unchecked';
        if (filter === 'all') return true;
        if (filter === 'checked') return value === true;
        if (filter === 'unchecked') return value === false;
        return true;
      };
    default:
      return undefined;
  }
}

/**
 * レコードテーブルのカラム定義を生成する関数
 */
export const createColumns = (
  columns: Column[],
  onCellChange: CellChangeHandler,
  readOnly = false,
  relationRecordsMap?: Map<string, RelationRecord[]>
): ColumnDef<Record>[] => {
  // orderでソートされたカラム
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  const dataColumns: ColumnDef<Record>[] = sortedColumns.map((column) => ({
    id: column.id,
    accessorFn: (row) => (row.data as RecordData)[column.id],
    header: ({ column: tableColumn }) => (
      <SortableHeader column={tableColumn} title={column.name} />
    ),
    meta: { width: 'min-w-[100px]', title: column.name },
    enableSorting: true,
    enableColumnFilter: column.enableFilter ?? false,
    sortingFn: getSortingFn(column.type),
    filterFn: getFilterFn(column.type),
    cell: ({ row, getValue }) => {
      const value = getValue();
      const recordId = row.original.id;

      const handleChange = (newValue: unknown) => {
        onCellChange(recordId, column.id, newValue);
      };

      switch (column.type) {
        case 'TEXT':
          return (
            <TextCell
              value={(value as string) ?? ''}
              onChange={handleChange}
              placeholder={column.config?.placeholder}
              readOnly={readOnly}
            />
          );
        case 'TEXTAREA':
          return (
            <TextareaCell
              value={(value as string) ?? ''}
              onChange={handleChange}
              placeholder={column.config?.placeholder}
              readOnly={readOnly}
            />
          );
        case 'NUMBER':
          return (
            <NumberCell
              value={(value as number) ?? null}
              onChange={handleChange}
              min={column.config?.min}
              max={column.config?.max}
              step={column.config?.step}
              placeholder={column.config?.placeholder}
              unit={column.config?.unit}
              unitPosition={column.config?.unitPosition}
              thousandSeparator={column.config?.thousandSeparator}
              readOnly={readOnly}
            />
          );
        case 'DATE':
          return (
            <DateCell
              value={(value as string) ?? null}
              onChange={handleChange}
              precision={column.config?.precision}
              min={column.config?.min}
              max={column.config?.max}
              placeholder={column.config?.placeholder}
              readOnly={readOnly}
            />
          );
        case 'SELECT':
          return (
            <SelectCell
              value={(value as string | string[]) ?? null}
              onChange={handleChange}
              options={(column as SelectColumn).config?.options ?? []}
              allowMultiple={(column as SelectColumn).config?.allowMultiple}
              readOnly={readOnly}
            />
          );
        case 'CHECKBOX':
          return (
            <CheckboxCell
              value={(value as boolean) ?? false}
              onChange={handleChange}
              displayStyle={column.config?.displayStyle}
              checkedLabel={column.config?.checkedLabel}
              uncheckedLabel={column.config?.uncheckedLabel}
              readOnly={readOnly}
            />
          );
        case 'RELATION':
          const relationCol = column as RelationColumn;
          const availableRecords = relationRecordsMap?.get(column.id) || [];
          return (
            <RelationCell
              value={(value as string | string[]) ?? null}
              onChange={handleChange}
              records={availableRecords}
              allowMultiple={relationCol.config.allowMultiple}
              readOnly={readOnly}
            />
          );
        default:
          return <span>{String(value ?? '-')}</span>;
      }
    },
  }));

  // READ権限の場合はチェックボックス列を含めない
  if (readOnly) {
    return dataColumns;
  }

  // WRITE権限がある場合はチェックボックス列を含める
  const selectColumn: ColumnDef<Record> = {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="全て選択"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="行を選択"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: { width: 'w-12' },
  };

  return [selectColumn, ...dataColumns];
};
