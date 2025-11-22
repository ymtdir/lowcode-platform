import type { Record as PrismaRecord } from '@prisma/client';

/**
 * レコードデータの型（カラムIDをキーとした値のマップ）
 */
export type RecordData = {
  [columnId: string]: unknown;
};

/**
 * レコード型（Prismaの型を拡張）
 */
export type Record = Omit<PrismaRecord, 'data'> & {
  data: RecordData;
};

/**
 * レコード作成時の入力型
 */
export type CreateRecordInput = {
  tableId: string;
  data: RecordData;
};

/**
 * レコード更新時の入力型
 */
export type UpdateRecordInput = {
  id: string;
  data: RecordData;
};
