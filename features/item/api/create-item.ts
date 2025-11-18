'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { ItemType } from '@prisma/client';

type FormState = {
  error?: string;
  success?: boolean;
};

export async function createItem(
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

  // DB からユーザー ID を取得
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    select: { id: true },
  });

  if (!dbUser) {
    return { error: 'ユーザー情報が取得できませんでした' };
  }

  const name = formData.get('name') as string;
  const parentId = formData.get('parentId') as string;
  const itemType = (formData.get('type') as ItemType) || 'FOLDER';

  if (!name || name.trim() === '') {
    return { error: 'アイテム名を入力してください' };
  }

  // 名前に使用できない文字をチェック
  const invalidChars = /[\/\\:*?"<>|]/;
  if (invalidChars.test(name)) {
    return {
      error: '使用できない文字が含まれています（/ \\ : * ? " < > |）',
    };
  }

  try {
    // 同じ親の最大order値を取得
    const maxOrderItem = await prisma.item.findFirst({
      where: {
        parentId: parentId || null,
      },
      orderBy: {
        order: 'desc',
      },
      select: {
        order: true,
      },
    });

    const newOrder = maxOrderItem ? maxOrderItem.order + 1 : 0;

    await prisma.item.create({
      data: {
        type: itemType,
        name: name.trim(),
        parentId: parentId || null,
        createdById: dbUser.id,
        order: newOrder,
        meta: null,
      },
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('アイテム作成エラー:', error);
    return { error: 'アイテムの作成に失敗しました' };
  }
}
