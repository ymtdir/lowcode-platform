'use server';

import { revalidatePath } from 'next/cache';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageStyles } from '@/lib/permissions';
import type { Style, CreateStyleInput } from '../types';

type FormState = {
  error?: string;
  success?: boolean;
  style?: Style;
};

/**
 * スタイルを作成するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 * itemId が null の場合はグローバルスタイルを作成
 */
export async function createStyle(
  itemId: string | null,
  input: CreateStyleInput
): Promise<FormState> {
  // ユーザー情報を取得
  const currentUser = await requireAuth().catch(() => null);

  if (!currentUser) {
    return { error: '認証が必要です' };
  }

  if (!canManageStyles(currentUser.role)) {
    return { error: 'この操作を行う権限がありません' };
  }

  if (!input.name || input.name.trim() === '') {
    return { error: 'スタイル名を入力してください' };
  }

  try {
    const style = await prisma.$transaction(async (tx) => {
      // 現在の最大orderを取得
      const maxOrder = await tx.style.aggregate({
        where: { itemId },
        _max: { order: true },
      });

      const newOrder = (maxOrder._max.order ?? -1) + 1;

      return tx.style.create({
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
      revalidatePath(`/${itemId}`);
    } else {
      revalidatePath('/', 'layout');
    }
    return { success: true, style };
  } catch (error) {
    console.error('スタイル作成エラー:', error);
    return { error: 'スタイルの作成に失敗しました' };
  }
}
