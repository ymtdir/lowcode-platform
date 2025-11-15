import { useMemo } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import type { Folder as FolderType } from '@/features/folder/types';
import { reorderFolders } from '@/features/folder/api';
import { toast } from 'sonner';
import { WORKSPACE_ROOT_ID } from '@/features/layout/utils/collision-detection';
import { calculateFolderOrder } from '@/features/layout/utils/calculate-folder-order';

type DropPosition = 'before' | 'after' | 'inside';

type UseFolderDragParams = {
  folders: FolderType[];
  insideTargetId: string | null;
  overId: string | null;
  dropPosition: DropPosition;
};

// フォルダのドラッグ&ドロップロジック（汎用）
// UI状態は含まず、データ操作のみを扱う
export function useFolderDrag({
  folders,
  insideTargetId,
  overId,
  dropPosition,
}: UseFolderDragParams) {
  // フラットなフォルダリストを作成
  const flattenedFolders = useMemo(() => {
    const flatten = (folders: FolderType[]): FolderType[] => {
      return folders.reduce((acc, folder) => {
        acc.push(folder);
        if (folder.children && folder.children.length > 0) {
          acc.push(...flatten(folder.children));
        }
        return acc;
      }, [] as FolderType[]);
    };
    return flatten(folders);
  }, [folders]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('ドラッグ終了処理を開始', {
      activeId: active.id,
      overId: over?.id,
      insideTargetId,
      dropPosition,
      savedOverId: overId,
    });

    const finalOverId = (over?.id as string | undefined) || overId;
    const finalInsideTargetId = insideTargetId;

    const activeFolder = flattenedFolders.find((f) => f.id === active.id);

    if (!activeFolder) {
      return;
    }

    const explicitRootDrop =
      finalOverId === WORKSPACE_ROOT_ID ||
      finalOverId === 'workspace-menu' ||
      finalInsideTargetId === WORKSPACE_ROOT_ID;

    const implicitRootDrop = !finalOverId && activeFolder.parentId !== null;

    const isRootDrop = explicitRootDrop || implicitRootDrop;

    if (!isRootDrop && active.id === finalOverId) {
      return;
    }

    if (!finalOverId && !isRootDrop) {
      return;
    }

    // ルートへのドロップか、通常のフォルダへのドロップかで処理を分ける
    let overFolder: FolderType | null = null;
    if (!isRootDrop) {
      overFolder = flattenedFolders.find((f) => f.id === finalOverId) || null;
      if (!overFolder) {
        return;
      }
    }

    // 新しい順序を計算
    const { newParentId, reorderedSiblings } = calculateFolderOrder({
      activeFolder,
      overFolder,
      dropPosition,
      flattenedFolders,
      insideTargetId: finalInsideTargetId,
    });

    console.log('計算された新しい順序:', {
      newParentId,
      reorderedSiblings,
    });

    const result = await reorderFolders({
      folderId: active.id as string,
      newParentId,
      reorderedSiblings,
    });

    if (!result.success) {
      toast.error(result.error || 'フォルダの移動に失敗しました');
    }
  };

  return {
    flattenedFolders,
    handleDragEnd,
  };
}
