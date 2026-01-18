'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CreateAssetButton } from './create-asset-button';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Asset } from '@/features/editor/types/asset';
import { CodeEditor } from '@/components/shared/code-editor';
import { SortableAssetItem } from './sortable-asset-item';

/**
 * アセットエディタのProps型
 */
export type AssetEditorProps = {
  /** アセット一覧のタイトル */
  listTitle: string;
  /** 作成対象の名称（例: "スタイル", "スクリプト"） */
  assetLabel?: string;
  /** Monaco Editor の言語設定 */
  language: 'css' | 'javascript' | 'typescript';
  /** 初期アセットデータ */
  initialAssets: Asset[];
  /** 新規アセット作成時のデフォルト内容 */
  newAssetContent?: string;
  /** アセット保存時のコールバック */
  onSave?: (asset: Asset) => Promise<void>;
  /** アセット名変更時のコールバック */
  onRename?: (id: string, newName: string) => Promise<void>;
  /** アセット削除時のコールバック */
  onDelete?: (id: string) => Promise<void>;
  /** アセット並び替え時のコールバック */
  onReorder?: (assets: Asset[]) => Promise<void>;
  /** アセット追加時のコールバック */
  onAdd?: (asset: Asset) => Promise<void>;
};

/**
 * 汎用アセットエディタコンポーネント
 * スタイル、クライアントスクリプト、サーバースクリプトで共通使用
 */
export function AssetEditor({
  listTitle,
  assetLabel,
  language,
  initialAssets,
  newAssetContent = '',
  onSave,
  onRename,
  onDelete,
  onReorder,
  onAdd,
}: AssetEditorProps) {
  // 保存済みのアセット
  const [savedAssets, setSavedAssets] = useState<Asset[]>(initialAssets);

  // 編集中の内容を保持するMap（アセットID -> 編集中の内容）
  const [editedContents, setEditedContents] = useState<Map<string, string>>(
    () => new Map()
  );

  // 選択中のアセット
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(
    initialAssets[0]?.id || null
  );

  useEffect(() => {
    setSavedAssets(initialAssets);
  }, [initialAssets]);

  // dnd-kit センサー
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 現在選択中のアセット
  const selectedAsset = useMemo(
    () => savedAssets.find((a) => a.id === selectedAssetId) || null,
    [savedAssets, selectedAssetId]
  );

  // 現在のエディタに表示する内容
  const currentContent = useMemo(() => {
    if (!selectedAssetId) return '';
    return editedContents.get(selectedAssetId) ?? selectedAsset?.content ?? '';
  }, [selectedAssetId, editedContents, selectedAsset]);

  // 現在のアセットに変更があるかどうか
  const hasChanges = useMemo(() => {
    if (!selectedAssetId || !selectedAsset) return false;
    const edited = editedContents.get(selectedAssetId);
    if (edited === undefined) return false;
    return edited !== selectedAsset.content;
  }, [selectedAssetId, selectedAsset, editedContents]);

  // 未保存の変更があるアセットのIDセット
  const unsavedAssetIds = useMemo(() => {
    const ids = new Set<string>();
    editedContents.forEach((edited, id) => {
      const saved = savedAssets.find((a) => a.id === id);
      if (saved && edited !== saved.content) {
        ids.add(id);
      }
    });
    return ids;
  }, [editedContents, savedAssets]);

  const handleSelectAsset = useCallback((assetId: string) => {
    setSelectedAssetId(assetId);
  }, []);

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (!selectedAssetId) return;
      setEditedContents((prev) => {
        const next = new Map(prev);
        next.set(selectedAssetId, newContent);
        return next;
      });
    },
    [selectedAssetId]
  );

  const handleSave = useCallback(async () => {
    if (!selectedAssetId) return;
    const editedContent = editedContents.get(selectedAssetId);
    if (editedContent === undefined) return;

    const updatedAsset = savedAssets.find((a) => a.id === selectedAssetId);
    if (!updatedAsset) return;

    const newAsset = { ...updatedAsset, content: editedContent };

    if (onSave) {
      await onSave(newAsset);
    }

    setSavedAssets((prev) =>
      prev.map((a) => (a.id === selectedAssetId ? newAsset : a))
    );

    setEditedContents((prev) => {
      const next = new Map(prev);
      next.delete(selectedAssetId);
      return next;
    });
  }, [selectedAssetId, editedContents, savedAssets, onSave]);

  const handleRename = useCallback(
    async (id: string, newName: string) => {
      if (onRename) {
        await onRename(id, newName);
      }
      setSavedAssets((prev) =>
        prev.map((a) => (a.id === id ? { ...a, name: newName } : a))
      );
    },
    [onRename]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (onDelete) {
        await onDelete(id);
      }

      setSavedAssets((prev) => prev.filter((a) => a.id !== id));
      setEditedContents((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });

      if (selectedAssetId === id) {
        const remaining = savedAssets.filter((a) => a.id !== id);
        setSelectedAssetId(remaining[0]?.id || null);
      }
    },
    [selectedAssetId, savedAssets, onDelete]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = savedAssets.findIndex((a) => a.id === active.id);
        const newIndex = savedAssets.findIndex((a) => a.id === over.id);
        const newAssets = arrayMove(savedAssets, oldIndex, newIndex);

        setSavedAssets(newAssets);

        if (onReorder) {
          await onReorder(newAssets);
        }
      }
    },
    [savedAssets, onReorder]
  );

  const handleAddAsset = useCallback(
    async (name: string) => {
      const newId = `new-${Date.now()}`;
      const newAsset: Asset = {
        id: newId,
        name,
        content: newAssetContent,
      };

      if (onAdd) {
        await onAdd(newAsset);
      }

      setSavedAssets((prev) => [...prev, newAsset]);
      setSelectedAssetId(newId);
    },
    [newAssetContent, onAdd]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="h-[460px] rounded-lg border">
        <ResizablePanelGroup
          orientation="horizontal"
          id="asset-editor"
          defaultLayout={{ sidebar: 20, editor: 80 }}
        >
          {/* サイドバー: アセット一覧 */}
          <ResizablePanel id="sidebar" minSize="15%" maxSize="40%">
            <div className="flex h-full flex-col">
              {/* ヘッダー */}
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="text-sm font-medium">{listTitle}</span>
                <CreateAssetButton
                  assetLabel={assetLabel}
                  onAdd={handleAddAsset}
                />
              </div>
              {/* リスト */}
              <div className="flex-1 overflow-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={savedAssets.map((a) => a.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {savedAssets.map((asset) => (
                      <SortableAssetItem
                        key={asset.id}
                        asset={asset}
                        isSelected={selectedAssetId === asset.id}
                        hasUnsavedChanges={unsavedAssetIds.has(asset.id)}
                        onSelect={handleSelectAsset}
                        onRename={handleRename}
                        onDelete={handleDelete}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* メイン: エディター */}
          <ResizablePanel id="editor">
            <div className="h-full">
              {selectedAsset ? (
                <CodeEditor
                  value={currentContent}
                  onChange={handleContentChange}
                  language={language}
                  height="100%"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {assetLabel || 'アセット'}を選択してください
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button
          className="cursor-pointer"
          onClick={handleSave}
          disabled={!hasChanges}
        >
          保存
        </Button>
      </div>
    </div>
  );
}
