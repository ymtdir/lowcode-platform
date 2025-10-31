'use client';

import { ChevronRight } from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useColor } from '../providers/color-provider';
import type { Color } from '../types';

export function ColorSelector() {
  const { color, setColor } = useColor();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  const colors = [
    {
      value: 'neutral',
      label: 'ニュートラル',
      light: 'oklch(0.449 0 0)',
      dark: 'oklch(0.370 0 0)',
    },
    {
      value: 'stone',
      label: 'ストーン',
      light: 'oklch(0.505 0.016 41.488)',
      dark: 'oklch(0.412 0.015 43.060)',
    },
    {
      value: 'zinc',
      label: 'ジンク',
      light: 'oklch(0.112 0.007 274.675)',
      dark: 'oklch(0.3808 0.0104 296.3)',
    },
    {
      value: 'gray',
      label: 'グレー',
      light: 'oklch(0.485 0.027 249.973)',
      dark: 'oklch(0.430 0.033 251.789)',
    },
    {
      value: 'slate',
      label: 'スレート',
      light: 'oklch(0.505 0.053 259.032)',
      dark: 'oklch(0.412 0.033 257.653)',
    },
    {
      value: 'red',
      label: 'レッド',
      light: 'oklch(0.573 0.208 29.816)',
      dark: 'oklch(0.573 0.208 29.816)',
    },
    {
      value: 'rose',
      label: 'ローズ',
      light: 'oklch(0.613 0.264 29.351)',
      dark: 'oklch(0.575 0.224 29.807)',
    },
    {
      value: 'orange',
      label: 'オレンジ',
      light: 'oklch(0.697 0.169 64.085)',
      dark: 'oklch(0.669 0.170 52.887)',
    },
    {
      value: 'green',
      label: 'グリーン',
      light: 'oklch(0.609 0.170 142.147)',
      dark: 'oklch(0.724 0.176 142.164)',
    },
    {
      value: 'blue',
      label: 'ブルー',
      light: 'oklch(0.536 0.176 261.267)',
      dark: 'oklch(0.575 0.178 266.307)',
    },
    {
      value: 'yellow',
      label: 'イエロー',
      light: 'oklch(0.852 0.165 89.262)',
      dark: 'oklch(0.852 0.165 89.262)',
    },
    {
      value: 'violet',
      label: 'バイオレット',
      light: 'oklch(0.404 0.177 301.996)',
      dark: 'oklch(0.354 0.177 301.761)',
    },
  ] as const;

  const getPreviewColor = (colorItem: (typeof colors)[number]) => {
    return isDark ? colorItem.dark : colorItem.light;
  };

  const currentColor = colors.find((c) => c.value === color);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center bg-card gap-2 text-sm ">
        <div
          className="h-3 w-3 rounded-full"
          style={{
            backgroundColor: currentColor ? getPreviewColor(currentColor) : '',
          }}
        />
        <span>{currentColor?.label ?? 'ニュートラル'}</span>
        <ChevronRight className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right">
        {colors.map((colorItem) => (
          <DropdownMenuItem
            key={colorItem.value}
            onClick={() => setColor(colorItem.value as Color)}
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: getPreviewColor(colorItem) }}
            />
            <span>{colorItem.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
