'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DatePickerCalendar } from '@/components/ui/date-picker-calendar';
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
import type { DatePrecision, DateFormatType } from '../../types/column';

/**
 * DATE設定の型
 */
type DateConfig = {
  precision?: DatePrecision;
  format?: DateFormatType;
  defaultValue?: number; // 相対日数: 0=今日、正数=未来、負数=過去
  min?: string;
  max?: string;
  allowPast?: boolean;
  allowFuture?: boolean;
  placeholder?: string;
};

/**
 * DateConfigEditorのProps型
 */
type DateConfigEditorProps = {
  config?: DateConfig;
  onChange: (config: DateConfig) => void;
};

/**
 * 精度の選択肢
 */
const PRECISION_OPTIONS: { value: DatePrecision; label: string }[] = [
  { value: 'year', label: '年のみ（YYYY）' },
  { value: 'month', label: '年月（YYYY-MM）' },
  { value: 'day', label: '年月日（YYYY-MM-DD）' },
  { value: 'day_weekday', label: '年月日（曜日）（YYYY-MM-DD（曜日））' },
];

/**
 * DATE用の設定エディターコンポーネント
 */
export function DateConfigEditor({ config, onChange }: DateConfigEditorProps) {
  const [localConfig, setLocalConfig] = useState<DateConfig>(config || {});
  const [minOpen, setMinOpen] = useState(false);
  const [maxOpen, setMaxOpen] = useState(false);

  const handleChange = (updates: Partial<DateConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const handleDateInput = (field: 'min' | 'max', value: string) => {
    if (value === '') {
      const newConfig = { ...localConfig };
      delete newConfig[field];
      setLocalConfig(newConfig);
      onChange(newConfig);
      return;
    }
    handleChange({ [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* 精度設定 */}
      <div className="grid gap-2">
        <Label htmlFor="date-precision">表示形式</Label>
        <Select
          value={localConfig.precision || 'day'}
          onValueChange={(value) =>
            handleChange({ precision: value as DatePrecision })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRECISION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* デフォルト値（相対日数） */}
      <div className="grid gap-2">
        <Label htmlFor="date-default">デフォルト値</Label>
        <Input
          id="date-default"
          type="number"
          value={localConfig.defaultValue ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              const newConfig = { ...localConfig };
              delete newConfig.defaultValue;
              setLocalConfig(newConfig);
              onChange(newConfig);
            } else {
              const numValue = parseInt(value, 10);
              if (!isNaN(numValue)) {
                handleChange({ defaultValue: numValue });
              }
            }
          }}
          placeholder="0（今日）"
        />
      </div>

      {/* 最小値・最大値 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="date-min">最小日付</Label>
          <Popover open={minOpen} onOpenChange={setMinOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !localConfig.min && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localConfig.min || '制限なし'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <DatePickerCalendar
                selected={
                  localConfig.min ? new Date(localConfig.min) : undefined
                }
                onSelect={(date) => {
                  if (date) {
                    handleDateInput('min', format(date, 'yyyy-MM-dd'));
                  } else {
                    handleDateInput('min', '');
                  }
                  setMinOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="date-max">最大日付</Label>
          <Popover open={maxOpen} onOpenChange={setMaxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !localConfig.max && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localConfig.max || '制限なし'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <DatePickerCalendar
                selected={
                  localConfig.max ? new Date(localConfig.max) : undefined
                }
                onSelect={(date) => {
                  if (date) {
                    handleDateInput('max', format(date, 'yyyy-MM-dd'));
                  } else {
                    handleDateInput('max', '');
                  }
                  setMaxOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 過去/未来の許可 */}
      <div className="grid gap-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="date-allow-past"
            checked={localConfig.allowPast !== false}
            onCheckedChange={(checked) =>
              handleChange({ allowPast: checked === true })
            }
          />
          <label
            htmlFor="date-allow-past"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            過去日付を許可
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="date-allow-future"
            checked={localConfig.allowFuture !== false}
            onCheckedChange={(checked) =>
              handleChange({ allowFuture: checked === true })
            }
          />
          <label
            htmlFor="date-allow-future"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            未来日付を許可
          </label>
        </div>
      </div>

      {/* プレースホルダー */}
      <div className="grid gap-2">
        <Label htmlFor="date-placeholder">プレースホルダー</Label>
        <Input
          id="date-placeholder"
          value={localConfig.placeholder ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              const newConfig = { ...localConfig };
              delete newConfig.placeholder;
              setLocalConfig(newConfig);
              onChange(newConfig);
            } else {
              handleChange({ placeholder: value });
            }
          }}
          placeholder="日付を選択"
        />
      </div>
    </div>
  );
}
