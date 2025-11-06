'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function addMembers(groupId: string, userIds: string[]) {
  try {
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
