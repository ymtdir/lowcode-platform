'use client';

import * as React from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Color } from '../types';

/**
 * カラーコンテキストの型
 */
type ColorContextType = {
  color: Color;
  setColor: (color: Color) => void;
};

const ColorContext = React.createContext<ColorContextType | undefined>(
  undefined
);

const COLOR_STORAGE_KEY = 'app-color';
const DEFAULT_COLOR: Color = 'neutral';

/**
 * カラープロバイダーコンポーネント
 */
export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useLocalStorage<Color>(
    COLOR_STORAGE_KEY,
    DEFAULT_COLOR
  );
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isMounted) return;
    document.documentElement.setAttribute('data-color', color);
  }, [color, isMounted]);

  // Context value をメモ化（不要な再レンダリング防止）
  const value = React.useMemo(() => ({ color, setColor }), [color, setColor]);

  if (!isMounted) return null;

  return (
    <ColorContext.Provider value={value}>{children}</ColorContext.Provider>
  );
}

/**
 * カラーコンテキストを使用するカスタムフック
 */
export function useColor() {
  const context = React.useContext(ColorContext);
  if (!context) {
    throw new Error('useColorはColorProvider内で使用する必要があります');
  }
  return context;
}
