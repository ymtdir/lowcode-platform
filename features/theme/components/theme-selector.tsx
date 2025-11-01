'use client';

import { ChevronRight, MonitorSmartphone, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'system', label: 'システム', icon: MonitorSmartphone },
    { value: 'light', label: 'ライト', icon: Sun },
    { value: 'dark', label: 'ダーク', icon: Moon },
  ] as const;

  const currentTheme = themes.find((t) => t.value === theme);
  const CurrentIcon = currentTheme?.icon ?? MonitorSmartphone;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center bg-card gap-2 text-sm ">
        <CurrentIcon />
        <span>{currentTheme?.label ?? 'システム'}</span>
        <ChevronRight />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right">
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
            <Icon />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
