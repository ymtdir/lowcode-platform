'use server';

import { prisma } from '@/lib/prisma';
import type { Item } from '../types';

/**
 * すべてのテーブル（TABLE型のアイテム）を取得するServer Action
 */
export async function getTables(): Promise<Item[]> {
  const items = await prisma.item.findMany({
    where: {
      type: 'TABLE',
    },
    orderBy: {
      order: 'asc',
    },
  });

  // TABLE型のアイテムのみを返す（型ガード）
  return items.filter((item): item is Item => item.type === 'TABLE');
}
