'use client';

import { useState, useActionState, useEffect } from 'react';
import { Table } from 'lucide-react';
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
import { createTable } from '@/features/item/api/create-table';

type CreateTableButtonProps = {
  parentId: string;
  onOpenChange: (open: boolean) => void;
};

type CreateTableContentProps = {
  parentId: string;
  onClose: () => void;
};

function CreateTableContent({ parentId, onClose }: CreateTableContentProps) {
  const [state, formAction] = useActionState(createTable, {});

  // 成功・エラー時の処理
  useEffect(() => {
    if (state.error) {
      toast.error('テーブルの作成に失敗しました', {
        description: state.error,
      });
    } else if (state.success) {
      toast.success('テーブルを作成しました');
      onClose();
    }
  }, [state, onClose]);

  return (
    <form action={formAction}>
      <input type="hidden" name="parentId" value={parentId} />

      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">テーブル名</Label>
          <Input
            id="name"
            name="name"
            placeholder="テーブル名を入力"
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

export function CreateTableButton({
  parentId,
  onOpenChange: onDropdownOpenChange,
}: CreateTableButtonProps) {
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
        <Table />
        テーブルを追加
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テーブルを作成</DialogTitle>
            <DialogDescription>新しいテーブルを作成します</DialogDescription>
          </DialogHeader>
          <CreateTableContent
            key={resetKey}
            parentId={parentId}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
