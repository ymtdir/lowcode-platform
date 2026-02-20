'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * 現在のユーザーのAPIキーを削除する
 */
export async function deleteApiKey(): Promise<void> {
  const user = await requireAuth();

  await prisma.apiKey.deleteMany({ where: { userId: user.id } });
}
