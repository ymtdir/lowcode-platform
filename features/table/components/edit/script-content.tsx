import { ScriptEditor, type Script } from '@/features/script';

/**
 * スクリプト設定コンテンツのProps型
 */
type ScriptContentProps = {
  itemId: string;
  initialScripts: Script[];
};

/**
 * スクリプト設定タブのコンテンツ
 */
export function ScriptContent({ itemId, initialScripts }: ScriptContentProps) {
  return <ScriptEditor itemId={itemId} initialScripts={initialScripts} />;
}
