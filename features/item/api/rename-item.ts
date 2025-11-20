'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * アイテム名を変更するServer Action
 */
export async function renameItem(itemId: string, newName: string) {
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
