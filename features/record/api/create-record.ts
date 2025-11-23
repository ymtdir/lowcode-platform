'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import type { Record as RecordType } from '../types';

/**
 * Server Actionのレスポンス型
 */
type FormState = {
  error?: string;
  success?: boolean;
  record?: RecordType;
};

/**
 * レコードを作成するServer Action
 */
export async function createRecord(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // セッションからユーザー情報を取得
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '認証が必要です' };
  }

  // DBからユーザーIDを取得
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    select: { id: true },
  });

  if (!dbUser) {
    return { error: 'ユーザー情報が取得できませんでした' };
  }

  const tableId = formData.get('tableId') as string;
  const dataString = formData.get('data') as string;

  if (!tableId) {
    return { error: 'テーブルIDが必要です' };
  }

  // テーブルが存在するか確認
  const table = await prisma.item.findUnique({
    where: { id: tableId, type: 'TABLE' },
  });

  if (!table) {
    return { error: 'テーブルが見つかりません' };
  }

  try {
    // dataをパース（PrismaのJson型に対応）
    const data: InputJsonValue = dataString ? JSON.parse(dataString) : {};

    const record = await prisma.record.create({
      data: {
        tableId,
        data,
        createdById: dbUser.id,
      },
    });

    revalidatePath(`/${tableId}`);
    return {
      success: true,
      record: {
        ...record,
        data: record.data as Record<string, unknown>,
      },
    };
  } catch (error) {
    console.error('レコード作成エラー:', error);
    return { error: 'レコードの作成に失敗しました' };
  }
}
