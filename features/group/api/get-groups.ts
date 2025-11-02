'use server';

import { prisma } from '@/lib/prisma';
import type { Group } from '../types';

export async function getGroups(): Promise<Group[]> {
  const groups = await prisma.group.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return groups;
}
