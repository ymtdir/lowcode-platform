'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getPermissions,
  addPermission,
  updatePermission,
  removePermission,
} from '@/features/permission/api';
import {
  PERMISSION_LIST,
  getPermissionLabel,
} from '@/features/permission/constants';
import { AddPermissionDialog } from '@/features/permission/components/add-permission-dialog';
import { DeletePermissionButton } from '@/features/permission/components/delete-permission-button';
import { getUsers } from '@/features/user/api';
import { getGroups } from '@/features/group/api';
import type { Permission } from '@prisma/client';

/**
 * AccessContentのProps型
 */
type AccessContentProps = {
  itemId: string;
};

/**
 * 権限情報の型
 */
type PermissionInfo = {
  id: string;
  itemId: string;
  userId: string | null;
  groupId: string | null;
  level: Permission;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  group?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
};

/**
 * アクセス権限タブのコンテンツコンポーネント
 */
export function AccessContent({ itemId }: AccessContentProps) {
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<
    Array<{ id: string; name: string | null; email: string }>
  >([]);
  const [groups, setGroups] = useState<
    Array<{ id: string; name: string; description: string | null }>
  >([]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);

      // 並列で取得
      const [permissionsResult, usersData, groupsData] = await Promise.all([
        getPermissions(itemId),
        getUsers(),
        getGroups(),
      ]);

      if (isMounted) {
        // 権限一覧をセット
        if ('success' in permissionsResult && permissionsResult.success) {
          setPermissions(permissionsResult.permissions as PermissionInfo[]);
        }

        // ユーザー一覧をセット（簡略化された型に変換）
        setUsers(
          usersData.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
          }))
        );

        // グループ一覧をセット（簡略化された型に変換）
        setGroups(
          groupsData.map((group) => ({
            id: group.id,
            name: group.name,
            description: group.description,
          }))
        );

        setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [itemId]);

  // 権限追加
  const handleAdd = async (
    targetType: 'group' | 'user',
    targetId: string,
    level: Permission
  ) => {
    const result = await addPermission(itemId, targetType, targetId, level);
    if ('success' in result && result.success) {
      // 成功時は権限一覧を再取得してUIを更新
      const permissionsResult = await getPermissions(itemId);
      if ('success' in permissionsResult && permissionsResult.success) {
        setPermissions(permissionsResult.permissions as PermissionInfo[]);
      }
    } else if ('error' in result) {
      alert(result.error || '権限の追加に失敗しました');
      throw new Error(result.error);
    }
  };

  // 権限更新
  const handleUpdate = async (permissionId: string, level: Permission) => {
    // 楽観的更新：先にUIを更新
    const previousPermissions = permissions;
    setPermissions((prev) =>
      prev.map((p) => (p.id === permissionId ? { ...p, level } : p))
    );

    // サーバーに保存
    const result = await updatePermission(permissionId, level);
    if ('error' in result) {
      // エラー時はロールバック
      alert(result.error || '権限の更新に失敗しました');
      setPermissions(previousPermissions);
    }
  };

  // 権限削除
  const handleDelete = async (permissionId: string) => {
    // 楽観的更新：先にUIから削除
    const previousPermissions = permissions;
    setPermissions((prev) => prev.filter((p) => p.id !== permissionId));

    // サーバーで削除
    const result = await removePermission(permissionId);
    if ('error' in result) {
      // エラー時はロールバック
      alert(result.error || '削除に失敗しました');
      setPermissions(previousPermissions);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">アクセス権限</h2>
        <p className="text-sm text-muted-foreground mb-4">
          このアイテムにアクセスできるユーザーとグループを管理します。
          <br />
          権限が設定されていない場合、すべてのユーザーがREAD権限でアクセスできます（パブリック）。
        </p>
      </div>

      {/* 権限追加ダイアログ */}
      <div className="flex justify-end">
        <AddPermissionDialog users={users} groups={groups} onAdd={handleAdd} />
      </div>

      {/* 権限一覧 */}
      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : permissions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            権限が設定されていません。
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            すべてのユーザーがREAD権限でアクセスできます。
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>種別</TableHead>
                <TableHead>名前</TableHead>
                <TableHead>権限レベル</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>
                    {permission.userId ? 'ユーザー' : 'グループ'}
                  </TableCell>
                  <TableCell>
                    {permission.user
                      ? permission.user.name || permission.user.email
                      : permission.group?.name}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={permission.level}
                      onValueChange={(value) =>
                        handleUpdate(permission.id, value as Permission)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERMISSION_LIST.map((level) => (
                          <SelectItem key={level} value={level}>
                            {getPermissionLabel(level)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <DeletePermissionButton
                      permissionId={permission.id}
                      targetName={
                        permission.user
                          ? permission.user.name || permission.user.email
                          : permission.group?.name || ''
                      }
                      onDelete={handleDelete}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
