'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePickerCalendar } from '@/components/ui/date-picker-calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DateCellProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  min?: string;
  max?: string;
};

/**
 * 日付セルコンポーネント
 */
export function DateCell({ value, onChange, min, max }: DateCellProps) {
  const [open, setOpen] = useState(false);

  const date = value ? new Date(value) : undefined;
  const minDate = min ? new Date(min) : undefined;
  const maxDate = max ? new Date(max) : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // YYYY-MM-DD形式で保存
      const formatted = format(selectedDate, 'yyyy-MM-dd');
      onChange(formatted);
    } else {
      onChange(null);
    }
    setOpen(false);
  };

  const formatDisplayDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'yyyy/MM/dd', { locale: ja });
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
          <CalendarIcon className="mr-2 h-4 w-4" />
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
