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
import type { ColumnType, SelectOption } from '../types/column';
import { COLUMN_TYPE_LIST, COLUMN_CONFIGS } from '../constants';
import { SelectConfigEditor } from './config/select-config-editor';
import { NumberConfigEditor } from './config/number-config-editor';
import { DateConfigEditor } from './config/date-config-editor';
import { TextConfigEditor } from './config/text-config-editor';
import { TextareaConfigEditor } from './config/textarea-config-editor';
import type { DatePrecision } from '../types/column';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * カラム追加ダイアログのProps型
 */
type AddColumnDialogProps = {
  itemId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextOrder: number;
};

/**
 * カラム追加ダイアログコンポーネント
 */
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

  // SELECT/MULTI_SELECT用の状態
  const [selectOptions, setSelectOptions] = useState<SelectOption[]>([]);
  const [defaultValue, setDefaultValue] = useState<string | string[]>('');

  // TEXT用の状態
  const [textConfig, setTextConfig] = useState<{
    placeholder?: string;
    defaultValue?: string;
  }>({});

  // TEXTAREA用の状態
  const [textareaConfig, setTextareaConfig] = useState<{
    placeholder?: string;
    defaultValue?: string;
  }>({});

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

  // ダイアログが閉じられたときに状態をリセット
  useEffect(() => {
    if (!open) {
      setColumnType('TEXT');
      setColumnName('');
      setIsRequired(false);
      setSelectOptions([]);
      setDefaultValue('');
      setTextConfig({});
      setTextareaConfig({});
      setNumberConfig({});
      setDateConfig({});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // SELECT/MULTI_SELECTの場合、選択肢が必須
    if (
      (columnType === 'SELECT' || columnType === 'MULTI_SELECT') &&
      selectOptions.length === 0
    ) {
      toast.error('選択肢を少なくとも1つ追加してください');
      return;
    }

    // 空ラベルのチェック
    if (
      (columnType === 'SELECT' || columnType === 'MULTI_SELECT') &&
      selectOptions.some((opt) => !opt.label.trim())
    ) {
      toast.error('すべての選択肢にラベルを入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      // configの構築
      let config;
      if (columnType === 'TEXT' && Object.keys(textConfig).length > 0) {
        config = textConfig;
      } else if (
        columnType === 'TEXTAREA' &&
        Object.keys(textareaConfig).length > 0
      ) {
        config = textareaConfig;
      } else if (columnType === 'SELECT') {
        config = {
          options: selectOptions,
          defaultValue: defaultValue as string,
        };
      } else if (columnType === 'MULTI_SELECT') {
        config = {
          options: selectOptions,
          defaultValue: defaultValue as string[],
        };
      } else if (
        columnType === 'NUMBER' &&
        Object.keys(numberConfig).length > 0
      ) {
        config = numberConfig;
      } else if (columnType === 'DATE' && Object.keys(dateConfig).length > 0) {
        config = dateConfig;
      }

      const result = await addColumn(itemId, {
        name: columnName,
        type: columnType,
        order: nextOrder,
        validation: isRequired ? { required: true } : undefined,
        config: config as never,
      });

      if (result.error) {
        toast.error('項目の追加に失敗しました', {
          description: result.error,
        });
      } else if (result.success) {
        toast.success('項目を追加しました');
        onOpenChange(false);
      }
    } catch {
      toast.error('項目の追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-6">
          <DialogTitle>項目を追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="[&>div[data-radix-scroll-area-viewport]]:max-h-[50vh] px-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">項目名</Label>
                <Input
                  id="name"
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  placeholder="項目名"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">タイプ</Label>
                <div className="flex items-center gap-3">
                  <Select
                    value={columnType}
                    onValueChange={(value) =>
                      setColumnType(value as ColumnType)
                    }
                  >
                    <SelectTrigger className="w-[200px]">
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
                  <p className="text-xs text-muted-foreground flex-1">
                    {COLUMN_CONFIGS[columnType].description}
                  </p>
                </div>
              </div>

              {/* TEXT用の設定 */}
              {columnType === 'TEXT' && (
                <TextConfigEditor
                  key={open ? 'open' : 'closed'}
                  config={textConfig}
                  onChange={setTextConfig}
                />
              )}

              {/* TEXTAREA用の設定 */}
              {columnType === 'TEXTAREA' && (
                <TextareaConfigEditor
                  key={open ? 'open' : 'closed'}
                  config={textareaConfig}
                  onChange={setTextareaConfig}
                />
              )}

              {/* SELECT/MULTI_SELECT用の選択肢設定 */}
              {(columnType === 'SELECT' || columnType === 'MULTI_SELECT') && (
                <SelectConfigEditor
                  options={selectOptions}
                  defaultValue={defaultValue}
                  isMultiSelect={columnType === 'MULTI_SELECT'}
                  onChange={(options, defValue) => {
                    setSelectOptions(options);
                    setDefaultValue(
                      defValue || (columnType === 'MULTI_SELECT' ? [] : '')
                    );
                  }}
                />
              )}

              {/* NUMBER用の設定 */}
              {columnType === 'NUMBER' && (
                <NumberConfigEditor
                  key={open ? 'open' : 'closed'}
                  config={numberConfig}
                  onChange={setNumberConfig}
                />
              )}

              {/* DATE用の設定 */}
              {columnType === 'DATE' && (
                <DateConfigEditor
                  key={open ? 'open' : 'closed'}
                  config={dateConfig}
                  onChange={setDateConfig}
                />
              )}

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
          </ScrollArea>
          <DialogFooter className="px-6 py-6">
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
