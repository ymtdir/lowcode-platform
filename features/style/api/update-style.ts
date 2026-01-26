'use server';

import { revalidatePath } from 'next/cache';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageStyles } from '@/lib/permissions';
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
  // ユーザー情報を取得
  const currentUser = await requireAuth().catch(() => null);

  if (!currentUser) {
    return { error: '認証が必要です' };
  }

  if (!canManageStyles(currentUser.role)) {
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

    if (Object.keys(updateData).length === 0) {
      return { error: '更新内容がありません' };
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
      revalidatePath(`/${existingStyle.itemId}`);
    } else {
      revalidatePath('/', 'layout');
    }
    return { success: true, style };
  } catch (error) {
    console.error('スタイル更新エラー:', error);
    return { error: 'スタイルの更新に失敗しました' };
  }
}
