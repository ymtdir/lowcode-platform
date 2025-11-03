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

type DeleteGroupItemProps = {
  group: Group;
};

export function DeleteGroupItem({ group }: DeleteGroupItemProps) {
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

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-destructive! hover:text-destructive! focus:text-destructive!"
          onSelect={(e) => e.preventDefault()}
        >
          <Trash2 className="text-destructive!" />
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
          <AlertDialogCancel disabled={isDeleting}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? '削除中...' : '削除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
