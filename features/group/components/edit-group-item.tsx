'use client';

import { useState, useActionState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateGroup } from '../api/update-group';
import type { Group } from '../types';

/**
 * グループ編集アイテムのProps型
 */
type EditGroupItemProps = {
  group: Group;
  allGroups: Group[];
  onOpenChange: (open: boolean) => void;
};

/**
 * グループ編集コンテンツのProps型
 */
type EditGroupContentProps = {
  group: Group;
  allGroups: Group[];
  onClose: () => void;
};

const NONE_VALUE = '__none__';

/**
 * 子孫グループIDを再帰的に収集するヘルパー関数
 */
function collectDescendantIds(groupId: string, allGroups: Group[]): string[] {
  const descendantIds: string[] = [];

  // 直接の子グループを取得
  const children = allGroups.filter((g) => g.parentId === groupId);

  for (const child of children) {
    // 子のIDを追加
    descendantIds.push(child.id);
    // 再帰的に子の子孫も取得
    const childDescendants = collectDescendantIds(child.id, allGroups);
    descendantIds.push(...childDescendants);
  }

  return descendantIds;
}

/**
 * グループ編集コンテンツコンポーネント
 */
function EditGroupContent({
  group,
  allGroups,
  onClose,
}: EditGroupContentProps) {
  const [parentId, setParentId] = useState<string>(
    group.parentId || NONE_VALUE
  );
  const [state, formAction] = useActionState<
    { error?: string; success?: boolean },
    FormData
  >((prevState, formData) => updateGroup(group.id, prevState, formData), {});

  // 更新結果を監視
  useEffect(() => {
    if (state.error) {
      toast.error('グループの更新に失敗しました', {
        description: state.error,
      });
    } else if (state.success) {
      toast.success('グループを更新しました', {
        description: `${group.name}を更新しました`,
      });
      onClose();
    }
  }, [state, group.name, onClose]);

  // 自分自身と子孫グループを除外したグループリスト
  const descendantIds = collectDescendantIds(group.id, allGroups);
  const excludedIds = new Set([group.id, ...descendantIds]);
  const availableGroups = allGroups.filter((g) => !excludedIds.has(g.id));

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>グループ情報</CardTitle>
          <CardDescription>グループの情報を編集します。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="name">グループ名</Label>
            <Input
              id="name"
              name="name"
              defaultValue={group.name}
              placeholder="営業部"
              required
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="description">説明</Label>
            <Input
              id="description"
              name="description"
              defaultValue={group.description || ''}
              placeholder="営業活動を行う部門"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="parentId">親グループ</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="なし" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>なし</SelectItem>
                {availableGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name="parentId"
              value={parentId === NONE_VALUE ? '' : parentId}
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit">保存</Button>
        </CardFooter>
      </Card>
    </form>
  );
}

/**
 * グループ編集アイテムコンポーネント
 */
export function EditGroupItem({
  group,
  allGroups,
  onOpenChange: onDropdownOpenChange,
}: EditGroupItemProps) {
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setResetKey((prev) => prev + 1);
      onDropdownOpenChange(false);
    }
  };

  const handleClose = () => {
    handleOpenChange(false);
  };

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        <Pencil />
        編集
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>グループ情報を編集</DialogTitle>
          </DialogHeader>
          <EditGroupContent
            key={resetKey}
            group={group}
            allGroups={allGroups}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
