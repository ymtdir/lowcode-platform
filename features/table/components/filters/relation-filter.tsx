'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RelationRecord } from '@/features/column/types';

type RelationFilterProps = {
  value: string[];
  onChange: (value: string[]) => void;
  records: RelationRecord[];
};

/**
 * リレーションカラム用のフィルタコンポーネント
 */
export function RelationFilter({
  value,
  onChange,
  records,
}: RelationFilterProps) {
  const handleToggle = (recordId: string) => {
    const newValue = value.includes(recordId)
      ? value.filter((id) => id !== recordId)
      : [...value, recordId];
    onChange(newValue);
  };

  return (
    <ScrollArea className="h-auto max-h-48">
      <div className="flex flex-col gap-2">
        {records.map((record) => (
          <div key={record.id} className="flex items-center gap-2">
            <Checkbox
              id={`filter-${record.id}`}
              checked={value.includes(record.id)}
              onCheckedChange={() => handleToggle(record.id)}
            />
            <Label
              htmlFor={`filter-${record.id}`}
              className="cursor-pointer text-sm font-normal"
            >
              {record.displayValue}
            </Label>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
