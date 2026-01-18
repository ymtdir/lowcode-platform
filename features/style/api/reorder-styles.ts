'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageColumns } from '@/lib/permissions';

type FormState = {
  error?: string;
  success?: boolean;
};

/**
 * スタイルの並び順を更新するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 */
export async function reorderStyles(
  itemId: string,
  styleIds: string[]
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

  if (!canManageColumns(dbUser.role)) {
    return { error: 'この操作を行う権限がありません' };
  }

  try {
    // トランザクションで一括更新
    await prisma.$transaction(
      styleIds.map((styleId, index) =>
        prisma.style.update({
          where: { id: styleId },
          data: { order: index },
        })
      )
    );

    revalidatePath(`/${itemId}/edit`);
    return { success: true };
  } catch (error) {
    console.error('スタイル並び替えエラー:', error);
    return { error: 'スタイルの並び替えに失敗しました' };
  }
}
