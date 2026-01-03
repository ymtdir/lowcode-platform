'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageStructure } from '@/lib/permissions';
import * as LucideIcons from 'lucide-react';

type FormState = {
  error?: string;
  success?: boolean;
};

/**
 * アイテムのアイコンを更新するServer Action
 * ADMIN/DEVELOPERロールのみ実行可能
 *
 * @param itemId - 更新対象のアイテムID
 * @param iconName - Lucideアイコン名（nullの場合はデフォルトに戻す）
 * @returns 成功/エラー情報
 */
export async function updateItemIcon(
  itemId: string,
  iconName: string | null
): Promise<FormState> {
  try {
    // 認証チェック
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: '認証が必要です' };
    }

    // 権限チェック
    const currentUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { role: true },
    });

    if (!currentUser || !canManageStructure(currentUser.role)) {
      return { error: 'この操作を行う権限がありません' };
    }

    // アイコン名のバリデーション
    if (iconName !== null) {
      const icon = LucideIcons[iconName as keyof typeof LucideIcons];
      const isValidIcon =
        iconName in LucideIcons &&
        icon &&
        (typeof icon === 'object' || typeof icon === 'function');

      if (!isValidIcon) {
        return { error: '無効なアイコン名です' };
      }
    }

    // 対象アイテムを確認
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true },
    });

    if (!item) {
      return { error: 'アイテムが見つかりません' };
    }

    // アイコンを更新
    await prisma.item.update({
      where: { id: itemId },
      data: { icon: iconName },
    });

    // キャッシュを再検証
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    console.error('アイコン更新エラー:', error);
    return { error: 'アイコンの更新に失敗しました' };
  }
}
