'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

type TextCellProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
};

/**
 * テキストセルコンポーネント
 */
export function TextCell({
  value,
  onChange,
  placeholder,
  readOnly = false,
}: TextCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 編集開始時にpropsの値をローカルステートにコピー
  const handleStartEdit = () => {
    if (readOnly) return;
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
    // Safari対応: compositionstart/compositionendで管理するstate と keyCode 229 をチェック
    // keyCode 229 は IME が入力を処理中であることを示す
    if (isComposing || e.keyCode === 229) return;

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
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        placeholder={placeholder}
        className="h-8 w-full border-0 bg-transparent focus-visible:ring-0 shadow-none"
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
      <span className={value ? '' : 'text-muted-foreground'}>
        {value || placeholder || '-'}
      </span>
    </div>
  );
}
