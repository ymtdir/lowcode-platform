'use server';

import { revalidatePath } from 'next/cache';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageGroups } from '@/lib/permissions';

type FormState = {
  error?: string;
  success?: boolean;
};

/**
 * グループを作成するServer Action
 * ADMINロールのみ実行可能
 */
export async function createGroup(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // ユーザー情報を取得
  const currentUser = await requireAuth().catch(() => null);

  if (!currentUser) {
    return { error: '認証が必要です' };
  }
  // 権限チェック
  if (!canManageGroups(currentUser.role)) {
    return { error: 'この操作を行う権限がありません' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const parentId = formData.get('parentId') as string;

  if (!name || name.trim() === '') {
    return { error: 'グループ名を入力してください' };
  }

  try {
    await prisma.group.create({
      data: {
        name: name.trim(),
        description: description.trim() || null,
        parentId: parentId || null,
      },
    });

    revalidatePath('/groups');
    return { success: true };
  } catch (error) {
    console.error('グループ作成エラー:', error);
    return { error: 'グループの作成に失敗しました' };
  }
}
