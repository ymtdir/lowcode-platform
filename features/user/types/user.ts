import type { User as PrismaUser, GroupMember } from '@prisma/client';

export type User = PrismaUser & {
  groupMembers?: GroupMember[];
  _count?: {
    groupMembers: number;
  };
};
