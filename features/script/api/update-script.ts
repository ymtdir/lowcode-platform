'use server';

import { revalidatePath } from 'next/cache';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageStyles } from '@/lib/permissions';
import type { Script, UpdateScriptInput } from '../types';

type FormState = {
  error?: string;
  success?: boolean;
  script?: Script;
};

/**
 * スクリプトを更新するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 */
export async function updateScript(
  scriptId: string,
  input: UpdateScriptInput
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
    const existingScript = await prisma.script.findUnique({
      where: { id: scriptId },
      select: { itemId: true },
    });

    if (!existingScript) {
      return { error: 'スクリプトが見つかりません' };
    }

    const updateData: { name?: string; content?: string } = {};

    if (input.name !== undefined) {
      if (input.name.trim() === '') {
        return { error: 'スクリプト名を入力してください' };
      }
      updateData.name = input.name.trim();
    }

    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    if (Object.keys(updateData).length === 0) {
      return { error: '更新内容がありません' };
    }

    const script = await prisma.script.update({
      where: { id: scriptId },
      data: updateData,
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
      },
    });

    if (existingScript.itemId) {
      revalidatePath(`/${existingScript.itemId}/edit`);
      revalidatePath(`/${existingScript.itemId}`);
    } else {
      revalidatePath('/', 'layout');
    }
    return { success: true, script };
  } catch (error) {
    console.error('スクリプト更新エラー:', error);
    return { error: 'スクリプトの更新に失敗しました' };
  }
}
