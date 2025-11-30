import type { UserRole } from '@prisma/client';

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
