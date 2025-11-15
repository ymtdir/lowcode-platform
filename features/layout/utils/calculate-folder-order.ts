import type { Folder as FolderType } from '@/features/folder/types';

type DropPosition = 'before' | 'after' | 'inside';

type CalculateFolderOrderParams = {
  activeFolder: FolderType;
  overFolder: FolderType | null;
  dropPosition: DropPosition;
  flattenedFolders: FolderType[];
  insideTargetId: string | null;
};

type CalculateFolderOrderResult = {
  newParentId: string | null;
  reorderedSiblings: Array<{ id: string; order: number }>;
};

//兄弟フォルダを取得してソート
function getSiblings(
  flattenedFolders: FolderType[],
  parentId: string | null,
  excludeId?: string
): FolderType[] {
  return flattenedFolders
    .filter((f) => f.parentId === parentId && f.id !== excludeId)
    .sort((a, b) => a.order - b.order);
}

//フォルダのリストから順序付きの配列を生成
function createReorderedSiblings(
  folders: FolderType[]
): Array<{ id: string; order: number }> {
  return folders.map((f, index) => ({
    id: f.id,
    order: index,
  }));
}

// フォルダのドラッグ&ドロップ時の新しい順序を計算する
export function calculateFolderOrder({
  activeFolder,
  overFolder,
  dropPosition,
  flattenedFolders,
  insideTargetId,
}: CalculateFolderOrderParams): CalculateFolderOrderResult {
  // ルートへのドロップ
  if (!overFolder) {
    const rootFolders = getSiblings(flattenedFolders, null, activeFolder.id);

    return {
      newParentId: null,
      reorderedSiblings: [
        ...createReorderedSiblings(rootFolders),
        { id: activeFolder.id, order: rootFolders.length },
      ],
    };
  }

  // フォルダ内へのドロップ
  if (dropPosition === 'inside') {
    const newParentId = insideTargetId || overFolder.id;
    const newSiblings = getSiblings(flattenedFolders, newParentId);

    return {
      newParentId,
      reorderedSiblings: [
        ...createReorderedSiblings(newSiblings),
        { id: activeFolder.id, order: newSiblings.length },
      ],
    };
  }

  // before/after でのドロップ
  const newParentId = overFolder.parentId;
  const isSameParent = activeFolder.parentId === newParentId;

  if (isSameParent) {
    // 同じ親内での移動
    return calculateSameParentReorder({
      activeFolder,
      overFolder,
      dropPosition,
      flattenedFolders,
      newParentId,
    });
  } else {
    // 異なる親への移動
    return calculateDifferentParentReorder({
      activeFolder,
      overFolder,
      dropPosition,
      flattenedFolders,
      newParentId,
    });
  }
}

// 同じ親内での並び替え
function calculateSameParentReorder({
  activeFolder,
  overFolder,
  dropPosition,
  flattenedFolders,
  newParentId,
}: {
  activeFolder: FolderType;
  overFolder: FolderType;
  dropPosition: DropPosition;
  flattenedFolders: FolderType[];
  newParentId: string | null;
}): CalculateFolderOrderResult {
  const siblings = getSiblings(flattenedFolders, newParentId);

  // 配列操作で並び替え
  const activeIndex = siblings.findIndex((f) => f.id === activeFolder.id);
  const overIndex = siblings.findIndex((f) => f.id === overFolder.id);

  const reordered = [...siblings];
  const [moved] = reordered.splice(activeIndex, 1);

  let insertIndex: number;
  if (dropPosition === 'before') {
    insertIndex = activeIndex < overIndex ? overIndex - 1 : overIndex;
  } else {
    insertIndex = activeIndex < overIndex ? overIndex : overIndex + 1;
  }

  reordered.splice(insertIndex, 0, moved);

  return {
    newParentId,
    reorderedSiblings: createReorderedSiblings(reordered),
  };
}

// 異なる親への移動
function calculateDifferentParentReorder({
  activeFolder,
  overFolder,
  dropPosition,
  flattenedFolders,
  newParentId,
}: {
  activeFolder: FolderType;
  overFolder: FolderType;
  dropPosition: DropPosition;
  flattenedFolders: FolderType[];
  newParentId: string | null;
}): CalculateFolderOrderResult {
  const newSiblings = getSiblings(flattenedFolders, newParentId);

  const overIndex = newSiblings.findIndex((f) => f.id === overFolder.id);

  let insertIndex: number;
  if (dropPosition === 'before') {
    insertIndex = overIndex;
  } else {
    insertIndex = overIndex + 1;
  }

  // 挿入位置にアクティブフォルダを追加
  newSiblings.splice(insertIndex, 0, activeFolder);

  return {
    newParentId,
    reorderedSiblings: createReorderedSiblings(newSiblings),
  };
}
