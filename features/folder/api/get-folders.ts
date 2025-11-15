'use server';

import { prisma } from '@/lib/prisma';
import type { Folder } from '../types';

// 再帰的に子フォルダを取得するヘルパー関数
async function getFolderWithChildren(folderId: string): Promise<Folder> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
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
          order: 'asc',
        },
      },
      _count: {
        select: {
          children: true,
        },
      },
    },
  });

  if (!folder) {
    throw new Error('Folder not found');
  }

  // 子フォルダがある場合、再帰的に取得
  if (folder.children && folder.children.length > 0) {
    const childrenWithGrandchildren = await Promise.all(
      folder.children.map((child) => getFolderWithChildren(child.id))
    );
    folder.children = childrenWithGrandchildren;
  }

  return folder as Folder;
}

export async function getFolders(): Promise<Folder[]> {
  // ルートフォルダのみ取得
  const rootFolders = await prisma.folder.findMany({
    where: {
      parentId: null,
    },
    orderBy: {
      order: 'asc',
    },
    select: {
      id: true,
    },
  });

  // 各ルートフォルダの子を再帰的に取得
  const foldersWithChildren = await Promise.all(
    rootFolders.map((folder) => getFolderWithChildren(folder.id))
  );

  return foldersWithChildren;
}
