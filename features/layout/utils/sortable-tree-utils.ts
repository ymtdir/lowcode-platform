import type { UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Item as ItemType } from '@/features/item/types';

/**
 * フラット化されたアイテムの型
 */
export type FlattenedItem = ItemType & {
  parentId: string | null;
  depth: number;
};

/**
 * ツリー構造をフラットな配列に変換する
 */
export function flattenTree(
  items: ItemType[],
  parentId: string | null = null,
  depth = 0
): FlattenedItem[] {
  return items
    .sort((a, b) => a.order - b.order)
    .reduce<FlattenedItem[]>((acc, item) => {
      const flatItem: FlattenedItem = {
        ...item,
        parentId,
        depth,
      };
      return [
        ...acc,
        flatItem,
        ...(item.children
          ? flattenTree(item.children, item.id, depth + 1)
          : []),
      ];
    }, []);
}

/**
 * フラットな配列からツリー構造を再構築する
 */
export function buildTree(flattenedItems: FlattenedItem[]): ItemType[] {
  const itemMap = new Map<string, ItemType>();
  const rootItems: ItemType[] = [];

  // まず全アイテムをマップに追加
  flattenedItems.forEach((item) => {
    const newItem: ItemType = {
      ...item,
      children: [],
    } as ItemType;
    itemMap.set(item.id, newItem);
  });

  // 親子関係を構築
  flattenedItems.forEach((item, index) => {
    const currentItem = itemMap.get(item.id)!;
    currentItem.order = index;

    if (item.parentId === null) {
      rootItems.push(currentItem);
    } else {
      const parent = itemMap.get(item.parentId);
      if (parent && parent.children) {
        parent.children.push(currentItem);
      }
    }
  });

  // orderを再計算
  const recalculateOrder = (items: ItemType[]) => {
    items.forEach((item, index) => {
      item.order = index;
      if (item.children && item.children.length > 0) {
        recalculateOrder(item.children);
      }
    });
  };
  recalculateOrder(rootItems);

  return rootItems;
}

/**
 * 移動先の親と深さを計算する
 */
export function getProjection(
  items: FlattenedItem[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  dragOffset: number,
  indentationWidth: number
): { depth: number; parentId: string | null } {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  const activeItem = items[activeItemIndex];

  if (!activeItem || overItemIndex === -1) {
    return { depth: 0, parentId: null };
  }

  // ドラッグ中のアイテムをマウスオーバー位置に移動
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];

  // ドラッグの水平移動量から深さを計算
  const dragDepth = Math.round(dragOffset / indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;

  // 深さを制限
  const depth = getDepth(projectedDepth, previousItem, nextItem);

  // 親IDを取得
  const parentId = getParentId(depth, overItemIndex, previousItem, newItems);

  return { depth, parentId };
}

/**
 * 有効な深さを計算する
 */
function getDepth(
  projectedDepth: number,
  previousItem: FlattenedItem | undefined,
  nextItem: FlattenedItem | undefined
): number {
  // 最小深さは0（ルート）
  const minDepth = nextItem ? nextItem.depth : 0;
  // 最大深さは前のアイテムの深さ+1（前のアイテムの子になれる）
  const maxDepth = previousItem ? previousItem.depth + 1 : 0;

  // projectedDepthを有効範囲内に制限
  if (projectedDepth < minDepth) {
    return minDepth;
  }
  if (projectedDepth > maxDepth) {
    return maxDepth;
  }
  return projectedDepth;
}

/**
 * 親IDを取得する
 */
function getParentId(
  depth: number,
  overIndex: number,
  previousItem: FlattenedItem | undefined,
  items: FlattenedItem[]
): string | null {
  if (depth === 0) {
    return null;
  }

  if (!previousItem) {
    return null;
  }

  // 前のアイテムと同じ深さの場合、同じ親を持つ
  if (depth === previousItem.depth) {
    return previousItem.parentId;
  }

  // 前のアイテムより深い場合、前のアイテムが親になる
  if (depth > previousItem.depth) {
    return previousItem.id;
  }

  // 前のアイテムより浅い場合、さらに前のアイテムから親を探す
  for (let i = overIndex - 1; i >= 0; i--) {
    const item = items[i];
    if (item.depth === depth - 1) {
      return item.id;
    }
    if (item.depth < depth - 1) {
      return null;
    }
  }

  return null;
}

/**
 * 子孫アイテムのIDを取得する
 */
export function getChildrenIds(
  items: FlattenedItem[],
  parentId: UniqueIdentifier
): string[] {
  const childrenIds: string[] = [];
  const startIndex = items.findIndex((item) => item.id === parentId);

  if (startIndex === -1) {
    return childrenIds;
  }

  const parentDepth = items[startIndex].depth;

  for (let i = startIndex + 1; i < items.length; i++) {
    const item = items[i];
    if (item.depth <= parentDepth) {
      break;
    }
    childrenIds.push(item.id);
  }

  return childrenIds;
}
