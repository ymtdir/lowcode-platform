'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { NumberFilterValue } from '@/features/table/utils/filter-functions';

type NumberOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'range';

type NumberFilterProps = {
  value: NumberFilterValue;
  onChange: (value: NumberFilterValue) => void;
};

/**
 * 数値フィルタの演算子一覧
 */
const OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'ne', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'range', label: '範囲' },
] as const;

/**
 * 数値カラム用のフィルタコンポーネント
 */
export function NumberFilter({ value, onChange }: NumberFilterProps) {
  const operator = value.operator || 'eq';
  const value1 = value.value1 !== null ? String(value.value1) : '';
  const value2 = value.value2 !== null ? String(value.value2) : '';

  const handleOperatorChange = (newOperator: NumberOperator) => {
    onChange({
      operator: newOperator,
      value1: value.value1,
      value2: value.value2,
    });
  };

  const handleValue1Change = (newValue: string) => {
    const parsed = parseFloat(newValue);
    onChange({
      operator: value.operator,
      value1: Number.isFinite(parsed) ? parsed : null,
      value2: value.value2,
    });
  };

  const handleValue2Change = (newValue: string) => {
    const parsed = parseFloat(newValue);
    onChange({
      operator: value.operator,
      value1: value.value1,
      value2: Number.isFinite(parsed) ? parsed : null,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="h-8 w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        value={value1}
        onChange={(e) => handleValue1Change(e.target.value)}
        placeholder={operator === 'range' ? '最小値' : '値'}
        className="h-8 w-full"
      />
      {operator === 'range' && (
        <>
          <span className="text-muted-foreground text-sm">～</span>
          <Input
            type="number"
            value={value2}
            onChange={(e) => handleValue2Change(e.target.value)}
            placeholder="最大値"
            className="h-8 w-full"
          />
        </>
      )}
    </div>
  );
}
