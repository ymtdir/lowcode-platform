'use client';

import { useState, useEffect } from 'react';
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

/**
 * NUMBER設定の型
 */
type NumberConfig = {
  min?: number;
  max?: number;
  unit?: string;
  unitPosition?: 'prefix' | 'suffix';
  thousandSeparator?: boolean;
  defaultValue?: number;
  step?: number;
};

/**
 * NumberConfigEditorのProps型
 */
type NumberConfigEditorProps = {
  config?: NumberConfig;
  onChange: (config: NumberConfig) => void;
};

/**
 * NUMBER用の設定エディターコンポーネント
 */
export function NumberConfigEditor({
  config,
  onChange,
}: NumberConfigEditorProps) {
  const [localConfig, setLocalConfig] = useState<NumberConfig>(config || {});

  // 親から受け取ったconfigが変更されたらローカルステートを更新
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleChange = (updates: Partial<NumberConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const handleNumberInput = (field: keyof NumberConfig, value: string) => {
    if (value === '') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [field]: _, ...rest } = localConfig;
      setLocalConfig(rest);
      onChange(rest);
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      handleChange({ [field]: numValue });
    }
  };

  return (
    <div className="space-y-4">
      {/* 最小値・最大値 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="number-min">最小値</Label>
          <Input
            id="number-min"
            type="number"
            value={localConfig.min ?? ''}
            onChange={(e) => handleNumberInput('min', e.target.value)}
            placeholder="制限なし"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="number-max">最大値</Label>
          <Input
            id="number-max"
            type="number"
            value={localConfig.max ?? ''}
            onChange={(e) => handleNumberInput('max', e.target.value)}
            placeholder="制限なし"
          />
        </div>
      </div>

      {/* ステップ値 */}
      <div className="grid gap-2">
        <Label htmlFor="number-step">ステップ値</Label>
        <Input
          id="number-step"
          type="number"
          min="0"
          step="any"
          value={localConfig.step ?? ''}
          onChange={(e) => handleNumberInput('step', e.target.value)}
          placeholder="1"
        />
      </div>

      {/* デフォルト値 */}
      <div className="grid gap-2">
        <Label htmlFor="number-default">デフォルト値</Label>
        <Input
          id="number-default"
          type="number"
          value={localConfig.defaultValue ?? ''}
          onChange={(e) => handleNumberInput('defaultValue', e.target.value)}
          placeholder="なし"
        />
      </div>

      {/* 単位設定 */}
      <div className="grid gap-2">
        <Label htmlFor="number-unit">単位</Label>
        <div className="flex gap-2">
          <Select
            value={localConfig.unitPosition || 'suffix'}
            onValueChange={(value) =>
              handleChange({
                unitPosition: value as 'prefix' | 'suffix',
              })
            }
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prefix">前</SelectItem>
              <SelectItem value="suffix">後</SelectItem>
            </SelectContent>
          </Select>
          <Input
            id="number-unit"
            value={localConfig.unit ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { unit: _, unitPosition: __, ...rest } = localConfig;
                setLocalConfig(rest);
                onChange(rest);
              } else {
                handleChange({ unit: value });
              }
            }}
            placeholder="円、個、kg など"
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          表示専用（例: ¥100、100円）
        </p>
      </div>

      {/* 千の位区切り */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="number-thousand-separator"
          checked={localConfig.thousandSeparator || false}
          onCheckedChange={(checked) =>
            handleChange({ thousandSeparator: checked === true })
          }
        />
        <label
          htmlFor="number-thousand-separator"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          千の位区切りを表示（例: 1,000）
        </label>
      </div>
    </div>
  );
}
