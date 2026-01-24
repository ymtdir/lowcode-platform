import { getScripts, extractScripts } from '@/features/script';
import { ScriptInjector } from './script-injector';

/**
 * グローバルスクリプト注入コンポーネント
 * アプリケーション全体で実行されるJavaScriptを注入する
 */
export async function GlobalScriptInjector() {
  const scriptsResult = await getScripts(null);
  const scripts = extractScripts(scriptsResult);

  return <ScriptInjector scripts={scripts} />;
}
