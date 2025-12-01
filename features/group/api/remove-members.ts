'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageGroups } from '@/lib/permissions';

/**
 * メンバー削除結果の型
 */
type Result = {
  success?: boolean;
  error?: string;
  successCount?: number;
};

/**
 * グループからメンバーを削除するServer Action
 * ADMINロールのみ実行可能
 */
export async function removeMembers(
  groupId: string,
  userIds: string[]
): Promise<Result> {
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

    if (!currentUser || !canManageGroups(currentUser.role)) {
      return { error: 'この操作を行う権限がありません' };
    }

    if (userIds.length === 0) {
      return { error: 'ユーザーが選択されていません' };
    }

    // トランザクションで一括削除
    const result = await prisma.groupMember.deleteMany({
      where: {
        groupId,
        userId: {
          in: userIds,
        },
      },
    });

    revalidatePath('/groups');
    return { success: true, successCount: result.count };
  } catch (error) {
    console.error('メンバー一括削除エラー:', error);
    return { error: 'メンバーの削除に失敗しました' };
  }
}
