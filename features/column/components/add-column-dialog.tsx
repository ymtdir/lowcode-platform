'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { addColumn } from '../api/add-column';
import type { ColumnType } from '../types/column';
import { COLUMN_TYPE_LIST, COLUMN_CONFIGS } from '../constants';

type AddColumnDialogProps = {
  itemId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextOrder: number;
};

export function AddColumnDialog({
  itemId,
  open,
  onOpenChange,
  nextOrder,
}: AddColumnDialogProps) {
  const [columnType, setColumnType] = useState<ColumnType>('TEXT');
  const [columnName, setColumnName] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ダイアログが閉じられたときに状態をリセット
  useEffect(() => {
    if (!open) {
      setColumnType('TEXT');
      setColumnName('');
      setIsRequired(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await addColumn(itemId, {
        name: columnName,
        type: columnType,
        order: nextOrder,
        validation: isRequired ? { required: true } : undefined,
      });

      if (result.error) {
        toast.error('カラムの追加に失敗しました', {
          description: result.error,
        });
      } else if (result.success) {
        toast.success('カラムを追加しました');
        onOpenChange(false);
      }
    } catch {
      toast.error('カラムの追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>カラムを追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">カラム名</Label>
              <Input
                id="name"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                placeholder="顧客名"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">タイプ</Label>
              <Select
                value={columnType}
                onValueChange={(value) => setColumnType(value as ColumnType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMN_TYPE_LIST.map((type) => {
                    const config = COLUMN_CONFIGS[type];
                    const Icon = config.icon;
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {COLUMN_CONFIGS[columnType].description}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked === true)}
              />
              <label
                htmlFor="required"
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
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '追加中...' : '追加'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
