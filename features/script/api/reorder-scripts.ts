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
 * スクリプトの並び順を更新するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 * itemId が null の場合はグローバルスクリプト
 */
export async function reorderScripts(
  itemId: string | null,
  scriptIds: string[]
): Promise<FormState> {
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
    // 更新対象のスクリプトがすべて指定itemIdに属するか検証
    const validScripts = await prisma.script.findMany({
      where: { id: { in: scriptIds }, itemId },
      select: { id: true },
    });

    if (validScripts.length !== scriptIds.length) {
      return { error: '無効なスクリプトIDが含まれています' };
    }

    // トランザクションで一括更新
    await prisma.$transaction(
      scriptIds.map((scriptId, index) =>
        prisma.script.update({
          where: { id: scriptId },
          data: { order: index },
        })
      )
    );

    if (itemId) {
      revalidatePath(`/${itemId}/edit`);
      revalidatePath(`/${itemId}`);
    } else {
      revalidatePath('/', 'layout');
    }
    return { success: true };
  } catch (error) {
    console.error('スクリプト並び替えエラー:', error);
    return { error: 'スクリプトの並び替えに失敗しました' };
  }
}
