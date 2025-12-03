import type { Permission } from '@prisma/client';

/**
 * アイテム権限の型
 */
export type ItemPermission = {
  id: string;
  itemId: string;
  userId: string | null;
  groupId: string | null;
  level: Permission;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 権限追加の入力型
 */
export type AddPermissionInput = {
  itemId: string;
  userId?: string;
  groupId?: string;
  level: Permission;
};

/**
 * 権限更新の入力型
 */
export type UpdatePermissionInput = {
  permissionId: string;
  level: Permission;
};
