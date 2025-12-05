'use server';

import { prisma } from '@/lib/prisma';
import type { Record } from '../types';

/**
 * テーブルに紐づくレコード一覧を取得するServer Action
 */
export async function getRecords(tableId: string): Promise<Record[]> {
  const records = await prisma.record.findMany({
    where: { tableId },
    orderBy: { createdAt: 'asc' },
  });

  // Prismaの`data: Json`フィールドは、カスタム型の`data: RecordData`と互換
  // 型キャストで意図を明示
  return records as Record[];
}
