'use server';

import { prisma } from '@/lib/prisma';
import type { Item } from '../types';

/**
 * IDでアイテムを取得するServer Action
 */
export async function getItemById(id: string): Promise<Item | null> {
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      children: {
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
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

  return item as Item | null;
}
