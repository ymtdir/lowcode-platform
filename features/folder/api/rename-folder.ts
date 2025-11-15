'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function renameFolder(folderId: string, newName: string) {
  try {
    // 名前のバリデーション
    if (!newName || newName.trim() === '') {
      return {
        error: 'フォルダ名を入力してください',
      };
    }

    // 使用できない文字をチェック
    const invalidChars = /[\/\\:*?"<>|]/;
    if (invalidChars.test(newName)) {
      return {
        error: '使用できない文字が含まれています（/ \\ : * ? " < > |）',
      };
    }

    // 対象フォルダを取得
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { parentId: true },
    });

    if (!folder) {
      return {
        error: 'フォルダが見つかりません',
      };
    }

    // 同じ階層に同じ名前のフォルダが存在しないかチェック
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: newName.trim(),
        parentId: folder.parentId,
        id: { not: folderId }, // 自分自身は除外
      },
    });

    if (existingFolder) {
      return {
        error: 'この名前のフォルダは既に存在します',
      };
    }

    // フォルダ名を更新
    await prisma.folder.update({
      where: { id: folderId },
      data: { name: newName.trim() },
    });

    // キャッシュを再検証
    revalidatePath('/');
    revalidatePath('/workspace');

    return { success: true };
  } catch (error) {
    console.error('フォルダ名変更エラー:', error);
    return {
      error: 'フォルダ名の変更に失敗しました',
    };
  }
}
