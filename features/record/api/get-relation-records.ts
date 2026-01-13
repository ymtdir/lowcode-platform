'use server';

import { prisma } from '@/lib/prisma';
import { getUsers } from '@/features/user/api/get-users';
import { getGroups } from '@/features/group/api/get-groups';
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

      // システムテーブル: users
      if (referencedTableId === 'users') {
        const users = await getUsers();
        const relationRecords: RelationRecord[] = users.map((user) => ({
          id: user.id,
          displayValue:
            (user[displayField as keyof typeof user] as string) ||
            user.name ||
            user.email,
          exists: true,
        }));
        relationRecordsMap.set(col.id, relationRecords);
        return;
      }

      // システムテーブル: groups
      if (referencedTableId === 'groups') {
        const groups = await getGroups();
        const relationRecords: RelationRecord[] = groups.map((group) => ({
          id: group.id,
          displayValue:
            (group[displayField as keyof typeof group] as string) || group.name,
          exists: true,
        }));
        relationRecordsMap.set(col.id, relationRecords);
        return;
      }

      // 通常のテーブル
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
