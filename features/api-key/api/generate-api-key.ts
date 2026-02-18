'use server';

import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hashApiKey } from '@/lib/api-auth';
import type { ApiKeyInfo } from '../types';

/**
 * APIキーを生成（または再生成）する
 *
 * 既存のキーがある場合は削除してから新しいキーを生成する。
 * 平文キーは生成時のみ返却され、以降はハッシュから復元できない。
 */
export async function generateApiKey(): Promise<ApiKeyInfo> {
  const user = await requireAuth();

  const rawKey = `mk_${randomBytes(32).toString('hex')}`;
  const prefix = rawKey.slice(0, 8);
  const hashedKey = hashApiKey(rawKey);

  // 既存キーを削除してから新規作成
  const [, apiKey] = await prisma.$transaction([
    prisma.apiKey.deleteMany({ where: { userId: user.id } }),
    prisma.apiKey.create({
      data: {
        name: 'default',
        key: hashedKey,
        prefix,
        userId: user.id,
      },
    }),
  ]);

  return {
    prefix: apiKey.prefix,
    plainTextKey: rawKey,
    lastUsedAt: null,
    expiresAt: null,
    createdAt: apiKey.createdAt,
  };
}
