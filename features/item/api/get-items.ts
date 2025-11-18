'use server';

import { prisma } from '@/lib/prisma';
import type { Item } from '../types';

// 再帰的に子アイテムを取得するヘルパー関数
async function getItemWithChildren(itemId: string): Promise<Item> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
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

  if (!item) {
    throw new Error('Item not found');
  }

  // 子アイテムがある場合、再帰的に取得
  if (item.children && item.children.length > 0) {
    const childrenWithGrandchildren = await Promise.all(
      item.children.map((child) => getItemWithChildren(child.id))
    );
    item.children = childrenWithGrandchildren;
  }

  return item as Item;
}

export async function getItems(): Promise<Item[]> {
  // ルートアイテムのみ取得
  const rootItems = await prisma.item.findMany({
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

  // 各ルートアイテムの子を再帰的に取得
  const itemsWithChildren = await Promise.all(
    rootItems.map((item) => getItemWithChildren(item.id))
  );

  return itemsWithChildren;
}
