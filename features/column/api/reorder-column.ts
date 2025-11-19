'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getColumnSchema, createTableMeta } from '../types/schema';
import { reorderColumnInSchema } from '../utils/schema-operations';

type FormState = {
  error?: string;
  success?: boolean;
};

/**
 * カラムを並び替えるServer Action
 */
export async function reorderColumn(
  itemId: string,
  columnId: string,
  newOrder: number
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
  if (newOrder < 0) {
    return { error: '並び順は0以上である必要があります' };
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

    // カラムを並び替え
    const newSchema = reorderColumnInSchema(schema, columnId, newOrder);

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

    // エラーメッセージを解析
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return { error: 'カラムが見つかりません' };
      }
      if (error.message.includes('Invalid order')) {
        return { error: '無効な並び順です' };
      }
    }

    return { error: 'カラムの並び替えに失敗しました' };
  }
}
