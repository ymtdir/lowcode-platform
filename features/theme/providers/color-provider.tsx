'use client';

import * as React from 'react';
import type { Color } from '../types';

type ColorContextType = {
  color: Color;
  setColor: (color: Color) => void;
};

const ColorContext = React.createContext<ColorContextType | undefined>(
  undefined
);

const COLOR_STORAGE_KEY = 'app-color';
const DEFAULT_COLOR: Color = 'neutral';

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [color, setColorState] = React.useState<Color>(DEFAULT_COLOR);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    const savedColor = localStorage.getItem(COLOR_STORAGE_KEY) as Color | null;
    if (savedColor) setColorState(savedColor);
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isMounted) return;
    document.documentElement.setAttribute('data-color', color);
    localStorage.setItem(COLOR_STORAGE_KEY, color);
  }, [color, isMounted]);

  if (!isMounted) return null;

  return (
    <ColorContext.Provider value={{ color, setColor: setColorState }}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColor() {
  const context = React.useContext(ColorContext);
  if (!context) {
    throw new Error('useColor must be used within ColorProvider');
  }
  return context;
}
