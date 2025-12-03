'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canManageStructure } from '@/lib/permissions';
import type { Permission } from '@prisma/client';

/**
 * アイテムに権限を追加
 */
export async function addPermission(
  itemId: string,
  targetType: 'user' | 'group',
  targetId: string,
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

    // アイテムの存在確認
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return { error: 'アイテムが見つかりません' };
    }

    // 対象の存在確認
    if (targetType === 'user') {
      const user = await prisma.user.findUnique({
        where: { id: targetId },
      });
      if (!user) {
        return { error: 'ユーザーが見つかりません' };
      }
    } else {
      const group = await prisma.group.findUnique({
        where: { id: targetId },
      });
      if (!group) {
        return { error: 'グループが見つかりません' };
      }
    }

    // 権限を追加
    await prisma.itemPermission.create({
      data: {
        itemId,
        userId: targetType === 'user' ? targetId : null,
        groupId: targetType === 'group' ? targetId : null,
        level,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('権限の追加に失敗しました:', error);
    return { error: '権限の追加に失敗しました' };
  }
}
