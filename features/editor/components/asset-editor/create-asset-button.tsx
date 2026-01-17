'use client';

import { useState } from 'react';
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

/**
 * アセット作成ボタンのProps型
 */
type CreateAssetButtonProps = {
  /** 作成対象の名称（例: "スタイル", "スクリプト"） */
  assetLabel?: string;
  onAdd: (name: string) => void;
};

/**
 * アセット作成コンテンツのProps型
 */
type CreateAssetContentProps = {
  assetLabel: string;
  onAdd: (name: string) => void;
  onClose: () => void;
};

/**
 * アセット作成コンテンツコンポーネント
 */
function CreateAssetContent({
  assetLabel,
  onAdd,
  onClose,
}: CreateAssetContentProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    onAdd(name.trim());
    setIsSubmitting(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">{assetLabel}名</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`${assetLabel}名を入力`}
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
          className="cursor-pointer"
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
          {isSubmitting ? '作成中...' : '作成'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * アセット作成ボタンコンポーネント
 */
export function CreateAssetButton({
  assetLabel = 'アセット',
  onAdd,
}: CreateAssetButtonProps) {
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setResetKey((prev) => prev + 1);
    }
  };

  const handleClose = () => {
    handleOpenChange(false);
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="cursor-pointer h-7 w-7 p-0"
        onClick={() => setOpen(true)}
      >
        <Plus />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{assetLabel}を作成</DialogTitle>
            <DialogDescription>
              新しい{assetLabel}を作成します
            </DialogDescription>
          </DialogHeader>
          <CreateAssetContent
            key={resetKey}
            assetLabel={assetLabel}
            onAdd={onAdd}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
