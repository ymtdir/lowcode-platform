'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import type { ApiKeyInfo } from '../types';

/**
 * 現在のユーザーのAPIキー情報を取得する
 */
export async function getApiKey(): Promise<ApiKeyInfo | null> {
  const user = await requireAuth();

  const apiKey = await prisma.apiKey.findFirst({
    where: { userId: user.id },
    select: {
      key: true,
      createdAt: true,
    },
  });

  return apiKey;
}
