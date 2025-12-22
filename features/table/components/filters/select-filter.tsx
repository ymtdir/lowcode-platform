'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { SelectOption } from '@/features/column/types';

type SelectFilterProps = {
  value: string[];
  onChange: (value: string[]) => void;
  options: SelectOption[];
};

/**
 * セレクトカラム用のフィルタコンポーネント
 */
export function SelectFilter({ value, onChange, options }: SelectFilterProps) {
  const handleToggle = (optionId: string) => {
    const newValue = value.includes(optionId)
      ? value.filter((id) => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <div key={option.id} className="flex items-center gap-2">
          <Checkbox
            id={`filter-${option.id}`}
            checked={value.includes(option.id)}
            onCheckedChange={() => handleToggle(option.id)}
          />
          <Label
            htmlFor={`filter-${option.id}`}
            className="cursor-pointer text-sm font-normal"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
