import type { Script as PrismaScript } from '@prisma/client';

/**
 * スクリプトの型
 */
export type Script = Pick<PrismaScript, 'id' | 'name' | 'content' | 'order'>;

/**
 * スクリプト作成時の入力型
 */
export type CreateScriptInput = {
  name: string;
  content?: string;
};

/**
 * スクリプト更新時の入力型
 */
export type UpdateScriptInput = {
  name?: string;
  content?: string;
};
