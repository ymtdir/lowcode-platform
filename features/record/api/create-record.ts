'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canAccessItem, hasPermission } from '@/lib/permissions';
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

  // DBからユーザー情報を取得
  const currentUser = await getCurrentUser();
  if (!currentUser) {
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

  // 権限チェック（WRITE権限が必要）
  const { canAccess, level } = await canAccessItem(
    tableId,
    currentUser.id,
    currentUser.role
  );

  if (!canAccess || !hasPermission(level, 'WRITE')) {
    return { error: 'レコードを作成する権限がありません' };
  }

  try {
    // dataをパース（PrismaのJson型に対応）
    const data: InputJsonValue = dataString ? JSON.parse(dataString) : {};

    const record = await prisma.record.create({
      data: {
        tableId,
        data,
        createdById: currentUser.id,
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
