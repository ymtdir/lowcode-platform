'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import type { ApiKeyInfo } from '../types';

/**
 * 現在のユーザーのAPIキー情報を取得する
 *
 * ハッシュ化済みのため平文キーは返却できない。prefixのみ表示用に返す。
 */
export async function getApiKey(): Promise<ApiKeyInfo | null> {
  const user = await requireAuth();

  const apiKey = await prisma.apiKey.findFirst({
    where: { userId: user.id },
    select: {
      prefix: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  if (!apiKey) return null;

  return {
    prefix: apiKey.prefix,
    plainTextKey: null,
    lastUsedAt: apiKey.lastUsedAt,
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
  };
}
