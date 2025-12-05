import type { Prisma } from '@prisma/client';

/**
 * Itemのクエリペイロード型（get-items.tsのクエリ構造に対応）
 */
type ItemPayload = Prisma.ItemGetPayload<{
  include: {
    children: true;
    _count: {
      select: {
        children: true;
      };
    };
  };
}>;

/**
 * 基本型（共通プロパティ）
 */
type BaseItem = Omit<ItemPayload, 'type' | 'meta' | 'children'>;

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
