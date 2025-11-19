'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { UpdateColumnInput } from '../types/column';
import { getColumnSchema, createTableMeta } from '../types/schema';
import {
  updateColumnInSchema,
  hasColumnWithName,
} from '../utils/schema-operations';

type FormState = {
  error?: string;
  success?: boolean;
};

/**
 * カラムを更新するServer Action
 */
export async function updateColumn(
  itemId: string,
  columnId: string,
  input: UpdateColumnInput
): Promise<FormState> {
  // セッションからユーザー情報を取得
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '認証が必要です' };
  }

  // DB からユーザー ID を取得
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    select: { id: true, role: true },
  });

  if (!dbUser) {
    return { error: 'ユーザー情報が取得できませんでした' };
  }

  // バリデーション
  if (input.name !== undefined && input.name.trim() === '') {
    return { error: 'カラム名を入力してください' };
  }

  try {
    // Itemを取得
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return { error: 'テーブルが見つかりません' };
    }

    if (item.type !== 'TABLE') {
      return { error: 'テーブルではありません' };
    }

    // TODO: 権限チェック（将来実装）
    if (item.createdById !== dbUser.id && dbUser.role !== 'ADMIN') {
      return { error: 'カラムを更新する権限がありません' };
    }

    // 現在のスキーマを取得
    const schema = getColumnSchema(item.meta);

    if (!schema) {
      return { error: 'スキーマが見つかりません' };
    }

    // カラム名を変更する場合、重複チェック
    if (input.name !== undefined) {
      if (hasColumnWithName(schema, input.name.trim(), columnId)) {
        return { error: '同じ名前のカラムが既に存在します' };
      }
    }

    // カラムを更新
    const updatedInput = {
      ...input,
      ...(input.name !== undefined && { name: input.name.trim() }),
    };

    const newSchema = updateColumnInSchema(schema, columnId, updatedInput);

    // TableMetaを更新
    const newTableMeta = createTableMeta(newSchema);

    // DBを更新
    await prisma.item.update({
      where: { id: itemId },
      data: {
        meta: newTableMeta as never,
      },
    });

    revalidatePath(`/tables/${itemId}`);
    return { success: true };
  } catch (error) {
    console.error('カラム更新エラー:', error);

    // カラムが見つからない場合
    if (error instanceof Error && error.message.includes('not found')) {
      return { error: 'カラムが見つかりません' };
    }

    return { error: 'カラムの更新に失敗しました' };
  }
}
