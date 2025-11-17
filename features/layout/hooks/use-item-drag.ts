import { useMemo } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import type { Item as ItemType } from '@/features/item/types';
import { reorderItems } from '@/features/item/api';
import { toast } from 'sonner';
import { WORKSPACE_ROOT_ID } from '@/features/layout/utils/collision-detection';
import { calculateItemOrder } from '@/features/layout/utils/calculate-item-order';

type DropPosition = 'before' | 'after' | 'inside';

type UseItemDragParams = {
  items: ItemType[];
  insideTargetId: string | null;
  overId: string | null;
  dropPosition: DropPosition;
};

// アイテムのドラッグ&ドロップロジック（汎用）
// UI状態は含まず、データ操作のみを扱う
export function useItemDrag({
  items,
  insideTargetId,
  overId,
  dropPosition,
}: UseItemDragParams) {
  // フラットなフォルダリストを作成
  const flattenedItems = useMemo(() => {
    const flatten = (items: ItemType[]): ItemType[] => {
      return items.reduce((acc, item) => {
        acc.push(item);
        if (item.children && item.children.length > 0) {
          acc.push(...flatten(item.children));
        }
        return acc;
      }, [] as ItemType[]);
    };
    return flatten(items);
  }, [items]);

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

    const activeItem = flattenedItems.find((i) => i.id === active.id);

    if (!activeItem) {
      return;
    }

    const explicitRootDrop =
      finalOverId === WORKSPACE_ROOT_ID ||
      finalOverId === 'workspace-menu' ||
      finalInsideTargetId === WORKSPACE_ROOT_ID;

    const implicitRootDrop = !finalOverId && activeItem.parentId !== null;

    const isRootDrop = explicitRootDrop || implicitRootDrop;

    if (!isRootDrop && active.id === finalOverId) {
      return;
    }

    if (!finalOverId && !isRootDrop) {
      return;
    }

    // ルートへのドロップか、通常のアイテムへのドロップかで処理を分ける
    let overItem: ItemType | null = null;
    if (!isRootDrop) {
      overItem = flattenedItems.find((i) => i.id === finalOverId) || null;
      if (!overItem) {
        return;
      }
    }

    // 新しい順序を計算
    const { newParentId, reorderedSiblings } = calculateItemOrder({
      activeItem,
      overItem,
      dropPosition,
      flattenedItems,
      insideTargetId: finalInsideTargetId,
    });

    console.log('計算された新しい順序:', {
      newParentId,
      reorderedSiblings,
    });

    const result = await reorderItems({
      itemId: active.id as string,
      newParentId,
      reorderedSiblings,
    });

    if (!result.success) {
      toast.error(result.error || 'アイテムの移動に失敗しました');
    }
  };

  return {
    flattenedItems,
    handleDragEnd,
  };
}
