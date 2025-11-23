'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import type { SelectOption } from '@/features/column/types';

type MultiSelectCellProps = {
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  options: SelectOption[];
};

// タグの背景色
const TAG_COLORS: Record<string, string> = {
  gray: 'bg-gray-500/20 text-gray-300',
  red: 'bg-red-500/20 text-red-300',
  orange: 'bg-orange-500/20 text-orange-300',
  yellow: 'bg-yellow-500/20 text-yellow-300',
  green: 'bg-green-500/20 text-green-300',
  blue: 'bg-blue-500/20 text-blue-300',
  purple: 'bg-purple-500/20 text-purple-300',
  pink: 'bg-pink-500/20 text-pink-300',
};

function getColorClass(color?: string): string {
  return TAG_COLORS[color || 'gray'] || TAG_COLORS.gray;
}

/**
 * マルチセレクトセルコンポーネント
 */
export function MultiSelectCell({
  value,
  onChange,
  options,
}: MultiSelectCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedIds = value ?? [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id));
  const unselectedOptions = options.filter(
    (opt) => !selectedIds.includes(opt.id)
  );

  const handleToggle = (optionId: string) => {
    if (selectedIds.includes(optionId)) {
      // 選択解除
      const newValue = selectedIds.filter((id) => id !== optionId);
      onChange(newValue.length > 0 ? newValue : null);
    } else {
      // 選択追加
      onChange([...selectedIds, optionId]);
    }
  };

  const handleRemove = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = selectedIds.filter((id) => id !== optionId);
    onChange(newValue.length > 0 ? newValue : null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onKeyDown={handleKeyDown}
    >
      <div
        className="cursor-pointer min-h-[32px] px-2 py-1 hover:bg-muted/50 rounded flex items-center flex-wrap gap-1 w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option) => (
            <span
              key={option.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm ${getColorClass(option.color)}`}
            >
              {option.label}
              <button
                type="button"
                className="hover:bg-white/20 rounded-full p-0.5"
                onClick={(e) => handleRemove(option.id, e)}
              >
                <X className="size-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[150px] bg-popover border rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
          <div className="py-1">
            {selectedOptions.length > 0 && (
              <>
                <div className="px-3 py-1 text-xs text-muted-foreground">
                  選択中
                </div>
                {selectedOptions.map((option) => (
                  <div
                    key={option.id}
                    className="px-3 py-1.5 hover:bg-muted cursor-pointer flex items-center justify-between"
                    onClick={() => handleToggle(option.id)}
                  >
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-sm ${getColorClass(option.color)}`}
                    >
                      {option.label}
                    </span>
                    <X className="size-4 text-muted-foreground" />
                  </div>
                ))}
              </>
            )}
            {unselectedOptions.length > 0 && (
              <>
                {selectedOptions.length > 0 && (
                  <div className="border-t my-1" />
                )}
                <div className="px-3 py-1 text-xs text-muted-foreground">
                  選択肢
                </div>
                {unselectedOptions.map((option) => (
                  <div
                    key={option.id}
                    className="px-3 py-1.5 hover:bg-muted cursor-pointer"
                    onClick={() => handleToggle(option.id)}
                  >
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-sm ${getColorClass(option.color)}`}
                    >
                      {option.label}
                    </span>
                  </div>
                ))}
              </>
            )}
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                選択肢がありません
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
