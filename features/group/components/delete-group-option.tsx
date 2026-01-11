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
import { toast } from 'sonner';
import { deleteGroup } from '../api/delete-group';
import type { Group } from '../types';

/**
 * グループ削除オプションのProps型
 */
type DeleteGroupOptionProps = {
  group: Group;
  onOpenChange: (open: boolean) => void;
};

/**
 * グループ削除オプションコンポーネント
 */
export function DeleteGroupOption({
  group,
  onOpenChange: onDropdownOpenChange,
}: DeleteGroupOptionProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await deleteGroup(group.id);

    setOpen(false);
    setIsDeleting(false);

    if (result.error) {
      toast.error('削除に失敗しました', {
        description: result.error,
      });
    } else {
      toast.success('グループを削除しました', {
        description: `${group.name}を削除しました`,
      });
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
              {group.name}を削除
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            削除したグループは復元できません。
            <br />
            本当に削除しますか？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="cursor-pointer">
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 cursor-pointer"
          >
            {isDeleting ? '削除中...' : '削除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
