import { prisma } from '@/lib/prisma';
import { getUsers } from '@/features/user/api/get-users';
import { getGroups } from '@/features/group/api/get-groups';
import type { Record as PrismaRecord } from '@prisma/client';
import type { User } from '@/features/user/types';
import type { Group } from '@/features/group/types';
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

  // カラムごとに参照先データを取得してMapを作成
  // Map<カラムID, Map<レコードID, RelationRecord>>
  const columnDataMap = new Map<string, Map<string, RelationRecord>>();

  // テーブルごとに生データをキャッシュ（重複取得を防ぐ）
  const tableDataCache = new Map<
    string,
    Map<string, unknown> | Array<unknown>
  >();

  // カラムごとにデータを取得
  for (const col of relationColumns) {
    const { referencedTableId, displayField } = col.config;
    const ids = tableReferencedIds.get(referencedTableId);
    if (!ids || ids.size === 0) continue;

    const idsArray = Array.from(ids);
    const dataMap = new Map<string, RelationRecord>();

    // システムテーブル: users
    if (referencedTableId === 'users') {
      // キャッシュがなければ取得
      if (!tableDataCache.has('users')) {
        const users = await getUsers();
        tableDataCache.set('users', new Map(users.map((u) => [u.id, u])));
      }
      const userMap = tableDataCache.get('users') as Map<string, User>;

      idsArray.forEach((id) => {
        const user = userMap.get(id);
        if (user) {
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
    }
    // システムテーブル: groups
    else if (referencedTableId === 'groups') {
      // キャッシュがなければ取得
      if (!tableDataCache.has('groups')) {
        const groups = await getGroups();
        tableDataCache.set('groups', new Map(groups.map((g) => [g.id, g])));
      }
      const groupMap = tableDataCache.get('groups') as Map<string, Group>;

      idsArray.forEach((id) => {
        const group = groupMap.get(id);
        if (group) {
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
    }
    // 通常のテーブル
    else {
      // キャッシュがなければ取得
      if (!tableDataCache.has(referencedTableId)) {
        const tableIds = tableReferencedIds.get(referencedTableId);
        if (tableIds) {
          const referencedRecords = await prisma.record.findMany({
            where: {
              id: { in: Array.from(tableIds) },
            },
          });
          tableDataCache.set(
            referencedTableId,
            new Map(referencedRecords.map((r) => [r.id, r]))
          );
        }
      }
      const recordMap = tableDataCache.get(referencedTableId) as Map<
        string,
        PrismaRecord
      >;

      idsArray.forEach((id) => {
        const refRecord = recordMap?.get(id);
        if (refRecord) {
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
        } else {
          dataMap.set(id, { id, displayValue: id, exists: false });
        }
      });
    }

    columnDataMap.set(col.id, dataMap);
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
        const colDataMap = columnDataMap.get(col.id);
        if (!colDataMap) return;

        const ids = Array.isArray(value) ? value : [value];
        const referencedData = ids
          .map((id) => {
            if (typeof id !== 'string') return null;
            return colDataMap.get(id) || null;
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
