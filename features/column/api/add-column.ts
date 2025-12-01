'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageColumns } from '@/lib/permissions';
import type { Column, CreateColumnInput } from '../types/column';
import { createTableMeta, getColumnSchema } from '../types/schema';
import {
  addColumnToSchema,
  hasColumnWithName,
} from '../utils/schema-operations';

type FormState = {
  error?: string;
  success?: boolean;
  column?: Column;
};

/**
 * カラムを追加するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 */
export async function addColumn(
  itemId: string,
  input: CreateColumnInput
): Promise<FormState> {
  // セッションからユーザー情報を取得
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '認証が必要です' };
  }

  // DB からユーザー情報を取得
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    select: { id: true, role: true },
  });

  if (!dbUser) {
    return { error: 'ユーザー情報が取得できませんでした' };
  }

  // 権限チェック
  if (!canManageColumns(dbUser.role)) {
    return { error: 'この操作を行う権限がありません' };
  }

  // バリデーション
  if (!input.name || input.name.trim() === '') {
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

    // 現在のスキーマを取得
    let schema = getColumnSchema(item.meta);

    // スキーマが存在しない場合は新規作成
    if (!schema) {
      const tableMeta = createTableMeta();
      schema = tableMeta.schema;
    }

    // カラム名の重複チェック
    if (hasColumnWithName(schema, input.name.trim())) {
      return { error: '同じ名前のカラムが既に存在します' };
    }

    // カラムを追加
    const newSchema = addColumnToSchema(schema, {
      ...input,
      name: input.name.trim(),
    });

    // TableMetaを更新
    const newTableMeta = createTableMeta(newSchema);

    // DBを更新
    await prisma.item.update({
      where: { id: itemId },
      data: {
        meta: newTableMeta as never,
      },
    });

    // 追加されたカラムを取得（最後に追加されたもの）
    const addedColumn = newSchema.columns[newSchema.columns.length - 1];

    revalidatePath(`/${itemId}`);
    return { success: true, column: addedColumn };
  } catch (error) {
    console.error('カラム追加エラー:', error);
    return { error: 'カラムの追加に失敗しました' };
  }
}
