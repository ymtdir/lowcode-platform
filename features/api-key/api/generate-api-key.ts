'use server';

import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import type { ApiKeyInfo } from '../types';

/**
 * APIキーを生成（または再生成）する
 *
 * 既存のキーがある場合は削除してから新しいキーを生成する。
 */
export async function generateApiKey(): Promise<ApiKeyInfo> {
  const user = await requireAuth();

  const key = `mk_${randomBytes(32).toString('hex')}`;

  // 既存キーを削除してから新規作成
  const [, apiKey] = await prisma.$transaction([
    prisma.apiKey.deleteMany({ where: { userId: user.id } }),
    prisma.apiKey.create({
      data: {
        name: 'default',
        key,
        userId: user.id,
      },
    }),
  ]);

  return { key: apiKey.key, createdAt: apiKey.createdAt };
}
