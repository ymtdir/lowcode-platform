import { prisma } from '@/lib/prisma';
import { getUsers } from '@/features/user/api/get-users';
import { getGroups } from '@/features/group/api/get-groups';
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

  // 参照先IDをテーブルごとに分類して収集
  const tableReferencedIds = new Map<string, Set<string>>();
  records.forEach((record) => {
    relationColumns.forEach((col) => {
      const value = (record.data as Record<string, unknown>)[col.id];
      if (value) {
        const ids = Array.isArray(value) ? value : [value];
        ids.forEach((id) => {
          if (typeof id === 'string') {
            if (!tableReferencedIds.has(col.config.referencedTableId)) {
              tableReferencedIds.set(
                col.config.referencedTableId,
                new Set<string>()
              );
            }
            tableReferencedIds.get(col.config.referencedTableId)!.add(id);
          }
        });
      }
    });
  });

  // 参照先レコードがない場合はそのまま返す
  if (tableReferencedIds.size === 0) {
    return records;
  }

  // テーブルごとに参照先データを取得してMapを作成
  const dataMap = new Map<string, RelationRecord>();

  for (const [tableId, ids] of tableReferencedIds.entries()) {
    const idsArray = Array.from(ids);

    // システムテーブル: users
    if (tableId === 'users') {
      const users = await getUsers();
      const userMap = new Map(users.map((u) => [u.id, u]));
      idsArray.forEach((id) => {
        const user = userMap.get(id);
        if (user) {
          const displayField = relationColumns.find(
            (c) => c.config.referencedTableId === 'users'
          )?.config.displayField;
          dataMap.set(id, {
            id: user.id,
            displayValue:
              (displayField
                ? (user[displayField as keyof typeof user] as string)
                : null) ||
              user.name ||
              user.email,
            exists: true,
          });
        } else {
          dataMap.set(id, { id, displayValue: id, exists: false });
        }
      });
      continue;
    }

    // システムテーブル: groups
    if (tableId === 'groups') {
      const groups = await getGroups();
      const groupMap = new Map(groups.map((g) => [g.id, g]));
      idsArray.forEach((id) => {
        const group = groupMap.get(id);
        if (group) {
          const displayField = relationColumns.find(
            (c) => c.config.referencedTableId === 'groups'
          )?.config.displayField;
          dataMap.set(id, {
            id: group.id,
            displayValue:
              (displayField
                ? (group[displayField as keyof typeof group] as string)
                : null) || group.name,
            exists: true,
          });
        } else {
          dataMap.set(id, { id, displayValue: id, exists: false });
        }
      });
      continue;
    }

    // 通常のテーブル
    const referencedRecords = await prisma.record.findMany({
      where: {
        id: { in: idsArray },
      },
    });

    referencedRecords.forEach((refRecord) => {
      const displayField = relationColumns.find(
        (c) => c.config.referencedTableId === tableId
      )?.config.displayField;
      const displayFieldValue = displayField
        ? (refRecord.data as Record<string, unknown>)[displayField]
        : null;

      dataMap.set(refRecord.id, {
        id: refRecord.id,
        displayValue: displayFieldValue
          ? String(displayFieldValue)
          : refRecord.id,
        exists: true,
      });
    });

    // 存在しないIDの処理
    idsArray.forEach((id) => {
      if (!dataMap.has(id)) {
        dataMap.set(id, { id, displayValue: id, exists: false });
      }
    });
  }

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
            return dataMap.get(id) || null;
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
