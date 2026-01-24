'use client';

import { useEffect } from 'react';
import type { Script } from '@/features/script';

type ScriptInjectorProps = {
  scripts?: Script[];
};

/**
 * スクリプト注入コンポーネント
 * 取得したJavaScriptをページに適用する
 * グローバルスクリプト・テーブルスクリプト両方で使用可能
 *
 * useEffectを使用してクライアントサイドでスクリプトを実行する
 * これにより、Server ComponentからでもClient Componentからでも
 * 正しくスクリプトが実行される
 */
export function ScriptInjector({ scripts = [] }: ScriptInjectorProps) {
  useEffect(() => {
    if (scripts.length === 0) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    const maxAttempts = 200; // 50ms * 200 = 約10秒

    const combinedScript = scripts.map((script) => script.content).join('\n');

    function executeScripts() {
      try {
        const fn = new Function(combinedScript);
        fn();
      } catch (error) {
        console.error('スクリプト実行エラー:', error);
      }
    }

    function waitForReady() {
      // jQueryが読み込まれているか確認
      if (
        typeof window !== 'undefined' &&
        typeof (window as { jQuery?: unknown }).jQuery === 'undefined'
      ) {
        if (!cancelled && attempts++ < maxAttempts) {
          timeoutId = setTimeout(waitForReady, 50);
        } else if (!cancelled) {
          console.warn(
            'jQueryが読み込めなかったためスクリプト実行を中止しました'
          );
        }
        return;
      }

      // Reactのハイドレーション完了を待つ（h1等の要素が存在するか確認）
      // requestIdleCallbackまたはsetTimeoutで次のアイドル時に実行
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(executeScripts);
      } else {
        timeoutId = setTimeout(executeScripts, 100);
      }
    }

    // マウント時にスクリプトを実行
    waitForReady();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [scripts]);

  return null;
}
