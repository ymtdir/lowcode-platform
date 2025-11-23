'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { InputJsonValue } from '@prisma/client/runtime/library';

/**
 * Server Actionのレスポンス型
 */
type UpdateRecordResult = {
  error?: string;
  success?: boolean;
};

/**
 * レコードを更新するServer Action
 */
export async function updateRecord(
  recordId: string,
  data: Record<string, unknown>
): Promise<UpdateRecordResult> {
  // セッションからユーザー情報を取得
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '認証が必要です' };
  }

  // レコードが存在するか確認
  const record = await prisma.record.findUnique({
    where: { id: recordId },
    include: { table: true },
  });

  if (!record) {
    return { error: 'レコードが見つかりません' };
  }

  try {
    // 既存のdataとマージ
    const existingData = (record.data as Record<string, unknown>) || {};
    const updatedData = {
      ...existingData,
      ...data,
    } as InputJsonValue;

    await prisma.record.update({
      where: { id: recordId },
      data: { data: updatedData },
    });

    revalidatePath(`/${record.tableId}`);
    return { success: true };
  } catch (error) {
    console.error('レコード更新エラー:', error);
    return { error: 'レコードの更新に失敗しました' };
  }
}
