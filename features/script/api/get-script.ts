'use server';

import { prisma } from '@/lib/prisma';
import type { Script } from '../types';

/**
 * カスタムスクリプトを取得するServer Action
 */
export async function getScript(): Promise<Script> {
  const setting = await prisma.setting.findUnique({
    where: { id: 'singleton' },
    select: { customScript: true },
  });

  return {
    content: setting?.customScript ?? '',
  };
}
