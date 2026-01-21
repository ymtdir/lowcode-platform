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

/**
 * 名前変更オプションのProps型
 */
type RenameAssetOptionProps = {
  currentName: string;
  onRename: (newName: string) => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
};

/**
 * 名前変更コンテンツのProps型
 */
type RenameContentProps = {
  currentName: string;
  onRename: (newName: string) => void | Promise<void>;
  onClose: () => void;
};

/**
 * 名前変更コンテンツコンポーネント
 */
function RenameContent({ currentName, onRename, onClose }: RenameContentProps) {
  const [name, setName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || name === currentName) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onRename(name.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">名前</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名前を入力"
            autoFocus
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          className="cursor-pointer"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          className="cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? '変更中...' : '変更'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * 名前変更オプションコンポーネント
 */
export function RenameAssetOption({
  currentName,
  onRename,
  onOpenChange: onDropdownOpenChange,
}: RenameAssetOptionProps) {
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
            <DialogTitle>名前を変更</DialogTitle>
          </DialogHeader>
          <RenameContent
            key={resetKey}
            currentName={currentName}
            onRename={onRename}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
