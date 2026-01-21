import type { Style } from '../types';
import type { getStyles } from './get-styles';

/**
 * getStylesの結果からstyles配列を取り出すヘルパー
 * エラー時は空配列を返す
 */
export function extractStyles(
  result: Awaited<ReturnType<typeof getStyles>>
): Style[] {
  return 'success' in result && result.success ? result.styles : [];
}
