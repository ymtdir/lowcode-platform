import { getStyles, extractStyles } from '@/features/style';
import { StyleInjector } from './style-injector';

/**
 * グローバルスタイル注入コンポーネント
 * アプリケーション全体に適用されるCSSスタイルを注入する
 */
export async function GlobalStyleInjector() {
  const stylesResult = await getStyles(null);
  const styles = extractStyles(stylesResult);

  return <StyleInjector styles={styles} />;
}
