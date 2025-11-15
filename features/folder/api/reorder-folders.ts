'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type ReorderFoldersInput = {
  folderId: string;
  newParentId: string | null;
  reorderedSiblings: Array<{ id: string; order: number }>;
};

// フォルダの並び替えと親子関係の変更
export async function reorderFolders(input: ReorderFoldersInput) {
  const { folderId, newParentId, reorderedSiblings } = input;

  try {
    // 移動対象のフォルダを取得
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        children: {
          select: { id: true },
        },
      },
    });

    if (!folder) {
      return { success: false, error: 'フォルダが見つかりません' };
    }

    // 循環参照チェック（自分自身または自分の子孫を親にできない）
    if (newParentId) {
      const isDescendant = await checkIsDescendant(folderId, newParentId);
      if (folderId === newParentId || isDescendant) {
        return {
          success: false,
          error: '自分自身または子フォルダを親にすることはできません',
        };
      }
    }

    // フロントエンドから受け取った順序をそのまま適用（並列実行）
    await prisma.$transaction(async (tx) => {
      await Promise.all(
        reorderedSiblings.map((item) =>
          tx.folder.update({
            where: { id: item.id },
            data: {
              parentId: item.id === folderId ? newParentId : undefined,
              order: item.order,
            },
          })
        )
      );
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('フォルダの並び替えに失敗しました:', error);
    return { error: 'フォルダの並び替えに失敗しました' };
  }
}

// 指定したフォルダが別のフォルダの子孫かどうかをチェック
async function checkIsDescendant(
  folderId: string,
  potentialAncestorId: string
): Promise<boolean> {
  const folder = await prisma.folder.findUnique({
    where: { id: potentialAncestorId },
    select: { parentId: true },
  });

  if (!folder || !folder.parentId) {
    return false;
  }

  if (folder.parentId === folderId) {
    return true;
  }

  return checkIsDescendant(folderId, folder.parentId);
}
