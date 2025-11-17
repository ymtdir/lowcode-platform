import type { Item as PrismaItem, User } from '@prisma/client';

export type Item = PrismaItem & {
  order: number;
  createdBy: Pick<User, 'id' | 'email' | 'name'>;
  children?: Item[];
  _count?: {
    children: number;
  };
};
