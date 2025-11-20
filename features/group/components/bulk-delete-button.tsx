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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { deleteGroup } from '../api/delete-group';

/**
 * 一括削除ボタンのProps型
 */
type BulkDeleteButtonProps = {
  selectedGroupIds: string[];
  onDeleteComplete: () => void;
};

/**
 * 一括削除ボタンコンポーネント
 */
export function BulkDeleteButton({
  selectedGroupIds,
  onDeleteComplete,
}: BulkDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBulkDelete = async () => {
    setIsDeleting(true);

    const results = await Promise.all(
      selectedGroupIds.map((id) => deleteGroup(id))
    );

    setOpen(false);
    setIsDeleting(false);

    const successCount = results.filter((r) => r.success).length;
    const errorResults = results.filter((r) => r.error);
    const childExistsErrors = errorResults.filter((r) =>
      r.error?.includes('子グループが存在する')
    );

    if (childExistsErrors.length > 0 && successCount > 0) {
      toast.warning('子グループが存在するため一部削除できませんでした', {
        description: `${successCount}件を削除しました`,
      });
    } else if (childExistsErrors.length > 0) {
      toast.error('子グループが存在するため削除できません', {
        description: '先に子グループを削除してください',
      });
    } else if (errorResults.length === 0) {
      toast.success(`${successCount}件のグループを削除しました`);
    } else if (successCount > 0) {
      toast.warning('一部のグループの削除に失敗しました', {
        description: `${successCount}件削除、${errorResults.length}件失敗`,
      });
    } else {
      toast.error('グループの削除に失敗しました');
    }

    onDeleteComplete();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="ml-2 ">
          <Trash2 />
          一括削除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-destructive" />
            <AlertDialogTitle className="text-destructive">
              {selectedGroupIds.length}件のグループを削除
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
          <AlertDialogAction
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 "
          >
            {isDeleting ? '削除中...' : '削除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
