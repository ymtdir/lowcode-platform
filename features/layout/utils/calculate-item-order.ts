import type { Item as ItemType } from '@/features/item/types';

type DropPosition = 'before' | 'after' | 'inside';

type CalculateItemOrderParams = {
  activeItem: ItemType;
  overItem: ItemType | null;
  dropPosition: DropPosition;
  flattenedItems: ItemType[];
  insideTargetId: string | null;
};

type CalculateItemOrderResult = {
  newParentId: string | null;
  reorderedSiblings: Array<{ id: string; order: number }>;
};

//兄弟アイテムを取得してソート
function getSiblings(
  flattenedItems: ItemType[],
  parentId: string | null,
  excludeId?: string
): ItemType[] {
  return flattenedItems
    .filter((f) => f.parentId === parentId && f.id !== excludeId)
    .sort((a, b) => a.order - b.order);
}

//アイテムのリストから順序付きの配列を生成
function createReorderedSiblings(
  items: ItemType[]
): Array<{ id: string; order: number }> {
  return items.map((f, index) => ({
    id: f.id,
    order: index,
  }));
}

// アイテムのドラッグ&ドロップ時の新しい順序を計算する
export function calculateItemOrder({
  activeItem,
  overItem,
  dropPosition,
  flattenedItems,
  insideTargetId,
}: CalculateItemOrderParams): CalculateItemOrderResult {
  // ルートへのドロップ
  if (!overItem) {
    const rootItems = getSiblings(flattenedItems, null, activeItem.id);

    return {
      newParentId: null,
      reorderedSiblings: [
        ...createReorderedSiblings(rootItems),
        { id: activeItem.id, order: rootItems.length },
      ],
    };
  }

  // アイテム内へのドロップ
  if (dropPosition === 'inside') {
    const newParentId = insideTargetId || overItem.id;
    const newSiblings = getSiblings(flattenedItems, newParentId);

    return {
      newParentId,
      reorderedSiblings: [
        ...createReorderedSiblings(newSiblings),
        { id: activeItem.id, order: newSiblings.length },
      ],
    };
  }

  // before/after でのドロップ
  const newParentId = overItem.parentId;
  const isSameParent = activeItem.parentId === newParentId;

  if (isSameParent) {
    // 同じ親内での移動
    return calculateSameParentReorder({
      activeItem,
      overItem,
      dropPosition,
      flattenedItems,
      newParentId,
    });
  } else {
    // 異なる親への移動
    return calculateDifferentParentReorder({
      activeItem,
      overItem,
      dropPosition,
      flattenedItems,
      newParentId,
    });
  }
}

// 同じ親内での並び替え
function calculateSameParentReorder({
  activeItem,
  overItem,
  dropPosition,
  flattenedItems,
  newParentId,
}: {
  activeItem: ItemType;
  overItem: ItemType;
  dropPosition: DropPosition;
  flattenedItems: ItemType[];
  newParentId: string | null;
}): CalculateItemOrderResult {
  const siblings = getSiblings(flattenedItems, newParentId);

  // 配列操作で並び替え
  const activeIndex = siblings.findIndex((f) => f.id === activeItem.id);
  const overIndex = siblings.findIndex((f) => f.id === overItem.id);

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
  activeItem,
  overItem,
  dropPosition,
  flattenedItems,
  newParentId,
}: {
  activeItem: ItemType;
  overItem: ItemType;
  dropPosition: DropPosition;
  flattenedItems: ItemType[];
  newParentId: string | null;
}): CalculateItemOrderResult {
  const newSiblings = getSiblings(flattenedItems, newParentId);

  const overIndex = newSiblings.findIndex((f) => f.id === overItem.id);

  let insertIndex: number;
  if (dropPosition === 'before') {
    insertIndex = overIndex;
  } else {
    insertIndex = overIndex + 1;
  }

  // 挿入位置にアクティブアイテムを追加
  newSiblings.splice(insertIndex, 0, activeItem);

  return {
    newParentId,
    reorderedSiblings: createReorderedSiblings(newSiblings),
  };
}
