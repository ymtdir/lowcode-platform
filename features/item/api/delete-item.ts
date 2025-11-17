'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function deleteItem(itemId: string) {
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
    return {
      success: false,
      error: 'アイテムの削除に失敗しました',
    };
  }
}
