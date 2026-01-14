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
import { TextConfigEditor } from './config/text-config-editor';
import { TextareaConfigEditor } from './config/textarea-config-editor';
import { CheckboxConfigEditor } from './config/checkbox-config-editor';
import { RelationConfigEditor } from './config/relation-config-editor';
import type { DatePrecision } from '../types/column';
import type { Item } from '@/features/item/types';

/**
 * カラム編集オプションのProps型
 */
type EditColumnOptionProps = {
  itemId: string;
  column: Column;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (updated: {
    name: string;
    validation?: { required: boolean };
    config?: unknown;
  }) => void;
  tables?: Item[]; // リレーション用のテーブル一覧
};

/**
 * カラム編集オプションコンポーネント
 */
export function EditColumnOption({
  itemId,
  column,
  onOpenChange: onDropdownOpenChange,
  onUpdated,
  tables = [],
}: EditColumnOptionProps) {
  const [open, setOpen] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const [isRequired, setIsRequired] = useState(
    column.validation?.required || false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SELECT用の状態
  const [selectOptions, setSelectOptions] = useState<SelectOption[]>([]);
  const [selectDefaultValue, setSelectDefaultValue] = useState<
    string | string[]
  >('');
  const [selectAllowMultiple, setSelectAllowMultiple] = useState(false);

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

  // CHECKBOX用の状態
  const [checkboxConfig, setCheckboxConfig] = useState<{
    checkedLabel?: string;
    uncheckedLabel?: string;
    defaultValue?: boolean;
    displayStyle?: 'checkbox' | 'switch';
  }>({});

  // RELATION用の状態
  const [relationConfig, setRelationConfig] = useState<{
    referencedTableId: string;
    displayField: string;
    allowMultiple?: boolean;
  }>({
    referencedTableId: '',
    displayField: '',
    allowMultiple: false,
  });

  // ダイアログが開かれたときに最新の値をセット
  useEffect(() => {
    if (open) {
      setColumnName(column.name);
      setIsRequired(column.validation?.required || false);

      // TEXTの場合、configから値を取得
      if (column.type === 'TEXT') {
        const config = column.config;
        setTextConfig(config || {});
      }

      // TEXTAREAの場合、configから値を取得
      if (column.type === 'TEXTAREA') {
        const config = column.config;
        setTextareaConfig(config || {});
      }

      // SELECTの場合、configから値を取得
      if (column.type === 'SELECT') {
        const config = column.config;
        setSelectOptions(config?.options || []);
        setSelectDefaultValue(config?.defaultValue || '');
        setSelectAllowMultiple(config?.allowMultiple || false);
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

      // CHECKBOXの場合、configから値を取得
      if (column.type === 'CHECKBOX') {
        const config = column.config;
        setCheckboxConfig(config || {});
      }

      // RELATIONの場合、configから値を取得
      if (column.type === 'RELATION') {
        const config = column.config;
        setRelationConfig(
          config || {
            referencedTableId: '',
            displayField: '',
            allowMultiple: false,
          }
        );
      }
    }
  }, [open, column]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // SELECTの場合、選択肢が必須
    if (column.type === 'SELECT' && selectOptions.length === 0) {
      toast.error('選択肢を少なくとも1つ追加してください');
      return;
    }

    // 空ラベルのチェック
    if (
      column.type === 'SELECT' &&
      selectOptions.some((opt) => !opt.label.trim())
    ) {
      toast.error('すべての選択肢にラベルを入力してください');
      return;
    }

    // RELATIONの場合、参照先テーブルと表示フィールドが必須
    if (column.type === 'RELATION') {
      if (!relationConfig.referencedTableId) {
        toast.error('参照先テーブルを選択してください');
        return;
      }
      if (!relationConfig.displayField) {
        toast.error('表示フィールドを選択してください');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // configの構築
      let config;
      if (column.type === 'TEXT' && Object.keys(textConfig).length > 0) {
        config = textConfig;
      } else if (
        column.type === 'TEXTAREA' &&
        Object.keys(textareaConfig).length > 0
      ) {
        config = textareaConfig;
      } else if (column.type === 'SELECT') {
        config = {
          options: selectOptions,
          allowMultiple: selectAllowMultiple,
          defaultValue: selectDefaultValue,
        };
      } else if (
        column.type === 'NUMBER' &&
        Object.keys(numberConfig).length > 0
      ) {
        config = numberConfig;
      } else if (column.type === 'DATE' && Object.keys(dateConfig).length > 0) {
        config = dateConfig;
      } else if (
        column.type === 'CHECKBOX' &&
        Object.keys(checkboxConfig).length > 0
      ) {
        config = checkboxConfig;
      } else if (column.type === 'RELATION') {
        config = relationConfig;
      }

      const result = await updateColumn(itemId, column.id, {
        name: columnName,
        validation: { required: isRequired },
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

              {/* TEXT用の設定 */}
              {column.type === 'TEXT' && (
                <TextConfigEditor
                  key={open ? column.id : 'closed'}
                  config={textConfig}
                  onChange={setTextConfig}
                />
              )}

              {/* TEXTAREA用の設定 */}
              {column.type === 'TEXTAREA' && (
                <TextareaConfigEditor
                  key={open ? column.id : 'closed'}
                  config={textareaConfig}
                  onChange={setTextareaConfig}
                />
              )}

              {/* SELECT用の選択肢設定 */}
              {column.type === 'SELECT' && (
                <SelectConfigEditor
                  options={selectOptions}
                  defaultValue={selectDefaultValue}
                  allowMultiple={selectAllowMultiple}
                  onChange={(options, defValue, allowMultiple) => {
                    setSelectOptions(options);
                    setSelectDefaultValue(defValue || '');
                    if (allowMultiple !== undefined) {
                      setSelectAllowMultiple(allowMultiple);
                    }
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

              {/* CHECKBOX用の設定 */}
              {column.type === 'CHECKBOX' && (
                <CheckboxConfigEditor
                  key={open ? column.id : 'closed'}
                  config={checkboxConfig}
                  onChange={setCheckboxConfig}
                />
              )}

              {/* RELATION用の設定 */}
              {column.type === 'RELATION' && (
                <RelationConfigEditor
                  key={open ? column.id : 'closed'}
                  config={relationConfig}
                  tables={tables}
                  currentTableId={itemId}
                  onChange={setRelationConfig}
                />
              )}

              {/* CHECKBOXは必須項目設定が不要 */}
              {column.type !== 'CHECKBOX' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-required"
                    checked={isRequired}
                    onCheckedChange={(checked) =>
                      setIsRequired(checked === true)
                    }
                  />
                  <label
                    htmlFor="edit-required"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    必須項目にする
                  </label>
                </div>
              )}
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
