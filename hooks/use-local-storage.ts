'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * localStorageと同期するカスタムフック
 *
 * @param key - localStorageのキー
 * @param initialValue - 初期値
 * @returns [value, setValue, removeValue] - 値、セッター関数、削除関数のタプル
 *
 * @example
 * ```tsx
 * const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // localStorageから値を読み込むヘルパー関数
  const readValue = useCallback((): T => {
    // SSR時は初期値を返す
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`localStorageキー "${key}" の読み込みエラー:`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // 値をlocalStorageに保存
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const newValue = value instanceof Function ? value(prev) : value;
          window.localStorage.setItem(key, JSON.stringify(newValue));
          return newValue;
        });
      } catch (error) {
        console.warn(`localStorageキー "${key}" の保存エラー:`, error);
      }
    },
    [key]
  );

  // 値をlocalStorageから削除
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`localStorageキー "${key}" の削除エラー:`, error);
    }
  }, [key, initialValue]);

  // 他のタブでの変更を検知して同期
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window.localStorage) {
        setStoredValue(
          event.newValue ? JSON.parse(event.newValue) : initialValue
        );
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
