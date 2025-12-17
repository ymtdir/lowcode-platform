'use client';

import { Input } from '@/components/ui/input';

type TextFilterProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/**
 * テキストカラム用のフィルタコンポーネント
 */
export function TextFilter({ value, onChange, placeholder }: TextFilterProps) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || '検索...'}
      className="h-8 w-full"
    />
  );
}
