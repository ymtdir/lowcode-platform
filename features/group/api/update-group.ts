'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

type FormState = {
  error?: string;
  success?: boolean;
};

export async function updateGroup(
  groupId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
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
