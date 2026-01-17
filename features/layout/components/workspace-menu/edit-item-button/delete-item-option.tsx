'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertCircle } from 'lucide-react';
import type { ItemType } from '@prisma/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { deleteItem } from '@/features/item/api';

/**
 * アイテムタイプに応じたラベルを取得
 */
const getItemLabel = (itemType: ItemType) => {
  return itemType === 'TABLE' ? 'テーブル' : 'フォルダ';
};

/**
 * 削除オプションのProps型
 */
type DeleteItemOptionProps = {
  itemId: string;
  itemType: ItemType;
  itemName: string;
  onOpenChange: (open: boolean) => void;
};

/**
 * 削除オプションコンポーネント
 */
export function DeleteItemOption({
  itemId,
  itemType,
  itemName,
  onOpenChange: onDropdownOpenChange,
}: DeleteItemOptionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const label = getItemLabel(itemType);

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await deleteItem(itemId);

    setOpen(false);
    setIsDeleting(false);

    if (result.error) {
      toast.error('削除に失敗しました', {
        description: result.error,
      });
    } else {
      toast.success(`${label}を削除しました`, {
        description: `${itemName}を削除しました`,
      });
      router.push('/workspace');
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      onDropdownOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-destructive hover:text-destructive focus:text-destructive "
          onSelect={(e) => e.preventDefault()}
        >
          <Trash2 className="text-destructive" />
          削除
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-destructive" />
            <AlertDialogTitle className="text-destructive">
              {itemName}を削除
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            削除した{label}は復元できません。
            <br />
            {label}内のすべてのデータが完全に削除されます。
            <br />
            本当に削除しますか？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer" disabled={isDeleting}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="cursor-pointer bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 "
          >
            {isDeleting ? '削除中...' : '削除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
