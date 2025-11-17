'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type ReorderItemsInput = {
  itemId: string;
  newParentId: string | null;
  reorderedSiblings: Array<{ id: string; order: number }>;
};

// アイテムの並び替えと親子関係の変更
export async function reorderItems(input: ReorderItemsInput) {
  const { itemId, newParentId, reorderedSiblings } = input;

  try {
    // 移動対象のアイテムを取得
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        children: {
          select: { id: true },
        },
      },
    });

    if (!item) {
      return { success: false, error: 'アイテムが見つかりません' };
    }

    // 循環参照チェック（自分自身または自分の子孫を親にできない）
    if (newParentId) {
      const isDescendant = await checkIsDescendant(itemId, newParentId);
      if (itemId === newParentId || isDescendant) {
        return {
          success: false,
          error: '自分自身または子アイテムを親にすることはできません',
        };
      }
    }

    // フロントエンドから受け取った順序をそのまま適用（並列実行）
    await prisma.$transaction(async (tx) => {
      await Promise.all(
        reorderedSiblings.map((sibling) =>
          tx.item.update({
            where: { id: sibling.id },
            data: {
              parentId: sibling.id === itemId ? newParentId : undefined,
              order: sibling.order,
            },
          })
        )
      );
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('アイテムの並び替えに失敗しました:', error);
    return { error: 'アイテムの並び替えに失敗しました' };
  }
}

// 指定したアイテムが別のアイテムの子孫かどうかをチェック
async function checkIsDescendant(
  itemId: string,
  potentialAncestorId: string
): Promise<boolean> {
  const item = await prisma.item.findUnique({
    where: { id: potentialAncestorId },
    select: { parentId: true },
  });

  if (!item || !item.parentId) {
    return false;
  }

  if (item.parentId === itemId) {
    return true;
  }

  return checkIsDescendant(itemId, item.parentId);
}
