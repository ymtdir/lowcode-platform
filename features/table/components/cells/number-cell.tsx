'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

type NumberCellProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  unit?: string;
  unitPosition?: 'prefix' | 'suffix';
  thousandSeparator?: boolean;
  readOnly?: boolean;
};

/**
 * 数値セルコンポーネント
 */
export function NumberCell({
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  unit,
  unitPosition = 'suffix',
  thousandSeparator = false,
  readOnly = false,
}: NumberCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 編集開始時にpropsの値をローカルステートにコピー
  const handleStartEdit = () => {
    if (readOnly) return;
    setEditValue(value?.toString() ?? '');
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    const parsed = editValue === '' ? null : parseFloat(editValue);
    if (parsed !== value) {
      onChange(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value?.toString() ?? '');
      setIsEditing(false);
    }
  };

  /**
   * 数値をフォーマットして表示
   */
  const formatNumber = (num: number): string => {
    let formatted = num.toString();

    // 千の位区切りを適用
    if (thousandSeparator) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }

    // 単位を適用
    if (unit) {
      if (unitPosition === 'prefix') {
        formatted = unit + formatted;
      } else {
        formatted = formatted + unit;
      }
    }

    return formatted;
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className="h-8 w-full border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary"
      />
    );
  }

  return (
    <div
      className={`min-h-[32px] px-2 py-1 rounded flex items-center w-full ${
        readOnly ? '' : 'cursor-text hover:bg-muted/50'
      }`}
      onClick={handleStartEdit}
    >
      <span className={value != null ? '' : 'text-muted-foreground'}>
        {value != null ? formatNumber(value) : (placeholder ?? '-')}
      </span>
    </div>
  );
}
