'use client';

import { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { deleteRecord } from '../api/delete-record';

/**
 * 一括削除ボタンのProps型
 */
type BulkDeleteButtonProps = {
  selectedRecordIds: string[];
  onDeleteComplete: (deletedIds: string[]) => void;
};

/**
 * 一括削除ボタンコンポーネント
 */
export function BulkDeleteButton({
  selectedRecordIds,
  onDeleteComplete,
}: BulkDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBulkDelete = async () => {
    setIsDeleting(true);

    const results = await Promise.all(
      selectedRecordIds.map((id) => deleteRecord(id))
    );

    setOpen(false);
    setIsDeleting(false);

    const successCount = results.filter((r) => r.success).length;
    const errorResults = results.filter((r) => r.error);

    // 削除成功したIDを収集
    const deletedIds = selectedRecordIds.filter(
      (_, index) => results[index].success
    );

    if (errorResults.length === 0) {
      toast.success(`${successCount}件のレコードを削除しました`);
    } else if (successCount > 0) {
      toast.warning('一部のレコードの削除に失敗しました', {
        description: `${successCount}件削除、${errorResults.length}件失敗`,
      });
    } else {
      toast.error('レコードの削除に失敗しました');
    }

    onDeleteComplete(deletedIds);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="ml-2">
          <Trash2 />
          一括削除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-destructive" />
            <AlertDialogTitle className="text-destructive">
              {selectedRecordIds.length}件のレコードを削除
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            削除したレコードは復元できません。
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
            className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60"
          >
            {isDeleting ? '削除中...' : '削除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
