'use client';

import { Checkbox } from '@/components/ui/checkbox';

type CheckboxCellProps = {
  value: boolean;
  onChange: (value: boolean) => void;
};

/**
 * チェックボックスセルコンポーネント
 */
export function CheckboxCell({ value, onChange }: CheckboxCellProps) {
  return (
    <div className="min-h-[32px] px-2 py-1 flex items-center justify-center w-full">
      <Checkbox
        checked={value}
        onCheckedChange={(checked) => onChange(checked === true)}
      />
    </div>
  );
}
