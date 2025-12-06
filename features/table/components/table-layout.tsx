import type { Permission } from '@prisma/client';
import type { Column, RelationRecord } from '@/features/column/types';
import type { Record } from '@/features/record/types';
import { DataTable } from './data-table';

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
}: TableLayoutProps) {
  return (
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
      />
    </div>
  );
}
