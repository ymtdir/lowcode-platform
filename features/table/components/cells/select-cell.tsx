'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
} from '@/components/ui/multi-select';
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
  const [open, setOpen] = useState(false);
  // 複数選択用のローカルステート（常に呼び出す）
  const [localValue, setLocalValue] = useState<string[]>(
    Array.isArray(value) ? value : []
  );

  // 選択中のオプションを取得
  const selectedOptions = (() => {
    if (!value) return [];
    const ids = Array.isArray(value) ? value : [value];
    return ids
      .map((id) => options.find((opt) => opt.id === id))
      .filter((opt) => opt !== undefined);
  })();

  if (readOnly) {
    return (
      <div className="h-8 w-full px-2 flex items-center gap-1.5 flex-wrap">
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

  // 複数選択
  if (allowMultiple) {
    // メニューが開いたときに値を同期
    const handleOpenChange = (newOpen: boolean) => {
      if (newOpen) {
        setLocalValue(Array.isArray(value) ? value : []);
      } else {
        // 閉じたときに変更があれば保存
        const currentIds = Array.isArray(value) ? value : [];
        const hasChanges =
          localValue.length !== currentIds.length ||
          localValue.some((id) => !currentIds.includes(id));

        if (hasChanges) {
          onChange(localValue.length > 0 ? localValue : null);
        }
      }
      setOpen(newOpen);
    };

    const handleToggle = (optionId: string) => {
      setLocalValue((prev) => {
        if (prev.includes(optionId)) {
          return prev.filter((id) => id !== optionId);
        } else {
          return [...prev, optionId];
        }
      });
    };

    // 表示用のオプション（localValueに基づく）
    const displayOptions = localValue
      .map((id) => options.find((opt) => opt.id === id))
      .filter((opt) => opt !== undefined);

    return (
      <MultiSelect open={open} onOpenChange={handleOpenChange}>
        <MultiSelectTrigger className="h-8 w-full px-2 flex items-center justify-start gap-1.5 flex-wrap hover:bg-muted/50 bg-transparent dark:bg-transparent dark:hover:bg-muted/50 border-0 rounded-none shadow-none focus-visible:ring-0 [&>svg]:hidden">
          {displayOptions.length > 0 ? (
            displayOptions.map((option) => (
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
        </MultiSelectTrigger>
        <MultiSelectContent>
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              選択肢がありません
            </div>
          ) : (
            options.map((option) => (
              <MultiSelectItem
                key={option.id}
                selected={localValue.includes(option.id)}
                onClick={() => handleToggle(option.id)}
              >
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-sm"
                  style={getColorStyles(option.color)}
                >
                  {option.label}
                </span>
              </MultiSelectItem>
            ))
          )}
        </MultiSelectContent>
      </MultiSelect>
    );
  }

  // 単一選択
  const handleSelect = (optionId: string) => {
    if (optionId === '__clear__') {
      onChange(null);
    } else {
      onChange(optionId);
    }
    setOpen(false);
  };

  return (
    <Select
      value={(value as string) || undefined}
      onValueChange={handleSelect}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className="h-8 w-full px-2 flex items-center hover:bg-muted/50 bg-transparent dark:bg-transparent dark:hover:bg-muted/50 border-0 rounded-none shadow-none focus-visible:ring-0 [&>svg]:hidden">
        {selectedOptions.length > 0 ? (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-sm"
            style={getColorStyles(selectedOptions[0].color)}
          >
            {selectedOptions[0].label}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            選択肢がありません
          </div>
        ) : (
          <>
            <SelectItem value="__clear__">
              <span className="text-muted-foreground">選択なし</span>
            </SelectItem>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-sm"
                  style={getColorStyles(option.color)}
                >
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
