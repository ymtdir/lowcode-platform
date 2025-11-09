'use server';

import { prisma } from '@/lib/prisma';
import type { Folder } from '../types';

export async function getFolderById(id: string): Promise<Folder | null> {
  const folder = await prisma.folder.findUnique({
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

  return folder as Folder | null;
}
