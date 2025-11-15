'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function deleteFolder(folderId: string) {
  try {
    // フォルダを削除（Cascadeで子フォルダも削除される）
    await prisma.folder.delete({
      where: { id: folderId },
    });

    // キャッシュを再検証
    revalidatePath('/');
    revalidatePath('/workspace');

    return {
      success: true,
    };
  } catch (error) {
    console.error('フォルダ削除エラー:', error);
    return {
      success: false,
      error: 'フォルダの削除に失敗しました',
    };
  }
}
