'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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
  // セッションからユーザー情報を取得
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '認証が必要です' };
  }

  try {
    // レコードを削除し、tableIdを取得
    const record = await prisma.record.delete({
      where: { id: recordId },
      select: { tableId: true },
    });

    revalidatePath(`/${record.tableId}`);
    return { success: true };
  } catch (error) {
    console.error('レコード削除エラー:', error);
    return { error: 'レコードの削除に失敗しました' };
  }
}
