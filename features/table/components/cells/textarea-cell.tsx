'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

type TextareaCellProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/**
 * テキストエリアセルコンポーネント
 */
export function TextareaCell({
  value,
  onChange,
  placeholder,
}: TextareaCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 編集開始時にpropsの値をローカルステートにコピー
  const handleStartEdit = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Textarea
        ref={textareaRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
        className="min-h-[60px] w-full border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary resize-none"
      />
    );
  }

  // 最初の1行だけを表示
  const firstLine = value ? value.split('\n')[0] : '';

  return (
    <div
      className="cursor-text min-h-[32px] px-2 py-1 hover:bg-muted/50 rounded flex items-center w-full"
      onClick={handleStartEdit}
    >
      <span className={firstLine ? '' : 'text-muted-foreground'}>
        {firstLine || placeholder || '-'}
      </span>
    </div>
  );
}
