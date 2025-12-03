'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canManageStructure } from '@/lib/permissions';

/**
 * アイテムから権限を削除
 */
export async function removePermission(
  permissionId: string
): Promise<{ success: true } | { error: string }> {
  try {
    // 認証チェック
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: '認証が必要です' };
    }

    // 構造管理権限チェック（DEVELOPER以上）
    if (!canManageStructure(currentUser.role)) {
      return { error: '権限がありません' };
    }

    // 権限の存在確認
    const permission = await prisma.itemPermission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return { error: '権限が見つかりません' };
    }

    // 権限を削除
    await prisma.itemPermission.delete({
      where: { id: permissionId },
    });

    return { success: true };
  } catch (error) {
    console.error('権限の削除に失敗しました:', error);
    return { error: '権限の削除に失敗しました' };
  }
}
