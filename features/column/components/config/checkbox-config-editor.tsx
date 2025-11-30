'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * CheckboxConfigEditorのProps
 */
type CheckboxConfigEditorProps = {
  config: {
    checkedLabel?: string;
    uncheckedLabel?: string;
    defaultValue?: boolean;
    displayStyle?: 'checkbox' | 'switch';
  };
  onChange: (config: {
    checkedLabel?: string;
    uncheckedLabel?: string;
    defaultValue?: boolean;
    displayStyle?: 'checkbox' | 'switch';
  }) => void;
};

/**
 * CHECKBOX型カラムの設定エディタコンポーネント
 */
export function CheckboxConfigEditor({
  config,
  onChange,
}: CheckboxConfigEditorProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="checkbox-displayStyle">表示スタイル</Label>
        <Select
          value={config.displayStyle || 'checkbox'}
          onValueChange={(value: 'checkbox' | 'switch') =>
            onChange({
              ...config,
              displayStyle: value === 'checkbox' ? undefined : value,
            })
          }
        >
          <SelectTrigger id="checkbox-displayStyle" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="checkbox">チェックボックス</SelectItem>
            <SelectItem value="switch">トグルスイッチ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="checkbox-checkedLabel">チェック時のラベル</Label>
          <Input
            id="checkbox-checkedLabel"
            value={config.checkedLabel || ''}
            onChange={(e) =>
              onChange({
                ...config,
                checkedLabel: e.target.value || undefined,
              })
            }
            placeholder="例: 完了、有効"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="checkbox-uncheckedLabel">未チェック時のラベル</Label>
          <Input
            id="checkbox-uncheckedLabel"
            value={config.uncheckedLabel || ''}
            onChange={(e) =>
              onChange({
                ...config,
                uncheckedLabel: e.target.value || undefined,
              })
            }
            placeholder="例: 未完了、無効"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="checkbox-defaultValue"
          checked={config.defaultValue || false}
          onCheckedChange={(checked) =>
            onChange({
              ...config,
              defaultValue: checked === true ? true : undefined,
            })
          }
        />
        <Label htmlFor="checkbox-defaultValue" className="font-normal">
          デフォルトでチェック状態にする
        </Label>
      </div>
    </div>
  );
}
