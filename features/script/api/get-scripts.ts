'use server';

import { prisma } from '@/lib/prisma';
import type { Script } from '../types';

/**
 * 指定したItemのスクリプト一覧を取得
 * itemId が null の場合はグローバルスクリプトを取得
 */
export async function getScripts(
  itemId: string | null
): Promise<{ success: true; scripts: Script[] } | { error: string; scripts: [] }> {
  try {
    const scripts = await prisma.script.findMany({
      where: { itemId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
      },
    });

    return { success: true, scripts };
  } catch (error) {
    console.error('スクリプトの取得に失敗しました:', error);
    return { error: 'スクリプトの取得に失敗しました', scripts: [] };
  }
}
