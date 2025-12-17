'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

type DatePreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'custom';

/**
 * 日付フィルタの値の型
 */
export type DateFilterValue = {
  preset: DatePreset;
  startDate: Date | null;
  endDate: Date | null;
};

type DateFilterProps = {
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
};

/**
 * 日付フィルタのプリセット一覧
 */
const PRESETS = [
  { value: 'today', label: '今日' },
  { value: 'this_week', label: '今週' },
  { value: 'this_month', label: '今月' },
  { value: 'last_month', label: '先月' },
  { value: 'custom', label: 'カスタム' },
] as const;

/**
 * プリセットに基づいて日付範囲を取得する
 */
function getPresetDates(preset: DatePreset): [Date | null, Date | null] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (preset) {
    case 'today':
      return [today, today];
    case 'this_week': {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return [start, end];
    }
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return [start, end];
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return [start, end];
    }
    case 'custom':
      return [null, null];
    default:
      return [null, null];
  }
}

/**
 * 日付カラム用のフィルタコンポーネント
 */
export function DateFilter({ value, onChange }: DateFilterProps) {
  const [preset, setPreset] = useState<DatePreset>(value.preset || 'custom');
  const [startDate, setStartDate] = useState<Date | undefined>(
    value.startDate || undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    value.endDate || undefined
  );

  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);
    const [start, end] = getPresetDates(newPreset);
    setStartDate(start || undefined);
    setEndDate(end || undefined);
    onChange({
      preset: newPreset,
      startDate: start,
      endDate: end,
    });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    onChange({
      preset: 'custom',
      startDate: date || null,
      endDate: endDate || null,
    });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    onChange({
      preset: 'custom',
      startDate: startDate || null,
      endDate: date || null,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="h-8 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {preset === 'custom' && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-8 w-full justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, 'yyyy/MM/dd', { locale: ja })
                ) : (
                  <span>開始日</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateChange}
                locale={ja}
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-sm">～</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-8 w-full justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? (
                  format(endDate, 'yyyy/MM/dd', { locale: ja })
                ) : (
                  <span>終了日</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateChange}
                locale={ja}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
