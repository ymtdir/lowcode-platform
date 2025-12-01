'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
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
  try {
    // 認証チェック
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '認証が必要です' };
    }

    // 権限チェック
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { role: true },
    });

    if (!currentUser || !canManageStructure(currentUser.role)) {
      return { error: 'この操作を行う権限がありません' };
    }

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
