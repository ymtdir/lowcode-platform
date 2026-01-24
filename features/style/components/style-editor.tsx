'use client';

import { toast } from 'sonner';
import { AssetEditor, type Asset } from '@/features/editor';
import {
  createStyle,
  updateStyle,
  deleteStyle,
  reorderStyles,
  type Style,
} from '@/features/style';

type StyleEditorProps = {
  itemId: string | null;
  initialStyles: Style[];
};

/**
 * Style を Asset に変換
 */
function stylesToAssets(styles: Style[]): Asset[] {
  return styles.map((style) => ({
    id: style.id,
    name: style.name,
    content: style.content,
  }));
}

/**
 * スタイル編集コンポーネント
 * API呼び出しとtoast通知を内包したAssetEditorラッパー
 */
export function StyleEditor({ itemId, initialStyles }: StyleEditorProps) {
  const handleSave = async (asset: Asset) => {
    const result = await updateStyle(asset.id, { content: asset.content });
    if (result.error) {
      toast.error('スタイルの保存に失敗しました', {
        description: result.error,
      });
    } else {
      toast.success('スタイルを保存しました');
    }
  };

  const handleRename = async (id: string, newName: string) => {
    const result = await updateStyle(id, { name: newName });
    if (result.error) {
      toast.error('スタイル名の変更に失敗しました', {
        description: result.error,
      });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteStyle(id);
    if (result.error) {
      toast.error('スタイルの削除に失敗しました', {
        description: result.error,
      });
    } else {
      toast.success('スタイルを削除しました');
    }
  };

  const handleReorder = async (assets: Asset[]) => {
    const result = await reorderStyles(
      itemId,
      assets.map((a) => a.id)
    );
    if (result.error) {
      toast.error('スタイルの並び替えに失敗しました', {
        description: result.error,
      });
    }
  };

  const handleAdd = async (asset: Asset): Promise<string | void> => {
    const result = await createStyle(itemId, {
      name: asset.name,
      content: asset.content,
    });
    if (result.error) {
      toast.error('スタイルの作成に失敗しました', {
        description: result.error,
      });
    } else {
      toast.success('スタイルを作成しました');
      return result.style?.id;
    }
  };

  return (
    <AssetEditor
      listTitle="スタイル一覧"
      assetLabel="スタイル"
      language="css"
      initialAssets={stylesToAssets(initialStyles)}
      newAssetContent=""
      onSave={handleSave}
      onRename={handleRename}
      onDelete={handleDelete}
      onReorder={handleReorder}
      onAdd={handleAdd}
    />
  );
}
