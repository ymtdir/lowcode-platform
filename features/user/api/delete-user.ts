'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/permissions';
import { requireAuth } from '@/lib/auth';

/**
 * ユーザー削除結果の型
 */
type DeleteResult = {
  error?: string;
  success?: boolean;
};

/**
 * ユーザーを削除するServer Action
 * ADMINロールのみ実行可能
 */
export async function deleteUser(userId: string): Promise<DeleteResult> {
  try {
    // 現在のユーザーを取得
    const currentUser = await requireAuth().catch(() => null);

    if (!currentUser) {
      return { error: '認証エラーが発生しました' };
    }

    // 権限チェック
    if (!canManageUsers(currentUser.role)) {
      return { error: 'この操作を行う権限がありません' };
    }

    // 自分自身を削除しようとしている場合はエラー
    if (currentUser.id === userId) {
      return { error: '自分自身を削除することはできません' };
    }

    // ユーザーを削除
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    return { error: 'ユーザーの削除に失敗しました' };
  }
}
