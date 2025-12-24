'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canManageStructure } from '@/lib/permissions';
import type { PermissionWithRelations } from '@/features/permission/types';

/**
 * アイテムの権限一覧を取得
 */
export async function getPermissions(
  itemId: string
): Promise<
  | { success: true; permissions: PermissionWithRelations[] }
  | { error: string; permissions: [] }
> {
  try {
    // 認証チェック
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: '認証が必要です', permissions: [] };
    }

    // 構造管理権限チェック（DEVELOPER以上）
    if (!canManageStructure(currentUser.role)) {
      return { error: '権限がありません', permissions: [] };
    }

    // アイテムの存在確認
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return { error: 'アイテムが見つかりません', permissions: [] };
    }

    // 権限一覧を取得
    const permissions = await prisma.itemPermission.findMany({
      where: { itemId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, permissions };
  } catch (error) {
    console.error('権限の取得に失敗しました:', error);
    return { error: '権限の取得に失敗しました', permissions: [] };
  }
}
