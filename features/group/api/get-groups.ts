'use server';

import { prisma } from '@/lib/prisma';
import type { Group } from '../types';

/**
 * すべてのグループを取得するServer Action
 */
export async function getGroups(): Promise<Group[]> {
  const groups = await prisma.group.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      parent: {
        select: {
          name: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
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
          members: true,
        },
      },
    },
  });

  return groups as Group[];
}
