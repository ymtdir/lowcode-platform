'use server';

import { revalidatePath } from 'next/cache';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageStyles } from '@/lib/permissions';

type FormState = {
  error?: string;
  success?: boolean;
};

/**
 * スタイルの並び順を更新するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 * itemId が null の場合はグローバルスタイル
 */
export async function reorderStyles(
  itemId: string | null,
  styleIds: string[]
): Promise<FormState> {
  // ユーザー情報を取得
  const currentUser = await requireAuth().catch(() => null);

  if (!currentUser) {
    return { error: '認証が必要です' };
  }

  if (!canManageStyles(currentUser.role)) {
    return { error: 'この操作を行う権限がありません' };
  }

  try {
    // 更新対象のスタイルがすべて指定itemIdに属するか検証
    const validStyles = await prisma.style.findMany({
      where: { id: { in: styleIds }, itemId },
      select: { id: true },
    });

    if (validStyles.length !== styleIds.length) {
      return { error: '無効なスタイルIDが含まれています' };
    }

    // トランザクションで一括更新
    await prisma.$transaction(
      styleIds.map((styleId, index) =>
        prisma.style.update({
          where: { id: styleId },
          data: { order: index },
        })
      )
    );

    if (itemId) {
      revalidatePath(`/${itemId}/edit`);
      revalidatePath(`/${itemId}`);
    } else {
      revalidatePath('/', 'layout');
    }
    return { success: true };
  } catch (error) {
    console.error('スタイル並び替えエラー:', error);
    return { error: 'スタイルの並び替えに失敗しました' };
  }
}
