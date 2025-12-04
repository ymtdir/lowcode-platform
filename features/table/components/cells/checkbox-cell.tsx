'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

type CheckboxCellProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  displayStyle?: 'checkbox' | 'switch';
  checkedLabel?: string;
  uncheckedLabel?: string;
  readOnly?: boolean;
};

/**
 * チェックボックスセルコンポーネント
 */
export function CheckboxCell({
  value,
  onChange,
  displayStyle = 'checkbox',
  checkedLabel,
  uncheckedLabel,
  readOnly = false,
}: CheckboxCellProps) {
  // ラベルを取得
  const label = value ? checkedLabel : uncheckedLabel;

  return (
    <div className="min-h-[32px] px-2 py-1 flex items-center gap-2 w-full">
      {displayStyle === 'switch' ? (
        <Switch
          checked={value}
          onCheckedChange={onChange}
          disabled={readOnly}
        />
      ) : (
        <Checkbox
          checked={value}
          onCheckedChange={(checked) => onChange(checked === true)}
          disabled={readOnly}
        />
      )}
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
