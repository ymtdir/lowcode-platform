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
 * スタイルを削除するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 */
export async function deleteStyle(styleId: string): Promise<FormState> {
  // ユーザー情報を取得
  const currentUser = await requireAuth().catch(() => null);

  if (!currentUser) {
    return { error: '認証が必要です' };
  }

  if (!canManageStyles(currentUser.role)) {
    return { error: 'この操作を行う権限がありません' };
  }

  try {
    const existingStyle = await prisma.style.findUnique({
      where: { id: styleId },
      select: { itemId: true },
    });

    if (!existingStyle) {
      return { error: 'スタイルが存在しません' };
    }

    await prisma.style.delete({
      where: { id: styleId },
    });

    if (existingStyle.itemId) {
      revalidatePath(`/${existingStyle.itemId}/edit`);
      revalidatePath(`/${existingStyle.itemId}`);
    } else {
      revalidatePath('/', 'layout');
    }
    return { success: true };
  } catch (error) {
    console.error('スタイル削除エラー:', error);
    return { error: 'スタイルの削除に失敗しました' };
  }
}
