'use client';

import { IconPicker, IconName } from '@/components/ui/icon-picker';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type ItemIconPickerProps = {
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  disabled?: boolean;
};

/**
 * アイテム用アイコンピッカーコンポーネント
 *
 * IconPickerをラップして、アイテムのアイコン選択に特化したUIを提供
 * - アイコン選択
 * - アイコンクリア（デフォルトに戻す）
 *
 * @example
 * ```tsx
 * <ItemIconPicker
 *   value={item.icon}
 *   onValueChange={(iconName) => handleIconChange(iconName)}
 * />
 * ```
 */
export function ItemIconPicker({
  value,
  onValueChange,
  disabled = false,
}: ItemIconPickerProps) {
  const handleClear = () => {
    onValueChange?.(null);
  };

  return (
    <div className="flex items-center gap-2">
      <IconPicker
        value={value as IconName | undefined}
        onValueChange={(iconName) => onValueChange?.(iconName)}
        searchPlaceholder="アイコンを検索..."
        triggerPlaceholder="アイコンを選択"
        disabled={disabled}
      >
        <Button variant="outline" disabled={disabled}>
          {value ? (
            <>
              <span className="mr-2">{value}</span>
            </>
          ) : (
            'アイコンを選択'
          )}
        </Button>
      </IconPicker>

      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          disabled={disabled}
          title="デフォルトに戻す"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
