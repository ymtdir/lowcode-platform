'use client';

import { ChevronDown, MonitorSmartphone, Moon, Sun } from 'lucide-react';
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
        <CurrentIcon className="h-4 w-4" />
        <span>{currentTheme?.label ?? 'システム'}</span>
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom">
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
