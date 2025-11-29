'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  DatePrecision,
  DateFormatType,
} from '../../types/column';

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
  showWeekday?: boolean;
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
];

/**
 * DATE用の設定エディターコンポーネント
 */
export function DateConfigEditor({
  config,
  onChange,
}: DateConfigEditorProps) {
  const [localConfig, setLocalConfig] = useState<DateConfig>(config || {});

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
        <Label htmlFor="date-precision">精度</Label>
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
        <Label htmlFor="date-default">デフォルト値（相対日数）</Label>
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
        <p className="text-xs text-muted-foreground">
          0=今日、正数=未来（例: 7=7日後）、負数=過去（例: -7=7日前）
        </p>
      </div>

      {/* 最小値・最大値 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="date-min">最小日付</Label>
          <Input
            id="date-min"
            type="date"
            value={localConfig.min ?? ''}
            onChange={(e) => handleDateInput('min', e.target.value)}
            placeholder="制限なし"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="date-max">最大日付</Label>
          <Input
            id="date-max"
            type="date"
            value={localConfig.max ?? ''}
            onChange={(e) => handleDateInput('max', e.target.value)}
            placeholder="制限なし"
          />
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

      {/* 曜日表示 */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="date-show-weekday"
          checked={localConfig.showWeekday || false}
          onCheckedChange={(checked) =>
            handleChange({ showWeekday: checked === true })
          }
        />
        <label
          htmlFor="date-show-weekday"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          曜日を表示（例: 2025/01/15（水））
        </label>
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
