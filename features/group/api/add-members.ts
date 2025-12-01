'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageGroups } from '@/lib/permissions';

/**
 * グループにメンバーを追加するServer Action
 * ADMINロールのみ実行可能
 */
export async function addMembers(groupId: string, userIds: string[]) {
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

    // 既存のメンバーをチェック
    const existingMembers = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: {
          in: userIds,
        },
      },
      select: { userId: true },
    });

    const existingUserIds = new Set(
      existingMembers.map((m: { userId: string }) => m.userId)
    );
    const newUserIds = userIds.filter((id) => !existingUserIds.has(id));

    if (newUserIds.length === 0) {
      return { error: 'すべてのユーザーは既にメンバーです' };
    }

    // トランザクションで一括追加
    await prisma.$transaction(
      newUserIds.map((userId) =>
        prisma.groupMember.create({
          data: {
            userId,
            groupId,
          },
        })
      )
    );

    revalidatePath('/groups');

    const skippedCount = existingUserIds.size;
    if (skippedCount > 0) {
      return {
        success: true,
        successCount: newUserIds.length,
        errorCount: skippedCount,
      };
    }

    return { success: true, successCount: newUserIds.length };
  } catch (error) {
    console.error('メンバー一括追加エラー:', error);
    return { error: 'メンバーの追加に失敗しました' };
  }
}
