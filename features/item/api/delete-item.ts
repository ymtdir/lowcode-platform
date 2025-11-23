'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * アイテム削除結果の型
 */
export type DeleteItemResult = {
  error?: string;
  success?: boolean;
};

/**
 * アイテムを削除するServer Action
 */
export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  try {
    // アイテムを削除（Cascadeで子アイテムも削除される）
    await prisma.item.delete({
      where: { id: itemId },
    });

    // キャッシュを再検証
    revalidatePath('/');
    revalidatePath('/workspace');

    return {
      success: true,
    };
  } catch (error) {
    console.error('アイテム削除エラー:', error);
    return { error: 'アイテムの削除に失敗しました' };
  }
}
