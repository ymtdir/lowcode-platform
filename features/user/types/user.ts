import type { User as PrismaUser, GroupMember } from '@prisma/client';

/**
 * ユーザー型（PrismaUserを拡張）
 */
export type User = PrismaUser & {
  groupMembers?: GroupMember[];
  _count?: {
    groupMembers: number;
  };
};
