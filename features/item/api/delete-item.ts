'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageStructure } from '@/lib/permissions';

/**
 * アイテム削除結果の型
 */
export type DeleteItemResult = {
  error?: string;
  success?: boolean;
};

/**
 * アイテムを削除するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 */
export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  // ユーザー情報を取得
  const currentUser = await requireAuth().catch(() => null);

  if (!currentUser) {
    return { error: '認証が必要です' };
  }

  // 権限チェック
  if (!canManageStructure(currentUser.role)) {
    return { error: 'この操作を行う権限がありません' };
  }

  try {
    // アイテムを削除（Cascadeで子アイテムも削除される）
    await prisma.item.delete({
      where: { id: itemId },
    });

    // キャッシュを再検証
    revalidatePath('/');
    revalidatePath('/workspace');

    return {
      success: true,
    };
  } catch (error) {
    console.error('アイテム削除エラー:', error);
    return { error: 'アイテムの削除に失敗しました' };
  }
}
