'use client';

import { useState, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
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
import { AddPermissionButton } from '@/features/permission/components/add-permission-button';
import { DeletePermissionButton } from '@/features/permission/components/delete-permission-button';
import type { Permission } from '@prisma/client';
import type { User } from '@/features/user/types';
import type { Group } from '@/features/group/types';
import type { PermissionWithRelations } from '@/features/permission/types';

/**
 * AccessContentのProps型
 */
type AccessContentProps = {
  itemId: string;
  initialPermissions: PermissionWithRelations[];
  users: User[];
  groups: Group[];
};

/**
 * アクセス権限タブのコンテンツコンポーネント
 */
export function AccessContent({
  itemId,
  initialPermissions,
  users,
  groups,
}: AccessContentProps) {
  const [permissions, setPermissions] =
    useState<PermissionWithRelations[]>(initialPermissions);
  const [pendingChanges, setPendingChanges] = useState<{
    updates: Map<string, Permission>;
    deletes: Set<string>;
  }>({
    updates: new Map(),
    deletes: new Set(),
  });
  const [isSaving, setIsSaving] = useState(false);

  // 変更があるかどうかを判定
  const hasChanges = useMemo(() => {
    return pendingChanges.updates.size > 0 || pendingChanges.deletes.size > 0;
  }, [pendingChanges]);

  // 権限追加（即座に保存）
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
        setPermissions(permissionsResult.permissions);
        // 保留中の変更をクリア
        setPendingChanges({ updates: new Map(), deletes: new Set() });
      }
    } else if ('error' in result) {
      alert(result.error || '権限の追加に失敗しました');
      throw new Error(result.error);
    }
  };

  // 権限更新（保留）
  const handleUpdate = (permissionId: string, level: Permission) => {
    // UIを即座に更新
    setPermissions((prev) =>
      prev.map((p) => (p.id === permissionId ? { ...p, level } : p))
    );

    // 更新を保留リストに追加
    setPendingChanges((prev) => {
      const newUpdates = new Map(prev.updates);
      newUpdates.set(permissionId, level);
      return { ...prev, updates: newUpdates };
    });
  };

  // 権限削除（保留）
  const handleDelete = (permissionId: string) => {
    // UIから即座に削除
    setPermissions((prev) => prev.filter((p) => p.id !== permissionId));

    // 削除を保留リストに追加
    setPendingChanges((prev) => {
      const newDeletes = new Set(prev.deletes);
      newDeletes.add(permissionId);
      // 更新リストからも削除（削除する権限の更新は不要）
      const newUpdates = new Map(prev.updates);
      newUpdates.delete(permissionId);
      return { updates: newUpdates, deletes: newDeletes };
    });
  };

  // 保存
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 更新を実行
      for (const [permissionId, level] of pendingChanges.updates) {
        const result = await updatePermission(permissionId, level);
        if ('error' in result) {
          alert(result.error || '権限の更新に失敗しました');
          // エラー時は権限一覧を再取得して正しい状態に戻す
          const permissionsResult = await getPermissions(itemId);
          if ('success' in permissionsResult && permissionsResult.success) {
            setPermissions(permissionsResult.permissions);
          }
          // 保留中の変更もクリアして整合性を保つ
          setPendingChanges({ updates: new Map(), deletes: new Set() });
          return;
        }
      }

      // 削除を実行
      for (const permissionId of pendingChanges.deletes) {
        const result = await removePermission(permissionId);
        if ('error' in result) {
          alert(result.error || '削除に失敗しました');
          // エラー時は権限一覧を再取得して正しい状態に戻す
          const permissionsResult = await getPermissions(itemId);
          if ('success' in permissionsResult && permissionsResult.success) {
            setPermissions(permissionsResult.permissions);
          }
          // 保留中の変更もクリアして整合性を保つ
          setPendingChanges({ updates: new Map(), deletes: new Set() });
          return;
        }
      }

      // 成功したら保留中の変更をクリア
      setPendingChanges({ updates: new Map(), deletes: new Set() });
    } finally {
      setIsSaving(false);
    }
  };

  // キャンセル
  const handleCancel = () => {
    // 元の状態に戻す
    setPermissions(initialPermissions);
    setPendingChanges({ updates: new Map(), deletes: new Set() });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">アクセス権限</h2>
          <p className="text-sm text-muted-foreground">
            このアイテムにアクセスできるユーザーとグループを管理します。
            <br />
            権限が設定されていない場合、すべてのユーザーがREAD権限でアクセスできます。
          </p>
        </div>
        <div>
          <AddPermissionButton
            users={users}
            groups={groups}
            onAdd={handleAdd}
          />
        </div>
      </div>

      {/* 権限一覧 */}
      {permissions.length === 0 ? (
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
                      onDelete={async (id) => handleDelete(id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 保存・キャンセルボタン */}
      <div className="flex justify-end gap-2 mt-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={!hasChanges || isSaving}
        >
          キャンセル
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? '保存中...' : '変更を保存'}
        </Button>
      </div>
    </div>
  );
}
