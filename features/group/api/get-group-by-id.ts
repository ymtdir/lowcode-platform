'use server';

import { prisma } from '@/lib/prisma';

export async function getGroupById(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      parent: {
        select: {
          id: true,
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
    },
  });

  return group;
}
