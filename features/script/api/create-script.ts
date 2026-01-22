'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageStyles } from '@/lib/permissions';
import type { Script, CreateScriptInput } from '../types';

type FormState = {
  error?: string;
  success?: boolean;
  script?: Script;
};

/**
 * スクリプトを作成するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 * itemId が null の場合はグローバルスクリプトを作成
 */
export async function createScript(
  itemId: string | null,
  input: CreateScriptInput
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

  if (!input.name || input.name.trim() === '') {
    return { error: 'スクリプト名を入力してください' };
  }

  try {
    const script = await prisma.$transaction(async (tx) => {
      // 現在の最大orderを取得
      const maxOrder = await tx.script.aggregate({
        where: { itemId },
        _max: { order: true },
      });

      const newOrder = (maxOrder._max.order ?? -1) + 1;

      return tx.script.create({
        data: {
          itemId,
          name: input.name.trim(),
          content: input.content ?? '',
          order: newOrder,
        },
        select: {
          id: true,
          name: true,
          content: true,
          order: true,
        },
      });
    });

    if (itemId) {
      revalidatePath(`/${itemId}/edit`);
    } else {
      revalidatePath('/', 'layout');
    }
    return { success: true, script };
  } catch (error) {
    console.error('スクリプト作成エラー:', error);
    return { error: 'スクリプトの作成に失敗しました' };
  }
}
