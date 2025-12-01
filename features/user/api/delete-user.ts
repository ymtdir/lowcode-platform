'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/permissions';

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
    const currentUserClient = await createClient();
    const {
      data: { user: currentUser },
    } = await currentUserClient.auth.getUser();

    if (!currentUser) {
      return { error: '認証エラーが発生しました' };
    }

    // 権限チェック
    const dbUser = await prisma.user.findUnique({
      where: { email: currentUser.email! },
      select: { role: true },
    });

    if (!dbUser || !canManageUsers(dbUser.role)) {
      return { error: 'この操作を行う権限がありません' };
    }

    // 自分自身を削除しようとしている場合はエラー
    if (currentUser.id === userId) {
      return { error: '自分自身を削除することはできません' };
    }

    const adminClient = createAdminClient();

    // Supabase Authからユーザーを削除
    const { error: authError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('ユーザー削除エラー（Auth）:', authError.message);
      return { error: 'ユーザーの削除に失敗しました' };
    }

    // Prismaからユーザーを削除
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
