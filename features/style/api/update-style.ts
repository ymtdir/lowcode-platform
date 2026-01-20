'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageColumns } from '@/lib/permissions';
import type { Style, UpdateStyleInput } from '../types';

type FormState = {
  error?: string;
  success?: boolean;
  style?: Style;
};

/**
 * スタイルを更新するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 */
export async function updateStyle(
  styleId: string,
  input: UpdateStyleInput
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
    const existingStyle = await prisma.style.findUnique({
      where: { id: styleId },
      select: { itemId: true },
    });

    if (!existingStyle) {
      return { error: 'スタイルが見つかりません' };
    }

    const updateData: { name?: string; content?: string } = {};

    if (input.name !== undefined) {
      if (input.name.trim() === '') {
        return { error: 'スタイル名を入力してください' };
      }
      updateData.name = input.name.trim();
    }

    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    const style = await prisma.style.update({
      where: { id: styleId },
      data: updateData,
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
      },
    });

    if (existingStyle.itemId) {
      revalidatePath(`/${existingStyle.itemId}/edit`);
    } else {
      revalidatePath('/', 'layout');
    }
    return { success: true, style };
  } catch (error) {
    console.error('スタイル更新エラー:', error);
    return { error: 'スタイルの更新に失敗しました' };
  }
}
