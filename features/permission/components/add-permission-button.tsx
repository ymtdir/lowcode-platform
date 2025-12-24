'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import {
  PERMISSION_LIST,
  getPermissionLabel,
  getPermissionDescription,
} from '@/features/permission/constants';
import type { Permission } from '@prisma/client';

/**
 * 権限追加ボタンのProps型
 */
type AddPermissionButtonProps = {
  users: Array<{ id: string; name: string | null; email: string }>;
  groups: Array<{ id: string; name: string; description: string | null }>;
  onAdd: (
    targetType: 'group' | 'user',
    targetId: string,
    level: Permission
  ) => Promise<void>;
};

/**
 * 権限追加ボタンコンポーネント
 */
export function AddPermissionButton({
  users,
  groups,
  onAdd,
}: AddPermissionButtonProps) {
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useState<'group' | 'user'>('group');
  const [targetId, setTargetId] = useState('');
  const [level, setLevel] = useState<Permission>('READ');
  const [loading, setLoading] = useState(false);

  // フォームをリセット
  const resetForm = () => {
    setTargetType('group');
    setTargetId('');
    setLevel('READ');
  };

  // 追加処理
  const handleAdd = async () => {
    if (!targetId) {
      alert('グループまたはユーザーを選択してください');
      return;
    }

    setLoading(true);
    try {
      await onAdd(targetType, targetId, level);
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('権限の追加に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Plus />
          権限追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>権限を追加</DialogTitle>
          <DialogDescription>
            グループまたはユーザーに権限を付与します。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 種別選択 */}
          <div className="space-y-2">
            <Label htmlFor="target-type">種別</Label>
            <Select
              value={targetType}
              onValueChange={(value) => {
                setTargetType(value as 'group' | 'user');
                setTargetId(''); // 種別変更時にリセット
              }}
            >
              <SelectTrigger id="target-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="group">グループ</SelectItem>
                <SelectItem value="user">ユーザー</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* グループ/ユーザー選択 */}
          <div className="space-y-2">
            <Label htmlFor="target-id">
              {targetType === 'group' ? 'グループ' : 'ユーザー'}
            </Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger id="target-id">
                <SelectValue
                  placeholder={
                    targetType === 'group' ? 'グループを選択' : 'ユーザーを選択'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {targetType === 'group'
                  ? groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))
                  : users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          {/* 権限レベル選択 */}
          <div className="grid gap-2">
            <Label htmlFor="permission-level">権限レベル</Label>
            <div className="flex items-center gap-3">
              <Select
                value={level}
                onValueChange={(value) => setLevel(value as Permission)}
              >
                <SelectTrigger id="permission-level" className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_LIST.map((permLevel) => (
                    <SelectItem key={permLevel} value={permLevel}>
                      {getPermissionLabel(permLevel)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground flex-1">
                {getPermissionDescription(level)}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button onClick={handleAdd} disabled={loading || !targetId}>
            {loading ? '追加中...' : '追加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
