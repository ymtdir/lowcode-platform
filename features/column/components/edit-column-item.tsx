'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { updateColumn } from '../api/update-column';
import type { Column } from '../types/column';

/**
 * カラム編集アイテムのProps型
 */
type EditColumnItemProps = {
  itemId: string;
  column: Column;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (updated: {
    name: string;
    validation?: { required: boolean };
  }) => void;
};

/**
 * カラム編集アイテムコンポーネント
 */
export function EditColumnItem({
  itemId,
  column,
  onOpenChange: onDropdownOpenChange,
  onUpdated,
}: EditColumnItemProps) {
  const [open, setOpen] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const [isRequired, setIsRequired] = useState(
    column.validation?.required || false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ダイアログが開かれたときに最新の値をセット
  useEffect(() => {
    if (open) {
      setColumnName(column.name);
      setIsRequired(column.validation?.required || false);
    }
  }, [open, column]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateColumn(itemId, column.id, {
        name: columnName,
        validation: isRequired ? { required: true } : { required: false },
      });

      if (result.error) {
        toast.error('カラムの更新に失敗しました', {
          description: result.error,
        });
      } else if (result.success) {
        toast.success('カラムを更新しました');
        setOpen(false);
        onUpdated?.({
          name: columnName,
          validation: { required: isRequired },
        });
      }
    } catch {
      toast.error('カラムの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ダイアログの開閉を管理し、閉じたらドロップダウンも閉じる
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      onDropdownOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Pencil />
          編集
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>カラムを編集</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">カラム名</Label>
              <Input
                id="edit-name"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                placeholder="顧客名"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-required"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked === true)}
              />
              <label
                htmlFor="edit-required"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                必須項目にする
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '更新中...' : '更新'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
