'use client';

import { useState, useActionState, useEffect } from 'react';
import { Folder } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createItem } from '@/features/item/api/create-item';

type CreateFolderItemProps = {
  workspaceId: string;
  onOpenChange: (open: boolean) => void;
};

type CreateFolderContentProps = {
  workspaceId: string;
  onClose: () => void;
};

function CreateFolderContent({
  workspaceId,
  onClose,
}: CreateFolderContentProps) {
  const [state, formAction] = useActionState(createItem, {});

  // 成功・エラー時の処理
  useEffect(() => {
    if (state.error) {
      toast.error('フォルダの作成に失敗しました', {
        description: state.error,
      });
    } else if (state.success) {
      toast.success('フォルダを作成しました');
      onClose();
    }
  }, [state, onClose]);

  return (
    <form action={formAction}>
      <input type="hidden" name="parentId" value={workspaceId} />

      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">フォルダ名</Label>
          <Input
            id="name"
            name="name"
            placeholder="フォルダ名を入力"
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

export function CreateFolderItem({
  workspaceId,
  onOpenChange: onDropdownOpenChange,
}: CreateFolderItemProps) {
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
        <Folder />
        フォルダを追加
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>フォルダを作成</DialogTitle>
            <DialogDescription>新しいフォルダを作成します</DialogDescription>
          </DialogHeader>
          <CreateFolderContent
            key={resetKey}
            workspaceId={workspaceId}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
