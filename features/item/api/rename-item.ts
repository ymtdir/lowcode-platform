'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageStructure } from '@/lib/permissions';

/**
 * アイテム名を変更するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 */
export async function renameItem(itemId: string, newName: string) {
  // ユーザー情報を取得
  const currentUser = await requireAuth().catch(() => null);

  if (!currentUser) {
    return { error: '認証が必要です' };
  }

  // 権限チェック
  if (!canManageStructure(currentUser.role)) {
    return { error: 'この操作を行う権限がありません' };
  }

  try {
    // 名前のバリデーション
    if (!newName || newName.trim() === '') {
      return {
        error: 'アイテム名を入力してください',
      };
    }

    // 使用できない文字をチェック
    const invalidChars = /[\/\\:*?"<>|]/;
    if (invalidChars.test(newName)) {
      return {
        error: '使用できない文字が含まれています（/ \\ : * ? " < > |）',
      };
    }

    // 対象アイテムを取得
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { parentId: true },
    });

    if (!item) {
      return {
        error: 'アイテムが見つかりません',
      };
    }

    // アイテム名を更新
    await prisma.item.update({
      where: { id: itemId },
      data: { name: newName.trim() },
    });

    // キャッシュを再検証
    revalidatePath('/');
    revalidatePath('/workspace');

    return { success: true };
  } catch (error) {
    console.error('アイテム名変更エラー:', error);
    return {
      error: 'アイテム名の変更に失敗しました',
    };
  }
}
