'use client';

import { toast } from 'sonner';
import { AssetEditor, type Asset } from '@/features/editor';
import {
  createScript,
  updateScript,
  deleteScript,
  reorderScripts,
  type Script,
} from '@/features/script';

type ScriptEditorProps = {
  itemId: string | null;
  initialScripts: Script[];
};

/**
 * Script を Asset に変換
 */
function scriptsToAssets(scripts: Script[]): Asset[] {
  return scripts.map((script) => ({
    id: script.id,
    name: script.name,
    content: script.content,
  }));
}

/**
 * スクリプト編集コンポーネント
 * API呼び出しとtoast通知を内包したAssetEditorラッパー
 */
export function ScriptEditor({ itemId, initialScripts }: ScriptEditorProps) {
  const handleSave = async (asset: Asset) => {
    const result = await updateScript(asset.id, { content: asset.content });
    if (result.error) {
      toast.error('スクリプトの保存に失敗しました', {
        description: result.error,
      });
    } else {
      toast.success('スクリプトを保存しました');
    }
  };

  const handleRename = async (id: string, newName: string) => {
    const result = await updateScript(id, { name: newName });
    if (result.error) {
      toast.error('スクリプト名の変更に失敗しました', {
        description: result.error,
      });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteScript(id);
    if (result.error) {
      toast.error('スクリプトの削除に失敗しました', {
        description: result.error,
      });
    } else {
      toast.success('スクリプトを削除しました');
    }
  };

  const handleReorder = async (assets: Asset[]) => {
    const result = await reorderScripts(
      itemId,
      assets.map((a) => a.id)
    );
    if (result.error) {
      toast.error('スクリプトの並び替えに失敗しました', {
        description: result.error,
      });
    }
  };

  const handleAdd = async (asset: Asset): Promise<string | void> => {
    const result = await createScript(itemId, {
      name: asset.name,
      content: asset.content,
    });
    if (result.error) {
      toast.error('スクリプトの作成に失敗しました', {
        description: result.error,
      });
    } else {
      toast.success('スクリプトを作成しました');
      return result.script?.id;
    }
  };

  return (
    <AssetEditor
      listTitle="スクリプト一覧"
      assetLabel="スクリプト"
      language="javascript"
      initialAssets={scriptsToAssets(initialScripts)}
      newAssetContent=""
      onSave={handleSave}
      onRename={handleRename}
      onDelete={handleDelete}
      onReorder={handleReorder}
      onAdd={handleAdd}
    />
  );
}
