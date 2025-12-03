import type { Permission } from '@prisma/client';

/**
 * 権限レベルごとの設定
 */
export type PermissionConfig = {
  label: string;
  description: string;
  color: string; // バッジやUIの色
};

/**
 * 権限レベルの設定（Config-Driven UI）
 */
export const PERMISSION_CONFIGS: Record<Permission, PermissionConfig> = {
  NONE: {
    label: 'なし',
    description: 'アクセス不可',
    color: 'gray',
  },
  READ: {
    label: '読取',
    description: '閲覧のみ可能',
    color: 'blue',
  },
  WRITE: {
    label: '編集',
    description: '閲覧・作成・編集が可能',
    color: 'green',
  },
  ADMIN: {
    label: '管理',
    description: 'すべての操作が可能（削除・権限設定含む）',
    color: 'purple',
  },
} as const;

/**
 * 権限レベルの配列（UI表示順）
 */
export const PERMISSION_LIST: Permission[] = [
  'READ',
  'WRITE',
  'ADMIN',
  'NONE',
] as const;

/**
 * 権限レベルの表示名を取得
 */
export function getPermissionLabel(level: Permission): string {
  return PERMISSION_CONFIGS[level].label;
}

/**
 * 権限レベルの説明を取得
 */
export function getPermissionDescription(level: Permission): string {
  return PERMISSION_CONFIGS[level].description;
}

/**
 * 権限レベルの色を取得
 */
export function getPermissionColor(level: Permission): string {
  return PERMISSION_CONFIGS[level].color;
}
