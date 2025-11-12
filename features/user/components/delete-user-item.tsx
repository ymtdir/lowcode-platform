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
import { deleteUser } from '../api/delete-user';
import type { User } from '../types';

type DeleteUserItemProps = {
  user: User;
};

export function DeleteUserItem({ user }: DeleteUserItemProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await deleteUser(user.id);

    setOpen(false);
    setIsDeleting(false);

    if (result.error) {
      toast.error('削除に失敗しました', {
        description: result.error,
      });
    } else {
      toast.success('ユーザーを削除しました', {
        description: `${user.name}のアカウントを削除しました`,
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-destructive hover:text-destructive focus:text-destructive cursor-pointer"
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
              {user.name}を削除
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            削除したユーザーは復元できません。
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
