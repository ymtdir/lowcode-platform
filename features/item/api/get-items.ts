'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canAccessItem } from '@/lib/permissions';
import type { Item } from '../types';

/**
 * 再帰的に子アイテムを取得するヘルパー関数
 */
async function getItemWithChildren(
  itemId: string,
  userId: string,
  userRole: 'ADMIN' | 'DEVELOPER' | 'MEMBER'
): Promise<Item | null> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      children: {
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
    return null;
  }

  // 権限チェック
  const { canAccess } = await canAccessItem(itemId, userId, userRole);
  if (!canAccess) {
    return null;
  }

  // 子アイテムがある場合、再帰的に取得（権限チェックも行う）
  if (item.children && item.children.length > 0) {
    const childrenWithGrandchildren = await Promise.all(
      item.children.map((child) =>
        getItemWithChildren(child.id, userId, userRole)
      )
    );
    // nullを除外
    item.children = childrenWithGrandchildren.filter(
      (child): child is Item => child !== null
    );
  }

  // 再帰的な構造のため、型アサーションが必要
  // Prisma型からItem型（Discriminated Union）への変換
  return item as Item;
}

/**
 * すべてのアイテムを再帰的に取得するServer Action
 */
export async function getItems(): Promise<Item[]> {
  // 認証チェック
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return [];
  }

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

  // 各ルートアイテムの子を再帰的に取得（権限チェックも行う）
  const itemsWithChildren = await Promise.all(
    rootItems.map((item) =>
      getItemWithChildren(item.id, currentUser.id, currentUser.role)
    )
  );

  // nullを除外
  return itemsWithChildren.filter((item): item is Item => item !== null);
}
