'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

type DeleteResult = {
  error?: string;
  success?: boolean;
};

export async function deleteGroup(groupId: string): Promise<DeleteResult> {
  try {
    // 子グループが存在するか確認
    const childGroups = await prisma.group.findMany({
      where: { parentId: groupId },
    });

    if (childGroups.length > 0) {
      return {
        error:
          '子グループが存在するため削除できません。<br>先に子グループを削除してください。',
      };
    }

    // グループを削除
    await prisma.group.delete({
      where: { id: groupId },
    });

    revalidatePath('/groups');
    return { success: true };
  } catch (error) {
    console.error('グループ削除エラー:', error);
    return { error: 'グループの削除に失敗しました' };
  }
}
