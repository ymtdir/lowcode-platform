'use server';

import { prisma } from '@/lib/prisma';
import type { Group } from '../types';

export async function getGroupById(groupId: string): Promise<Group | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
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

  return group as Group | null;
}
