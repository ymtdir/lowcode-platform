import type { UserRole, Permission } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * ロールの階層レベル
 * 数値が大きいほど上位の権限
 */
const ROLE_LEVELS: Record<UserRole, number> = {
  ADMIN: 3,
  DEVELOPER: 2,
  MEMBER: 1,
};

/**
 * 権限レベルの階層
 * 数値が大きいほど上位の権限
 */
const PERMISSION_LEVELS: Record<Permission, number> = {
  ADMIN: 4,
  WRITE: 3,
  READ: 2,
  NONE: 1,
};

/**
 * 指定されたロールが必要なロール以上の権限を持つかチェック
 * @param userRole - ユーザーのロール
 * @param requiredRole - 必要なロール
 * @returns 権限があればtrue
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

/**
 * ユーザー/グループ管理の権限があるかチェック
 * ADMINのみ
 */
export function canManageUsers(role: UserRole): boolean {
  return role === 'ADMIN';
}

/**
 * グループ管理の権限があるかチェック
 * ADMINのみ
 */
export function canManageGroups(role: UserRole): boolean {
  return role === 'ADMIN';
}

/**
 * テーブル/フォルダ構造を管理する権限があるかチェック
 * ADMIN, DEVELOPERのみ
 */
export function canManageStructure(role: UserRole): boolean {
  return hasRole(role, 'DEVELOPER');
}

/**
 * カラムを管理する権限があるかチェック
 * ADMIN, DEVELOPERのみ
 */
export function canManageColumns(role: UserRole): boolean {
  return hasRole(role, 'DEVELOPER');
}

/**
 * レコードを管理する権限があるかチェック
 * 全ロール可能
 */
export function canManageRecords(role: UserRole): boolean {
  return hasRole(role, 'MEMBER');
}

/**
 * 閲覧権限があるかチェック
 * 全ロール可能
 */
export function canView(role: UserRole): boolean {
  return hasRole(role, 'MEMBER');
}

/**
 * アイテムへのアクセス権限をチェック
 * @param itemId - アイテムID
 * @param userId - ユーザーID
 * @param userRole - ユーザーのロール
 * @returns アクセス権限の有無と権限レベル
 */
export async function canAccessItem(
  itemId: string,
  userId: string,
  userRole: UserRole
): Promise<{ canAccess: boolean; level: Permission }> {
  // 1. ADMIN roleは全アクセス可能
  if (userRole === 'ADMIN') {
    return { canAccess: true, level: 'ADMIN' };
  }

  // 2. ユーザー個別の権限をチェック
  const userPermission = await prisma.itemPermission.findUnique({
    where: {
      itemId_userId: {
        itemId,
        userId,
      },
    },
  });

  if (userPermission) {
    return {
      canAccess: userPermission.level !== 'NONE',
      level: userPermission.level,
    };
  }

  // 3. グループ権限をチェック（ユーザーが所属するすべてのグループ）
  const groupPermissions = await prisma.itemPermission.findMany({
    where: {
      itemId,
      group: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
  });

  if (groupPermissions.length > 0) {
    // 数値に変換して最大の権限レベルを取得
    const highestPermission = groupPermissions.reduce((max, current) => {
      return PERMISSION_LEVELS[current.level] > PERMISSION_LEVELS[max.level]
        ? current
        : max;
    });

    return {
      canAccess: highestPermission.level !== 'NONE',
      level: highestPermission.level,
    };
  }

  // 4. デフォルト: パブリックアクセス（READ権限）
  return { canAccess: true, level: 'READ' };
}

/**
 * アイテムの権限レベルを取得
 * @param itemId - アイテムID
 * @param userId - ユーザーID
 * @param userRole - ユーザーのロール
 * @returns 権限レベル
 */
export async function getItemPermissionLevel(
  itemId: string,
  userId: string,
  userRole: UserRole
): Promise<Permission> {
  const { level } = await canAccessItem(itemId, userId, userRole);
  return level;
}

/**
 * 指定された権限レベルがあるかチェック
 * @param currentLevel - 現在の権限レベル
 * @param requiredLevel - 必要な権限レベル
 * @returns 権限があればtrue
 */
export function hasPermission(
  currentLevel: Permission,
  requiredLevel: Permission
): boolean {
  return PERMISSION_LEVELS[currentLevel] >= PERMISSION_LEVELS[requiredLevel];
}
