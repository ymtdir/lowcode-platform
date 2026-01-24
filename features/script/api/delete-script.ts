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
 * スクリプトを削除するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 */
export async function deleteScript(scriptId: string): Promise<FormState> {
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
    const existingScript = await prisma.script.findUnique({
      where: { id: scriptId },
      select: { itemId: true },
    });

    if (!existingScript) {
      return { error: 'スクリプトが存在しません' };
    }

    await prisma.script.delete({
      where: { id: scriptId },
    });

    if (existingScript.itemId) {
      revalidatePath(`/${existingScript.itemId}/edit`);
      revalidatePath(`/${existingScript.itemId}`);
    } else {
      revalidatePath('/', 'layout');
    }
    return { success: true };
  } catch (error) {
    console.error('スクリプト削除エラー:', error);
    return { error: 'スクリプトの削除に失敗しました' };
  }
}
