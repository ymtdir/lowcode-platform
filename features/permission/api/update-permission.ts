'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canManageStructure } from '@/lib/permissions';
import type { Permission } from '@prisma/client';

/**
 * アイテムの権限レベルを更新
 */
export async function updatePermission(
  permissionId: string,
  level: Permission
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

    // 権限レベルを更新
    await prisma.itemPermission.update({
      where: { id: permissionId },
      data: { level },
    });

    return { success: true };
  } catch (error) {
    console.error('権限の更新に失敗しました:', error);
    return { error: '権限の更新に失敗しました' };
  }
}
