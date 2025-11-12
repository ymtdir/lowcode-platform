'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { deleteFolder } from '@/features/folder/api';

type DeleteFolderItemProps = {
  folderId: string;
  folderName: string;
  onOpenChange: (open: boolean) => void;
};

export function DeleteFolderItem({
  folderId,
  folderName,
  onOpenChange: onDropdownOpenChange,
}: DeleteFolderItemProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await deleteFolder(folderId);

    setOpen(false);
    setIsDeleting(false);

    if (result.error) {
      toast.error('削除に失敗しました', {
        description: result.error,
      });
    } else {
      toast.success('フォルダを削除しました', {
        description: `${folderName}を削除しました`,
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
              {folderName}を削除
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            削除したフォルダは復元できません。
            <br />
            フォルダ内のすべてのデータが完全に削除されます。
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
