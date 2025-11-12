'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { renameFolder } from '@/features/folder/api';

type RenameFolderItemProps = {
  folderId: string;
  currentName: string;
  onOpenChange: (open: boolean) => void;
};

type RenameContentProps = {
  folderId: string;
  currentName: string;
  onClose: () => void;
};

function RenameContent({ folderId, currentName, onClose }: RenameContentProps) {
  const [name, setName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await renameFolder(folderId, name);

    setIsSubmitting(false);

    if (result.error) {
      toast.error('名前の変更に失敗しました', {
        description: result.error,
      });
    } else {
      toast.success('名前を変更しました', {
        description: `${currentName} → ${name}`,
      });
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">フォルダ名</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="フォルダ名を入力"
            autoFocus
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '変更中...' : '変更'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RenameFolderItem({
  folderId,
  currentName,
  onOpenChange: onDropdownOpenChange,
}: RenameFolderItemProps) {
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
        名前を変更
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>フォルダ名を変更</DialogTitle>
          </DialogHeader>
          <RenameContent
            key={resetKey}
            folderId={folderId}
            currentName={currentName}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
