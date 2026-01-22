'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageStyles } from '@/lib/permissions';
import type { Script } from '../types';

type FormState = {
  error?: string;
  success?: boolean;
  script?: Script;
};

/**
 * カスタムスクリプトを更新するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 */
export async function updateScript(content: string): Promise<FormState> {
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
    const setting = await prisma.setting.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        customScript: content,
      },
      update: {
        customScript: content,
      },
      select: { customScript: true },
    });

    revalidatePath('/', 'layout');

    return {
      success: true,
      script: { content: setting.customScript ?? '' },
    };
  } catch (error) {
    console.error('スクリプト更新エラー:', error);
    return { error: 'スクリプトの更新に失敗しました' };
  }
}
