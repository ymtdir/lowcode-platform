'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { CheckboxFilterValue } from '@/features/table/utils/filter-functions';

type CheckboxFilterProps = {
  value: CheckboxFilterValue;
  onChange: (value: CheckboxFilterValue) => void;
  checkedLabel?: string;
  uncheckedLabel?: string;
};

/**
 * チェックボックスカラム用のフィルタコンポーネント
 */
export function CheckboxFilter({
  value,
  onChange,
  checkedLabel = 'チェック済み',
  uncheckedLabel = '未チェック',
}: CheckboxFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id="filter-all"
          checked={value === 'all'}
          onCheckedChange={() => onChange('all')}
        />
        <Label
          htmlFor="filter-all"
          className="cursor-pointer text-sm font-normal"
        >
          すべて
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="filter-checked"
          checked={value === 'checked'}
          onCheckedChange={() => onChange('checked')}
        />
        <Label
          htmlFor="filter-checked"
          className="cursor-pointer text-sm font-normal"
        >
          {checkedLabel}
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="filter-unchecked"
          checked={value === 'unchecked'}
          onCheckedChange={() => onChange('unchecked')}
        />
        <Label
          htmlFor="filter-unchecked"
          className="cursor-pointer text-sm font-normal"
        >
          {uncheckedLabel}
        </Label>
      </div>
    </div>
  );
}
