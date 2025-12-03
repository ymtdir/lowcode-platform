'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { getPermissions, removePermission } from '@/features/permission/api';
import {
  PERMISSION_LIST,
  getPermissionLabel,
} from '@/features/permission/constants';
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

  // 権限一覧を取得
  const loadPermissions = useCallback(async () => {
    setLoading(true);
    const result = await getPermissions(itemId);
    if ('success' in result && result.success) {
      setPermissions(result.permissions as PermissionInfo[]);
    }
    setLoading(false);
  }, [itemId]);

  useEffect(() => {
    let isMounted = true;

    const fetchPermissions = async () => {
      setLoading(true);
      const result = await getPermissions(itemId);
      if (isMounted && 'success' in result && result.success) {
        setPermissions(result.permissions as PermissionInfo[]);
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    fetchPermissions();

    return () => {
      isMounted = false;
    };
  }, [itemId]);

  // 権限削除
  const handleRemove = async (permissionId: string) => {
    if (!confirm('この権限設定を削除しますか？')) {
      return;
    }

    const result = await removePermission(permissionId);
    if ('success' in result && result.success) {
      await loadPermissions();
    } else if ('error' in result) {
      alert(result.error || '削除に失敗しました');
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

      {/* 権限追加ボタン */}
      <div className="flex justify-end">
        <Button size="sm">
          <Plus className="size-4 mr-2" />
          権限を追加
        </Button>
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
                    <Select value={permission.level} disabled>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(permission.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
