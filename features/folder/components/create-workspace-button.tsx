'use client';

import { useState, useActionState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarGroupAction } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { createFolder } from '../api/create-folder';

type CreateWorkspaceContentProps = {
  onClose: () => void;
};

function CreateWorkspaceContent({ onClose }: CreateWorkspaceContentProps) {
  const [state, formAction] = useActionState(createFolder, {});

  // 成功・エラー時の処理
  useEffect(() => {
    if (state.error) {
      toast.error('ワークスペースの作成に失敗しました', {
        description: state.error,
      });
    } else if (state.success) {
      toast.success('ワークスペースを作成しました');
      onClose();
    }
  }, [state, onClose]);

  return (
    <form action={formAction}>
      <input type="hidden" name="parentId" value="" />

      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">ワークスペース名</Label>
          <Input
            id="name"
            name="name"
            placeholder="ワークスペース名を入力"
            autoFocus
            required
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

export function CreateWorkspaceButton() {
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
    <>
      <SidebarGroupAction
        title="フォルダまたはテーブルを追加"
        onClick={() => setOpen(true)}
      >
        <Plus className="cursor-pointer" />
        <span className="sr-only">フォルダまたはテーブルを追加</span>
      </SidebarGroupAction>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ワークスペースを作成</DialogTitle>
            <DialogDescription>
              新しいワークスペースを作成します
            </DialogDescription>
          </DialogHeader>
          <CreateWorkspaceContent key={resetKey} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </>
  );
}
