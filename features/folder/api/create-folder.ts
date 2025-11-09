'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

type FormState = {
  error?: string;
  success?: boolean;
};

export async function createFolder(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = formData.get('name') as string;
  const parentId = formData.get('parentId') as string;
  const createdById = formData.get('createdById') as string;

  if (!name || name.trim() === '') {
    return { error: 'ワークスペース名を入力してください' };
  }

  if (!createdById) {
    return { error: 'ユーザー情報が取得できませんでした' };
  }

  // 名前に使用できない文字をチェック
  const invalidChars = /[\/\\:*?"<>|]/;
  if (invalidChars.test(name)) {
    return {
      error: '使用できない文字が含まれています（/ \\ : * ? " < > |）',
    };
  }

  try {
    // 同じ階層に同じ名前のフォルダが存在しないかチェック
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: name.trim(),
        parentId: parentId || null,
      },
    });

    if (existingFolder) {
      return { error: 'この名前のワークスペースは既に存在します' };
    }

    await prisma.folder.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        createdById,
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('ワークスペース作成エラー:', error);
    return { error: 'ワークスペースの作成に失敗しました' };
  }
}
