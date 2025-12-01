'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageGroups } from '@/lib/permissions';

/**
 * 循環参照をチェックするヘルパー関数
 */
async function checkCircularReference(groupId: string, newParentId: string) {
  const visited = new Set<string>();
  let currentId = newParentId;

  while (currentId) {
    // 訪問済みのノードに到達した場合は循環参照
    if (visited.has(currentId)) {
      return true;
    }

    // 自分自身に到達した場合は循環参照
    if (currentId === groupId) {
      return true;
    }

    // 訪問済みとしてマーク
    visited.add(currentId);

    // 次の親を取得
    const parent = await prisma.group.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    // 親が存在しない場合はルートに到達（循環なし）
    if (!parent || !parent.parentId) {
      return false;
    }

    currentId = parent.parentId;
  }

  return false;
}

/**
 * グループを更新するServer Action
 * ADMINロールのみ実行可能
 */
export async function updateGroup(
  groupId: string,
  _prevState: unknown,
  formData: FormData
) {
  // 認証チェック
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '認証が必要です' };
  }

  // 権限チェック
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email! },
    select: { role: true },
  });

  if (!currentUser || !canManageGroups(currentUser.role)) {
    return { error: 'この操作を行う権限がありません' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const parentId = formData.get('parentId') as string;

  if (!name || name.trim() === '') {
    return { error: 'グループ名を入力してください' };
  }

  // 自分自身を親として設定しようとしている場合はエラー
  if (parentId && parentId === groupId) {
    return { error: '自分自身を親グループとして設定することはできません' };
  }

  // 循環参照チェック
  if (parentId) {
    const hasCircularReference = await checkCircularReference(
      groupId,
      parentId
    );
    if (hasCircularReference) {
      return {
        error: '子グループを親として設定することはできません',
      };
    }
  }

  try {
    await prisma.group.update({
      where: { id: groupId },
      data: {
        name: name.trim(),
        description: description.trim() || null,
        parentId: parentId || null,
      },
    });

    revalidatePath('/groups');
    return { success: true };
  } catch (error) {
    console.error('グループ更新エラー:', error);
    return { error: 'グループの更新に失敗しました' };
  }
}
