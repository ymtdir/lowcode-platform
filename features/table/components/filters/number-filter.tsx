'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type NumberOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'range';

/**
 * 数値フィルタの値の型
 */
export type NumberFilterValue = {
  operator: NumberOperator;
  value1: number | null;
  value2: number | null;
};

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
  const [operator, setOperator] = useState<NumberOperator>(
    value.operator || 'eq'
  );
  const [value1, setValue1] = useState<string>(
    value.value1 !== null ? String(value.value1) : ''
  );
  const [value2, setValue2] = useState<string>(
    value.value2 !== null ? String(value.value2) : ''
  );

  const handleOperatorChange = (newOperator: NumberOperator) => {
    setOperator(newOperator);
    onChange({
      operator: newOperator,
      value1: value1 ? parseFloat(value1) : null,
      value2: value2 ? parseFloat(value2) : null,
    });
  };

  const handleValue1Change = (newValue: string) => {
    setValue1(newValue);
    onChange({
      operator,
      value1: newValue ? parseFloat(newValue) : null,
      value2: value2 ? parseFloat(value2) : null,
    });
  };

  const handleValue2Change = (newValue: string) => {
    setValue2(newValue);
    onChange({
      operator,
      value1: value1 ? parseFloat(value1) : null,
      value2: newValue ? parseFloat(newValue) : null,
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
