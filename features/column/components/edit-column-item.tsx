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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { updateColumn } from '../api/update-column';
import type { Column, SelectOption } from '../types/column';
import { SelectConfigEditor } from './config/select-config-editor';
import { NumberConfigEditor } from './config/number-config-editor';
import { DateConfigEditor } from './config/date-config-editor';
import type { DatePrecision } from '../types/column';

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
    config?: unknown;
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

  // SELECT/MULTI_SELECT用の状態
  const [selectOptions, setSelectOptions] = useState<SelectOption[]>([]);
  const [defaultValue, setDefaultValue] = useState<string | string[]>('');

  // NUMBER用の状態
  const [numberConfig, setNumberConfig] = useState<{
    min?: number;
    max?: number;
    unit?: string;
    unitPosition?: 'prefix' | 'suffix';
    thousandSeparator?: boolean;
    defaultValue?: number;
    step?: number;
  }>({});

  // DATE用の状態
  const [dateConfig, setDateConfig] = useState<{
    precision?: DatePrecision;
    defaultValue?: number;
    min?: string;
    max?: string;
    allowPast?: boolean;
    allowFuture?: boolean;
    placeholder?: string;
  }>({});

  // ダイアログが開かれたときに最新の値をセット
  useEffect(() => {
    if (open) {
      setColumnName(column.name);
      setIsRequired(column.validation?.required || false);

      // SELECT/MULTI_SELECTの場合、configから値を取得
      if (column.type === 'SELECT' || column.type === 'MULTI_SELECT') {
        const config = column.config;
        setSelectOptions(config?.options || []);
        setDefaultValue(
          config?.defaultValue || (column.type === 'MULTI_SELECT' ? [] : '')
        );
      }

      // NUMBERの場合、configから値を取得
      if (column.type === 'NUMBER') {
        const config = column.config;
        setNumberConfig(config || {});
      }

      // DATEの場合、configから値を取得
      if (column.type === 'DATE') {
        const config = column.config;
        setDateConfig(config || {});
      }
    }
  }, [open, column]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // SELECT/MULTI_SELECTの場合、選択肢が必須
    if (
      (column.type === 'SELECT' || column.type === 'MULTI_SELECT') &&
      selectOptions.length === 0
    ) {
      toast.error('選択肢を少なくとも1つ追加してください');
      return;
    }

    // 空ラベルのチェック
    if (
      (column.type === 'SELECT' || column.type === 'MULTI_SELECT') &&
      selectOptions.some((opt) => !opt.label.trim())
    ) {
      toast.error('すべての選択肢にラベルを入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      // configの構築
      let config;
      if (column.type === 'SELECT') {
        config = {
          options: selectOptions,
          defaultValue: defaultValue as string,
        };
      } else if (column.type === 'MULTI_SELECT') {
        config = {
          options: selectOptions,
          defaultValue: defaultValue as string[],
        };
      } else if (
        column.type === 'NUMBER' &&
        Object.keys(numberConfig).length > 0
      ) {
        config = numberConfig;
      } else if (column.type === 'DATE' && Object.keys(dateConfig).length > 0) {
        config = dateConfig;
      }

      const result = await updateColumn(itemId, column.id, {
        name: columnName,
        validation: isRequired ? { required: true } : undefined,
        config: config as never,
      });

      if (result.error) {
        toast.error('項目の更新に失敗しました', {
          description: result.error,
        });
      } else if (result.success) {
        toast.success('項目を更新しました');
        setOpen(false);
        onUpdated?.({
          name: columnName,
          validation: { required: isRequired },
          config: config as never,
        });
      }
    } catch {
      toast.error('項目の更新に失敗しました');
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-6">
          <DialogTitle>項目を編集</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="[&>div[data-radix-scroll-area-viewport]]:max-h-[50vh] px-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">項目名</Label>
                <Input
                  id="edit-name"
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  placeholder="項目名"
                  required
                />
              </div>

              {/* SELECT/MULTI_SELECT用の選択肢設定 */}
              {(column.type === 'SELECT' || column.type === 'MULTI_SELECT') && (
                <SelectConfigEditor
                  options={selectOptions}
                  defaultValue={defaultValue}
                  isMultiSelect={column.type === 'MULTI_SELECT'}
                  onChange={(options, defValue) => {
                    setSelectOptions(options);
                    setDefaultValue(
                      defValue || (column.type === 'MULTI_SELECT' ? [] : '')
                    );
                  }}
                />
              )}

              {/* NUMBER用の設定 */}
              {column.type === 'NUMBER' && (
                <NumberConfigEditor
                  key={open ? column.id : 'closed'}
                  config={numberConfig}
                  onChange={setNumberConfig}
                />
              )}

              {/* DATE用の設定 */}
              {column.type === 'DATE' && (
                <DateConfigEditor
                  key={open ? column.id : 'closed'}
                  config={dateConfig}
                  onChange={setDateConfig}
                />
              )}

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
          </ScrollArea>
          <DialogFooter className="px-6 py-6">
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
