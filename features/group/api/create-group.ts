'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

type FormState = {
  error?: string;
  success?: boolean;
};

export async function createGroup(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
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
