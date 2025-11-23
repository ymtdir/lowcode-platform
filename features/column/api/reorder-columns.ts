'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getColumnSchema, createTableMeta } from '../types/schema';
import type { Column } from '../types/column';

type FormState = {
  error?: string;
  success?: boolean;
};

/**
 * カラムの順序を一括更新するServer Action
 * @param itemId テーブルID
 * @param orderedColumnIds 並び替え後のカラムIDの配列
 */
export async function reorderColumns(
  itemId: string,
  orderedColumnIds: string[]
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
      return { error: 'カラムを並び替える権限がありません' };
    }

    // 現在のスキーマを取得
    const schema = getColumnSchema(item.meta);

    if (!schema) {
      return { error: 'スキーマが見つかりません' };
    }

    // カラムをIDでマップ化
    const columnMap = new Map<string, Column>();
    for (const column of schema.columns) {
      columnMap.set(column.id, column);
    }

    // 新しい順序でカラムを並び替え
    const reorderedColumns: Column[] = [];
    for (let i = 0; i < orderedColumnIds.length; i++) {
      const column = columnMap.get(orderedColumnIds[i]);
      if (column) {
        reorderedColumns.push({
          ...column,
          order: i,
        });
      }
    }

    // 新しいスキーマを作成
    const newSchema = {
      ...schema,
      columns: reorderedColumns,
    };

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
    console.error('カラム並び替えエラー:', error);
    return { error: 'カラムの並び替えに失敗しました' };
  }
}
