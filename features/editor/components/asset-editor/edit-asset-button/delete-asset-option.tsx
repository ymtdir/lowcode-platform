'use client';

import { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
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

/**
 * 削除オプションのProps型
 */
type DeleteAssetOptionProps = {
  assetName: string;
  onDelete: () => void;
  onOpenChange: (open: boolean) => void;
};

/**
 * 削除オプションコンポーネント
 */
export function DeleteAssetOption({
  assetName,
  onDelete,
  onOpenChange: onDropdownOpenChange,
}: DeleteAssetOptionProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    onDelete();
    setOpen(false);
    setIsDeleting(false);
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
          className="text-destructive hover:text-destructive focus:text-destructive"
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
              {assetName}を削除
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            削除したアセットは復元できません。
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
            className="cursor-pointer bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60"
          >
            {isDeleting ? '削除中...' : '削除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
