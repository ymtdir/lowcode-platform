import type { Style } from '@/features/style';

type StyleInjectorProps = {
  styles?: Style[];
};

/**
 * スタイル注入コンポーネント
 * 取得したCSSをページに適用する
 * グローバルスタイル・テーブルスタイル両方で使用可能
 */
export function StyleInjector({ styles = [] }: StyleInjectorProps) {
  if (styles.length === 0) {
    return null;
  }

  const combinedCss = styles.map((style) => style.content).join('\n');

  return <style>{combinedCss}</style>;
}
