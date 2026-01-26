'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageStructure } from '@/lib/permissions';
import * as LucideIcons from 'lucide-react';

type FormState = {
  error?: string;
  success?: boolean;
  iconName?: string | null;
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
  // ユーザー情報を取得
  const currentUser = await requireAuth().catch(() => null);

  if (!currentUser) {
    return { error: '認証が必要です' };
  }

  // 権限チェック
  if (!canManageStructure(currentUser.role)) {
    return { error: 'この操作を行う権限がありません' };
  }

  try {
    // アイコン名のバリデーション
    if (iconName !== null) {
      // IconPickerはケバブケース（kebab-case）で返すため、
      // パスカルケース（PascalCase）に変換
      // 例: "alarm-clock" -> "AlarmClock", "accessibility" -> "Accessibility"
      const pascalCaseIconName = iconName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

      const icon = LucideIcons[pascalCaseIconName as keyof typeof LucideIcons];
      const isValidIcon =
        pascalCaseIconName in LucideIcons &&
        icon &&
        (typeof icon === 'object' || typeof icon === 'function');

      if (!isValidIcon) {
        return { error: '無効なアイコン名です' };
      }

      // データベースにはパスカルケースの正しい名前で保存
      iconName = pascalCaseIconName;
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

    return { success: true, iconName };
  } catch (error) {
    console.error('アイコン更新エラー:', error);
    return { error: 'アイコンの更新に失敗しました' };
  }
}
