'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canAccessItem } from '@/lib/permissions';
import type { Item } from '../types';

/**
 * IDでアイテムを取得するServer Action
 */
export async function getItemById(id: string): Promise<Item | null> {
  // 認証チェック
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      children: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      _count: {
        select: {
          children: true,
        },
      },
    },
  });
  if (!item) return null;

  // 権限チェック
  const { canAccess } = await canAccessItem(
    id,
    currentUser.id,
    currentUser.role
  );
  if (!canAccess) return null;

  return item as Item | null;
}
