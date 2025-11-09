'use server';

import { prisma } from '@/lib/prisma';
import type { Folder } from '../types';

export async function getFolders(): Promise<Folder[]> {
  const folders = await prisma.folder.findMany({
    where: {
      parentId: null, // ルートフォルダのみ取得
    },
    orderBy: {
      createdAt: 'desc',
    },
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
          children: true,
        },
      },
    },
  });

  return folders;
}
