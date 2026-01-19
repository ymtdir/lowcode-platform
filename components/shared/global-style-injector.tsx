import { getStyles } from '@/features/style';
import { StyleInjector } from './style-injector';

/**
 * グローバルスタイル注入コンポーネント
 * アプリケーション全体に適用されるCSSスタイルを注入する
 */
export async function GlobalStyleInjector() {
  const styles = await getStyles(null);

  return <StyleInjector styles={styles} />;
}
