'use server';

import { prisma } from '@/lib/prisma';
import type { Style } from '../types';

/**
 * 指定したItemのスタイル一覧を取得
 * itemId が null の場合はグローバルスタイルを取得
 */
export async function getStyles(
  itemId: string | null
): Promise<{ success: true; styles: Style[] } | { error: string; styles: [] }> {
  try {
    const styles = await prisma.style.findMany({
      where: { itemId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
      },
    });

    return { success: true, styles };
  } catch (error) {
    console.error('スタイルの取得に失敗しました:', error);
    return { error: 'スタイルの取得に失敗しました', styles: [] };
  }
}
