'use client';

import * as React from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { EditorTheme } from '../types';

/**
 * エディタテーマコンテキストの型
 */
type EditorThemeContextType = {
  editorTheme: EditorTheme;
  setEditorTheme: (theme: EditorTheme) => void;
};

const EditorThemeContext = React.createContext<
  EditorThemeContextType | undefined
>(undefined);

const EDITOR_THEME_STORAGE_KEY = 'editor-theme';
const DEFAULT_EDITOR_THEME: EditorTheme = 'vs-dark';

/**
 * エディタテーマプロバイダーコンポーネント
 */
export function EditorThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [editorTheme, setEditorTheme] = useLocalStorage<EditorTheme>(
    EDITOR_THEME_STORAGE_KEY,
    DEFAULT_EDITOR_THEME
  );
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const value = React.useMemo(
    () => ({ editorTheme, setEditorTheme }),
    [editorTheme, setEditorTheme]
  );

  if (!isMounted) return null;

  return (
    <EditorThemeContext.Provider value={value}>
      {children}
    </EditorThemeContext.Provider>
  );
}

/**
 * エディタテーマコンテキストを使用するカスタムフック
 */
export function useEditorTheme() {
  const context = React.useContext(EditorThemeContext);
  if (!context) {
    throw new Error(
      'useEditorThemeはEditorThemeProvider内で使用する必要があります'
    );
  }
  return context;
}
