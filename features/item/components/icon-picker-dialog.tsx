'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconPicker } from '@/components/ui/icon-picker';
import { Button } from '@/components/ui/button';
import type { IconName } from 'lucide-react/dynamic';

/**
 * IconPickerDialogのProps型
 */
type IconPickerDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (iconName: string | null) => void;
  currentIcon?: string | null;
};

/**
 * アイコンピッカーダイアログコンポーネント
 *
 * Lucideアイコンライブラリから任意のアイコンを選択できるダイアログ
 */
export function IconPickerDialog({
  open,
  onOpenChange,
  onSelect,
  currentIcon,
}: IconPickerDialogProps) {
  // IconPickerはケバブケースを期待するため、DBのパスカルケースの値をケバブケースに変換
  // 例: "AlarmClock" -> "alarm-clock", "Accessibility" -> "accessibility"
  const convertToKebabCase = (str: string | null | undefined) => {
    if (!str) return null;
    return str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
  };

  const [selectedIcon, setSelectedIcon] = useState<string | null>(
    convertToKebabCase(currentIcon)
  );

  const handleConfirm = () => {
    onSelect?.(selectedIcon);
    onOpenChange?.(false);
  };

  const handleClear = () => {
    setSelectedIcon(null);
    onSelect?.(null);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>アイコンを選択</DialogTitle>
        </DialogHeader>

        <IconPicker
          value={(selectedIcon ?? undefined) as IconName | undefined}
          onValueChange={(value) => setSelectedIcon(value ?? null)}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClear}>
            リセット
          </Button>
          <Button onClick={handleConfirm}>決定</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
