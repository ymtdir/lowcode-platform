'use client';

import { useState, useRef, useEffect } from 'react';
import type { SelectOption } from '@/features/column/types';

type SelectCellProps = {
  value: string | null;
  onChange: (value: string | null) => void;
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
 * セレクトセルコンポーネント
 */
export function SelectCell({ value, onChange, options }: SelectCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const selectedOption = options.find((opt) => opt.id === value);

  const handleSelect = (optionId: string | null) => {
    onChange(optionId);
    setIsOpen(false);
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
        className="cursor-pointer min-h-[32px] px-2 py-1 hover:bg-muted/50 rounded flex items-center w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption ? (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-sm ${getColorClass(selectedOption.color)}`}
          >
            {selectedOption.label}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[150px] bg-popover border rounded-md shadow-lg z-50">
          <div className="py-1">
            <div
              className="px-3 py-1.5 hover:bg-muted cursor-pointer text-sm text-muted-foreground"
              onClick={() => handleSelect(null)}
            >
              選択なし
            </div>
            {options.map((option) => (
              <div
                key={option.id}
                className="px-3 py-1.5 hover:bg-muted cursor-pointer"
                onClick={() => handleSelect(option.id)}
              >
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-sm ${getColorClass(option.color)}`}
                >
                  {option.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
