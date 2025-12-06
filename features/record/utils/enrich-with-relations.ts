import { prisma } from '@/lib/prisma';
import type { Record as PrismaRecord } from '@prisma/client';
import type {
  Column,
  RelationColumn,
  RelationRecord,
} from '@/features/column/types';

/**
 * リレーションカラムを含むレコードデータを取得する（N+1対策）
 */
export async function enrichWithRelations(
  records: PrismaRecord[],
  columns: Column[]
): Promise<
  Array<
    PrismaRecord & {
      _relationData?: Record<string, RelationRecord | RelationRecord[] | null>;
    }
  >
> {
  // リレーションカラムを抽出
  const relationColumns = columns.filter(
    (col): col is RelationColumn => col.type === 'RELATION'
  );

  if (relationColumns.length === 0) {
    return records;
  }

  // すべての参照先レコードIDを収集
  const allReferencedIds = new Set<string>();
  records.forEach((record) => {
    relationColumns.forEach((col) => {
      const value = (record.data as Record<string, unknown>)[col.id];
      if (value) {
        const ids = Array.isArray(value) ? value : [value];
        ids.forEach((id) => {
          if (typeof id === 'string') {
            allReferencedIds.add(id);
          }
        });
      }
    });
  });

  // 参照先レコードがない場合はそのまま返す
  if (allReferencedIds.size === 0) {
    return records;
  }

  // 参照先レコードを一括取得（N+1を回避）
  const referencedRecords = await prisma.record.findMany({
    where: {
      id: { in: Array.from(allReferencedIds) },
    },
  });

  // レコードIDをキーにしたMapを作成（高速検索用）
  const recordMap = new Map(referencedRecords.map((r) => [r.id, r]));

  // 各レコードに参照先データを付与
  return records.map((record) => {
    const relationData: Record<
      string,
      RelationRecord | RelationRecord[] | null
    > = {};

    relationColumns.forEach((col) => {
      const value = (record.data as Record<string, unknown>)[col.id];
      if (value) {
        const ids = Array.isArray(value) ? value : [value];
        const referencedData = ids
          .map((id) => {
            if (typeof id !== 'string') return null;
            const refRecord = recordMap.get(id);
            if (!refRecord) return null;

            // 表示フィールドの値を取得
            const displayFieldValue = (
              refRecord.data as Record<string, unknown>
            )[col.config.displayField];

            return {
              id: refRecord.id,
              displayValue: displayFieldValue
                ? String(displayFieldValue)
                : refRecord.id,
              exists: true,
            };
          })
          .filter((d) => d !== null);

        relationData[col.id] =
          referencedData.length > 0
            ? Array.isArray(value)
              ? referencedData
              : referencedData[0]
            : null;
      }
    });

    return {
      ...record,
      _relationData: relationData,
    };
  });
}
