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
 * スクリプトを削除するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 */
export async function deleteScript(scriptId: string): Promise<FormState> {
  // ユーザー情報を取得
  const currentUser = await requireAuth().catch(() => null);

  if (!currentUser) {
    return { error: '認証が必要です' };
  }

  if (!canManageStyles(currentUser.role)) {
    return { error: 'この操作を行う権限がありません' };
  }

  try {
    const existingScript = await prisma.script.findUnique({
      where: { id: scriptId },
      select: { itemId: true },
    });

    if (!existingScript) {
      return { error: 'スクリプトが存在しません' };
    }

    await prisma.script.delete({
      where: { id: scriptId },
    });

    if (existingScript.itemId) {
      revalidatePath(`/${existingScript.itemId}/edit`);
      revalidatePath(`/${existingScript.itemId}`);
    } else {
      revalidatePath('/', 'layout');
    }
    return { success: true };
  } catch (error) {
    console.error('スクリプト削除エラー:', error);
    return { error: 'スクリプトの削除に失敗しました' };
  }
}
