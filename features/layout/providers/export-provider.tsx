'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from 'react';

type ExportContextType = {
  exportFn: (() => void) | null;
  setExportFn: (fn: (() => void) | null) => void;
};

const ExportContext = createContext<ExportContextType | undefined>(undefined);

/**
 * エクスポート機能用のContextプロバイダー
 * app/(protected)/layout.tsxで全体をラップして使用
 */
export function ExportProvider({ children }: { children: ReactNode }) {
  const [exportFn, setExportFn] = useState<(() => void) | null>(null);

  const value = useMemo(() => ({ exportFn, setExportFn }), [exportFn]);

  return (
    <ExportContext.Provider value={value}>{children}</ExportContext.Provider>
  );
}

/**
 * エクスポートコンテキストを使用するフック
 */
export function useExport() {
  const context = useContext(ExportContext);
  if (!context) {
    throw new Error('useExport は ExportProvider の配下で使用してください。');
  }
  return context;
}
