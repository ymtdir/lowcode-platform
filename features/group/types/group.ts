import type { Group as PrismaGroup, GroupMember, User } from '@prisma/client';

export type Group = PrismaGroup & {
  parent?: {
    name: string;
  } | null;
  members?: (GroupMember & {
    user: Pick<User, 'id' | 'email' | 'name'>;
  })[];
  _count?: {
    members: number;
  };
};
