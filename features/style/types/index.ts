import type { Style as PrismaStyle } from '@prisma/client';

/**
 * スタイルの型
 */
export type Style = Pick<PrismaStyle, 'id' | 'name' | 'content' | 'order'>;

/**
 * スタイル作成時の入力型
 */
export type CreateStyleInput = {
  name: string;
  content?: string;
};

/**
 * スタイル更新時の入力型
 */
export type UpdateStyleInput = {
  name?: string;
  content?: string;
};
