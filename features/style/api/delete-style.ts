'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageStyles } from '@/lib/permissions';

type FormState = {
  error?: string;
  success?: boolean;
};

/**
 * スタイルを削除するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 */
export async function deleteStyle(styleId: string): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '認証が必要です' };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    select: { id: true, role: true },
  });

  if (!dbUser) {
    return { error: 'ユーザー情報が取得できませんでした' };
  }

  if (!canManageStyles(dbUser.role)) {
    return { error: 'この操作を行う権限がありません' };
  }

  try {
    const existingStyle = await prisma.style.findUnique({
      where: { id: styleId },
      select: { itemId: true },
    });

    if (!existingStyle) {
      return { error: 'スタイルが存在しません' };
    }

    await prisma.style.delete({
      where: { id: styleId },
    });

    if (existingStyle.itemId) {
      revalidatePath(`/${existingStyle.itemId}/edit`);
      revalidatePath(`/${existingStyle.itemId}`);
    } else {
      revalidatePath('/', 'layout');
    }
    return { success: true };
  } catch (error) {
    console.error('スタイル削除エラー:', error);
    return { error: 'スタイルの削除に失敗しました' };
  }
}
