'use server';

import { prisma } from '@/lib/prisma';
import type { ItemType } from '@prisma/client';

/**
 * パンくずリスト用のアイテム型
 */
export type BreadcrumbItem = {
  id: string;
  name: string;
  type: ItemType;
};

/**
 * DBから取得するアイテムの型
 */
type AncestorItem = {
  id: string;
  name: string;
  type: ItemType;
  parentId: string | null;
};

/**
 * パンくずリスト用にアイテムの階層を取得するServer Action
 * ルートから現在のアイテムまでの順序で返す
 */
export async function getItemBreadcrumb(
  itemId: string
): Promise<BreadcrumbItem[]> {
  const ancestors: BreadcrumbItem[] = [];
  let currentId: string | null = itemId;

  // 現在のアイテムから親を辿る
  while (currentId) {
    const currentItem: AncestorItem | null = await prisma.item.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        name: true,
        type: true,
        parentId: true,
      },
    });

    if (!currentItem) {
      break;
    }

    ancestors.unshift({
      id: currentItem.id,
      name: currentItem.name,
      type: currentItem.type,
    });

    currentId = currentItem.parentId;
  }

  return ancestors;
}
