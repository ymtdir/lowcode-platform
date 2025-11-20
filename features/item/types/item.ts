import type { Item as PrismaItem, User } from '@prisma/client';

/**
 * 基本型（共通プロパティ）
 */
type BaseItem = Omit<PrismaItem, 'type' | 'meta'> & {
  order: number;
  createdBy: Pick<User, 'id' | 'email' | 'name'>;
  _count?: {
    children: number;
  };
};

/**
 * Folder専用型
 */
export type FolderItem = BaseItem & {
  type: 'FOLDER';
  meta: null;
  children?: Item[];
};

/**
 * Table専用型
 */
export type TableItem = BaseItem & {
  type: 'TABLE';
  meta: {
    description?: string;
  } | null;
  children?: never; // Tableは子要素を持たない
};

/**
 * Discriminated Union（Item型）
 */
export type Item = FolderItem | TableItem;
