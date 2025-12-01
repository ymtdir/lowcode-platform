'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageGroups } from '@/lib/permissions';

/**
 * グループ削除結果の型
 */
type DeleteResult = {
  error?: string;
  success?: boolean;
};

/**
 * グループを削除するServer Action
 * ADMINロールのみ実行可能
 */
export async function deleteGroup(groupId: string): Promise<DeleteResult> {
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

    // 子グループが存在するか確認
    const childGroups = await prisma.group.findMany({
      where: { parentId: groupId },
    });

    if (childGroups.length > 0) {
      return {
        error: '子グループが存在するため削除できません',
      };
    }

    // グループを削除
    await prisma.group.delete({
      where: { id: groupId },
    });

    revalidatePath('/groups');
    return { success: true };
  } catch (error) {
    console.error('グループ削除エラー:', error);
    return { error: 'グループの削除に失敗しました' };
  }
}
