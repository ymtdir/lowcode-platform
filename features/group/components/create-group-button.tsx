'use client';

import { useState, useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createGroup } from '../api/create-group';
import type { Group } from '../types';

type CreateGroupButtonProps = {
  groups: Group[];
};

type CreateGroupContentProps = {
  groups: Group[];
  onClose: () => void;
};

const NONE_VALUE = '__none__';

function CreateGroupContent({ groups, onClose }: CreateGroupContentProps) {
  const [parentId, setParentId] = useState<string>(NONE_VALUE);
  const [state, formAction] = useActionState(createGroup, {});

  // 成功・エラー時の処理
  useEffect(() => {
    if (state.error) {
      toast.error('グループの作成に失敗しました', {
        description: state.error,
      });
    } else if (state.success) {
      toast.success('グループを作成しました');
      onClose();
    }
  }, [state, onClose]);

  return (
    <form action={formAction}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">グループ名</Label>
          <Input id="name" name="name" placeholder="営業部" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">説明</Label>
          <Input
            id="description"
            name="description"
            placeholder="営業活動を行う部門"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="parentId">親グループ</Label>
          <Select value={parentId} onValueChange={setParentId}>
            <SelectTrigger>
              <SelectValue placeholder="なし" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>なし</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
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
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          キャンセル
        </Button>
        <Button type="submit">作成</Button>
      </DialogFooter>
    </form>
  );
}

export function CreateGroupButton({ groups }: CreateGroupButtonProps) {
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // ダイアログが閉じられたときに状態をリセット
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setResetKey((prev) => prev + 1);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          新規作成
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>グループを追加</DialogTitle>
        </DialogHeader>
        <CreateGroupContent
          key={resetKey}
          groups={groups}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
