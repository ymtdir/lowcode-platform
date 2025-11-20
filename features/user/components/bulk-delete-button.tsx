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
import { deleteUser } from '../api/delete-user';

/**
 * 一括削除ボタンのProps型
 */
type BulkDeleteButtonProps = {
  selectedUserIds: string[];
  onDeleteComplete: () => void;
};

/**
 * 一括削除ボタンコンポーネント
 */
export function BulkDeleteButton({
  selectedUserIds,
  onDeleteComplete,
}: BulkDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBulkDelete = async () => {
    setIsDeleting(true);

    // 並列で削除実行
    const results = await Promise.all(
      selectedUserIds.map((id) => deleteUser(id))
    );

    setOpen(false);
    setIsDeleting(false);

    // 結果を集計
    const successCount = results.filter((r) => r.success).length;
    const errorResults = results.filter((r) => r.error);
    const selfDeleteAttempts = errorResults.filter((r) =>
      r.error?.includes('自分自身を削除')
    );

    // トースト表示
    if (selfDeleteAttempts.length > 0 && successCount > 0) {
      toast.warning('自分自身は削除できません', {
        description: `他${successCount}件を削除しました`,
      });
    } else if (selfDeleteAttempts.length > 0) {
      toast.error('自分自身を削除することはできません');
    } else if (errorResults.length === 0) {
      toast.success(`${successCount}件のユーザーを削除しました`);
    } else if (successCount > 0) {
      toast.warning('一部のユーザーの削除に失敗しました', {
        description: `${successCount}件削除、${errorResults.length}件失敗`,
      });
    } else {
      toast.error('ユーザーの削除に失敗しました');
    }

    // 選択状態をリセット
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
              {selectedUserIds.length}件のユーザーを削除
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            削除したユーザーは復元できません。
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
