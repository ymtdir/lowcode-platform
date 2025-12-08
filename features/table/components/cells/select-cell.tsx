'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { SelectOption } from '@/features/column/types';

type SelectCellProps = {
  value: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  options: SelectOption[];
  allowMultiple?: boolean;
  readOnly?: boolean;
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
 * セレクトセルコンポーネント
 */
export function SelectCell({
  value,
  onChange,
  options,
  allowMultiple = false,
  readOnly = false,
}: SelectCellProps) {
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

  // 選択中のオプションを取得
  const selectedOptions = (() => {
    if (!value) return [];
    const ids = Array.isArray(value) ? value : [value];
    return ids
      .map((id) => options.find((opt) => opt.id === id))
      .filter((opt) => opt !== undefined);
  })();

  // 単一選択時の処理
  const handleSelectSingle = (optionId: string | null) => {
    onChange(optionId);
    setIsOpen(false);
  };

  // 複数選択時の処理
  const handleToggleMultiple = (optionId: string) => {
    const currentIds = Array.isArray(value) ? value : value ? [value] : [];
    if (currentIds.includes(optionId)) {
      const newIds = currentIds.filter((id) => id !== optionId);
      onChange(newIds.length > 0 ? newIds : null);
    } else {
      onChange([...currentIds, optionId]);
    }
  };

  // 個別削除（複数選択時）
  const handleRemove = (optionId: string) => {
    if (allowMultiple && Array.isArray(value)) {
      const newIds = value.filter((id) => id !== optionId);
      onChange(newIds.length > 0 ? newIds : null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  if (readOnly) {
    return (
      <div className="min-h-[32px] px-2 py-1 flex items-center gap-1.5 flex-wrap w-full">
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
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onKeyDown={handleKeyDown}
    >
      <div
        className="cursor-pointer min-h-[32px] px-2 py-1 hover:bg-muted/50 rounded flex items-center gap-1.5 flex-wrap w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option) => (
            <span
              key={option.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm group/option"
              style={getColorStyles(option.color)}
            >
              {option.label}
              {allowMultiple && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(option.id);
                  }}
                  className="opacity-70 hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              )}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[150px] bg-popover border rounded-md shadow-lg z-50">
          <div className="py-1">
            {!allowMultiple && (
              <div
                className="px-3 py-1.5 hover:bg-muted cursor-pointer text-sm text-muted-foreground"
                onClick={() => handleSelectSingle(null)}
              >
                選択なし
              </div>
            )}
            {options.map((option) => {
              const isSelected =
                Array.isArray(value) && value.includes(option.id);

              if (allowMultiple) {
                return (
                  <div
                    key={option.id}
                    className="px-3 py-1.5 hover:bg-muted cursor-pointer flex items-center gap-2"
                    onClick={() => handleToggleMultiple(option.id)}
                  >
                    <Checkbox checked={isSelected} />
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-sm"
                      style={getColorStyles(option.color)}
                    >
                      {option.label}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={option.id}
                  className="px-3 py-1.5 hover:bg-muted cursor-pointer"
                  onClick={() => handleSelectSingle(option.id)}
                >
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-sm"
                    style={getColorStyles(option.color)}
                  >
                    {option.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
