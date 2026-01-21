'use client';

import { ChevronRight, Moon, Sun, SunMoon, MoonStar } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useEditorTheme } from '../providers/editor-theme-provider';
import type { EditorTheme } from '../types';

/**
 * エディタテーマ選択コンポーネント
 */
export function EditorThemeSelector() {
  const { editorTheme, setEditorTheme } = useEditorTheme();

  const themes = [
    { value: 'vs', label: 'vs-light', icon: Sun },
    { value: 'vs-dark', label: 'vs-dark', icon: Moon },
    { value: 'hc-light', label: 'hc-light', icon: SunMoon },
    { value: 'hc-black', label: 'hc-black', icon: MoonStar },
  ] as const;

  const currentTheme = themes.find((t) => t.value === editorTheme);
  const CurrentIcon = currentTheme?.icon ?? Moon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center bg-card gap-2 text-sm ">
        <CurrentIcon className="h-4 w-4" />
        <span>{currentTheme?.label ?? 'vs-dark'}</span>
        <ChevronRight />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right">
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setEditorTheme(value as EditorTheme)}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
