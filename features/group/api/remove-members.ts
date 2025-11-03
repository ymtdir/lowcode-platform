'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

type Result = {
  success?: boolean;
  error?: string;
  successCount?: number;
};

export async function removeMembers(
  groupId: string,
  userIds: string[]
): Promise<Result> {
  try {
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
