'use server';

import { prisma } from '@/lib/prisma';
import type {
  Column,
  RelationColumn,
  RelationRecord,
} from '@/features/column/types';

/**
 * リレーションカラムで参照可能なレコード一覧を取得する
 */
export async function getRelationRecords(
  columns: Column[]
): Promise<Map<string, RelationRecord[]>> {
  // リレーションカラムを抽出
  const relationColumns = columns.filter(
    (col): col is RelationColumn => col.type === 'RELATION'
  );

  if (relationColumns.length === 0) {
    return new Map();
  }

  // カラムごとにレコードを取得
  const relationRecordsMap = new Map<string, RelationRecord[]>();

  await Promise.all(
    relationColumns.map(async (col) => {
      const { referencedTableId, displayField } = col.config;

      // レコードを取得
      const records = await prisma.record.findMany({
        where: { tableId: referencedTableId },
        orderBy: { createdAt: 'desc' },
      });

      // RelationRecord形式に変換
      const relationRecords: RelationRecord[] = records.map((record) => {
        const displayValue = displayField
          ? ((record.data as Record<string, unknown>)[displayField] as string)
          : record.id;

        return {
          id: record.id,
          displayValue: displayValue || record.id,
          exists: true,
        };
      });

      // columnIdをキーにする
      relationRecordsMap.set(col.id, relationRecords);
    })
  );

  return relationRecordsMap;
}
