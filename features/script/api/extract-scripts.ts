import type { Script } from '../types';
import type { getScripts } from './get-scripts';

/**
 * getScriptsの結果からscripts配列を取り出すヘルパー
 * エラー時は空配列を返す
 */
export function extractScripts(
  result: Awaited<ReturnType<typeof getScripts>>
): Script[] {
  return 'success' in result && result.success ? result.scripts : [];
}
