import type { Folder as PrismaFolder, User } from '@prisma/client';

export type Folder = PrismaFolder & {
  order: number;
  createdBy: Pick<User, 'id' | 'email' | 'name'>;
  children?: Folder[];
  _count?: {
    children: number;
  };
};
