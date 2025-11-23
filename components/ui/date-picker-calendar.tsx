'use client';

import { Calendar } from '@/components/ui/calendar';

type DatePickerCalendarProps = {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
};

/**
 * 日付ピッカー用カレンダーコンポーネント
 */
export function DatePickerCalendar({
  selected,
  onSelect,
  minDate,
  maxDate,
}: DatePickerCalendarProps) {
  // ドロップダウンの年範囲を設定（2025年〜現在+10年）
  const startMonth = new Date(2025, 0);
  const endMonth = new Date(new Date().getFullYear() + 10, 11);

  return (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={onSelect}
      className="rounded-md border shadow-sm"
      captionLayout="dropdown"
      startMonth={startMonth}
      endMonth={endMonth}
      disabled={(date) => {
        if (minDate && date < minDate) return true;
        if (maxDate && date > maxDate) return true;
        return false;
      }}
    />
  );
}
