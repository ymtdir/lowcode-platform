'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

type TextCellProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
};

/**
 * テキストセルコンポーネント
 */
export function TextCell({
  value,
  onChange,
  placeholder,
  maxLength,
}: TextCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 編集開始時にpropsの値をローカルステートにコピー
  const handleStartEdit = () => {
    setEditValue(value);
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
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        className="h-8 w-full border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary"
      />
    );
  }

  return (
    <div
      className="cursor-text min-h-[32px] px-2 py-1 hover:bg-muted/50 rounded flex items-center w-full"
      onClick={handleStartEdit}
    >
      <span className={value ? '' : 'text-muted-foreground'}>
        {value || placeholder || '-'}
      </span>
    </div>
  );
}
