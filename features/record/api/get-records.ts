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

  return records as Record[];
}
