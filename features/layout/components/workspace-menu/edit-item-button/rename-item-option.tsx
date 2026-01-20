'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { ItemType } from '@prisma/client';
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
import { renameItem } from '@/features/item/api';

/**
 * アイテムタイプに応じたラベルを取得
 */
const getItemLabel = (itemType: ItemType) => {
  return itemType === 'TABLE' ? 'テーブル' : 'フォルダ';
};

/**
 * 名前変更オプションのProps型
 */
type RenameItemOptionProps = {
  itemId: string;
  itemType: ItemType;
  currentName: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * 名前変更コンテンツのProps型
 */
type RenameContentProps = {
  itemId: string;
  itemType: ItemType;
  currentName: string;
  onClose: () => void;
};

/**
 * 名前変更コンテンツコンポーネント
 */
function RenameContent({
  itemId,
  itemType,
  currentName,
  onClose,
}: RenameContentProps) {
  const [name, setName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const label = getItemLabel(itemType);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await renameItem(itemId, name);

      if (result.error) {
        toast.error('名前の変更に失敗しました', {
          description: result.error,
        });
      } else {
        toast.success('名前を変更しました', {
          description: `${currentName} → ${name}`,
        });
        // パンくずリストの強制更新イベントを発火
        window.dispatchEvent(new CustomEvent('refreshBreadcrumb'));
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">{label}名</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`${label}名を入力`}
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
export function RenameItemOption({
  itemId,
  itemType,
  currentName,
  onOpenChange: onDropdownOpenChange,
}: RenameItemOptionProps) {
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const label = getItemLabel(itemType);

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
            <DialogTitle>{label}名を変更</DialogTitle>
          </DialogHeader>
          <RenameContent
            key={resetKey}
            itemId={itemId}
            itemType={itemType}
            currentName={currentName}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
