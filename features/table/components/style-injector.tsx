'use client';

import type { Style } from '@/features/style';

/**
 * StyleInjectorのProps型
 */
type StyleInjectorProps = {
  styles: Style[];
};

/**
 * スタイル注入コンポーネント
 * 取得したCSSをページに適用する
 */
export function StyleInjector({ styles }: StyleInjectorProps) {
  if (styles.length === 0) {
    return null;
  }

  // 全スタイルのcontentを結合
  const combinedCss = styles.map((style) => style.content).join('\n');

  return <style dangerouslySetInnerHTML={{ __html: combinedCss }} />;
}
