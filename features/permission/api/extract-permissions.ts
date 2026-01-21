import type { PermissionWithRelations } from '@/features/permission/types';
import type { getPermissions } from './get-permissions';

/**
 * getPermissionsの結果からpermissions配列を取り出すヘルパー
 * エラー時は空配列を返す
 */
export function extractPermissions(
  result: Awaited<ReturnType<typeof getPermissions>>
): PermissionWithRelations[] {
  return 'success' in result && result.success ? result.permissions : [];
}
