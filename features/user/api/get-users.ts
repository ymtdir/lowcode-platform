'use server';

import { prisma } from '@/lib/prisma';
import type { User } from '../types';

/**
 * すべてのユーザーを取得するServer Action
 */
export async function getUsers(): Promise<User[]> {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users;
}
