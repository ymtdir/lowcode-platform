'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canAccessItem, hasPermission } from '@/lib/permissions';

/**
 * レコード削除結果の型
 */
export type DeleteRecordResult = {
  error?: string;
  success?: boolean;
};

/**
 * レコードを削除するServer Action
 */
export async function deleteRecord(
  recordId: string
): Promise<DeleteRecordResult> {
  // ユーザー情報を取得
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: '認証が必要です' };
  }

  // レコードが存在するか確認
  const record = await prisma.record.findUnique({
    where: { id: recordId },
    select: { tableId: true },
  });

  if (!record) {
    return { error: 'レコードが見つかりません' };
  }

  // 権限チェック（WRITE権限が必要）
  const { canAccess, level } = await canAccessItem(
    record.tableId,
    currentUser.id,
    currentUser.role
  );

  if (!canAccess || !hasPermission(level, 'WRITE')) {
    return { error: 'レコードを削除する権限がありません' };
  }

  try {
    // レコードを削除
    await prisma.record.delete({
      where: { id: recordId },
    });

    revalidatePath(`/${record.tableId}`);
    return { success: true };
  } catch (error) {
    console.error('レコード削除エラー:', error);
    return { error: 'レコードの削除に失敗しました' };
  }
}
