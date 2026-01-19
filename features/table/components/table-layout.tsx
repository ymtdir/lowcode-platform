'use client';

import type { Permission } from '@prisma/client';
import type { Column, RelationRecord } from '@/features/column/types';
import type { Record } from '@/features/record/types';
import type { ExportColumnFilter } from '@/features/table/types/export';
import type { Style } from '@/features/style';
import { DataTable } from './data-table';
import { StyleInjector } from '@/components/shared/style-injector';

/**
 * TableLayoutのProps型
 */
type TableLayoutProps = {
  itemId: string;
  itemName: string;
  columns: Column[];
  records: Record[];
  relationRecords: Map<string, RelationRecord[]>;
  permissionLevel: Permission;
  initialFilters?: ExportColumnFilter[];
  styles?: Style[];
};

/**
 * テーブル一覧画面のレイアウトコンポーネント
 */
export function TableLayout({
  itemId,
  itemName,
  columns,
  records,
  relationRecords,
  permissionLevel,
  initialFilters = [],
  styles = [],
}: TableLayoutProps) {
  return (
    <>
      <StyleInjector styles={styles} />
      <div className="w-full p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{itemName}</h1>
        </div>

        <DataTable
          tableId={itemId}
          columns={columns}
          initialRecords={records}
          relationRecords={relationRecords}
          permissionLevel={permissionLevel}
          initialFilters={initialFilters}
        />
      </div>
    </>
  );
}
