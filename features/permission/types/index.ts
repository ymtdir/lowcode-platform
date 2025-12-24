import type { Permission, Prisma } from '@prisma/client';

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
 * 権限情報の型（userとgroupをincludeした状態）
 */
export type PermissionWithRelations = Prisma.ItemPermissionGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    group: {
      select: {
        id: true;
        name: true;
        description: true;
      };
    };
  };
}>;

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
