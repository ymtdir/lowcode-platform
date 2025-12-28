'use server';

import { prisma } from '@/lib/prisma';
import type { Record } from '../types';
import type { ExportColumnFilter } from '@/features/table/types/export';
import { convertFiltersToPrismaWhere } from '@/features/table/utils/filter-converter';

/**
 * レコード取得オプション
 */
type GetRecordsOptions = {
  filters?: ExportColumnFilter[];
};

/**
 * テーブルに紐づくレコード一覧を取得するServer Action
 */
export async function getRecords(
  tableId: string,
  options?: GetRecordsOptions
): Promise<Record[]> {
  const { filters = [] } = options || {};

  // フィルタ条件をPrisma形式に変換
  const where = convertFiltersToPrismaWhere(filters);

  const records = await prisma.record.findMany({
    where: {
      tableId,
      ...where,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Prismaの`data: Json`フィールドは、カスタム型の`data: RecordData`と互換
  // 型キャストで意図を明示
  return records as Record[];
}
