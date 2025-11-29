'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { DatePickerCalendar } from '@/components/ui/date-picker-calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { DatePrecision } from '@/features/column/types/column';

type DateCellProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  precision?: DatePrecision;
  min?: string;
  max?: string;
  placeholder?: string;
};

/**
 * 精度に応じたフォーマット文字列を取得
 */
function getFormatString(precision?: DatePrecision): string {
  const formats: Record<DatePrecision, string> = {
    year: 'yyyy',
    month: 'yyyy/MM',
    day: 'yyyy/MM/dd',
    day_weekday: 'yyyy/MM/dd（E）',
  };

  return formats[precision || 'day'];
}

/**
 * 精度に応じた保存形式を取得
 * day_weekday は day と同じフォーマットで保存
 */
function getSaveFormat(precision?: DatePrecision): string {
  const formats: Record<DatePrecision, string> = {
    year: 'yyyy',
    month: 'yyyy-MM',
    day: 'yyyy-MM-dd',
    day_weekday: 'yyyy-MM-dd',
  };

  return formats[precision || 'day'];
}

/**
 * 日付セルコンポーネント
 */
export function DateCell({
  value,
  onChange,
  precision = 'day',
  min,
  max,
  placeholder = '-',
}: DateCellProps) {
  const [open, setOpen] = useState(false);

  const date = value ? new Date(value) : undefined;
  const minDate = min ? new Date(min) : undefined;
  const maxDate = max ? new Date(max) : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const saveFormat = getSaveFormat(precision);
      const formatted = format(selectedDate, saveFormat);
      onChange(formatted);
    } else {
      onChange(null);
    }
    setOpen(false);
  };

  const formatDisplayDate = (dateStr: string | null) => {
    if (!dateStr) return placeholder;
    try {
      const displayFormat = getFormatString(precision);
      return format(new Date(dateStr), displayFormat, { locale: ja });
    } catch {
      return dateStr;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'h-8 w-full justify-start text-left font-normal px-2 rounded-none hover:bg-muted/50',
            !value && 'text-muted-foreground'
          )}
        >
          {formatDisplayDate(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DatePickerCalendar
          selected={date}
          onSelect={handleSelect}
          minDate={minDate}
          maxDate={maxDate}
        />
      </PopoverContent>
    </Popover>
  );
}
