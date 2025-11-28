'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import type { SelectOption } from '@/features/column/types';

type MultiSelectCellProps = {
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  options: SelectOption[];
};

/**
 * hex色から背景色と文字色のスタイルを生成
 */
function getColorStyles(color?: string): React.CSSProperties {
  if (!color) {
    return {
      backgroundColor: 'rgba(107, 114, 128, 0.2)', // gray-500/20
      color: 'rgb(209, 213, 219)', // gray-300
    };
  }

  // hex色をrgbaに変換して20%透明度の背景色を作成
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.2)`,
    color: `rgb(${r}, ${g}, ${b})`,
  };
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
              className="inline-flex items-center px-2 py-0.5 rounded text-sm"
              style={getColorStyles(option.color)}
            >
              {option.label}
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
                      className="inline-flex items-center px-2 py-0.5 rounded text-sm"
                      style={getColorStyles(option.color)}
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
                      className="inline-flex items-center px-2 py-0.5 rounded text-sm"
                      style={getColorStyles(option.color)}
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
