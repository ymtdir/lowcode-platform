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
import { createFolder } from '@/features/item/api/create-folder';

/**
 * フォルダ作成オプションのProps型
 */
type CreateFolderOptionProps = {
  parentId?: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * フォルダ作成コンテンツのProps型
 */
type CreateFolderContentProps = {
  parentId?: string;
  onClose: () => void;
};

/**
 * フォルダ作成コンテンツコンポーネント
 */
function CreateFolderContent({ parentId, onClose }: CreateFolderContentProps) {
  const [state, formAction] = useActionState(createFolder, {});

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
      {parentId && <input type="hidden" name="parentId" value={parentId} />}

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
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={onClose}
        >
          キャンセル
        </Button>
        <Button type="submit" className="cursor-pointer">
          作成
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * フォルダ作成オプションコンポーネント
 */
export function CreateFolderOption({
  parentId,
  onOpenChange: onDropdownOpenChange,
}: CreateFolderOptionProps) {
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
            parentId={parentId}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
