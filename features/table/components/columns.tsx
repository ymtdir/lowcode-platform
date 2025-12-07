'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import type {
  Column,
  SelectColumn,
  MultiSelectColumn,
  RelationColumn,
  RelationRecord,
} from '@/features/column/types';
import type { Record, RecordData } from '@/features/record/types';
import { TextCell } from './cells/text-cell';
import { NumberCell } from './cells/number-cell';
import { SelectCell } from './cells/select-cell';
import { MultiSelectCell } from './cells/multi-select-cell';
import { CheckboxCell } from './cells/checkbox-cell';
import { DateCell } from './cells/date-cell';
import { TextareaCell } from './cells/textarea-cell';
import { RelationCell } from './cells/relation-cell';

/**
 * セル変更ハンドラの型
 */
type CellChangeHandler = (
  recordId: string,
  columnId: string,
  value: unknown
) => void;

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
    header: column.name,
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
              value={(value as string) ?? null}
              onChange={handleChange}
              options={(column as SelectColumn).config?.options ?? []}
              readOnly={readOnly}
            />
          );
        case 'MULTI_SELECT':
          return (
            <MultiSelectCell
              value={(value as string[]) ?? null}
              onChange={handleChange}
              options={(column as MultiSelectColumn).config?.options ?? []}
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
