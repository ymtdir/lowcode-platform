'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { ITEM_CONFIGS } from '@/features/item/constants';
import { reorderItems } from '@/features/item/api';
import { SortableItemCard, ItemCardContent } from '@/features/item/components';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  CollisionDetection,
  pointerWithin,
  MeasuringStrategy,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import type { Item } from '@/features/item/types';
import { CreateItemButton } from '@/features/item/components';

const DROP_DELAY_MS = 400;
const CLICK_DELAY_MS = 300;
const DRAG_ACTIVATION_DISTANCE = 8;

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.3',
      },
    },
  }),
};

type FolderLayoutProps = {
  item: Item & { type: 'FOLDER' };
};

const customCollisionDetection: CollisionDetection = (args) => {
  // ポインタがアイテムの上に確実にある場合のみ反応させる（誤検知防止）
  return pointerWithin(args);
};

/**
 * フォルダレイアウトコンポーネント
 *
 * 特定のフォルダ内のアイテム（フォルダ、テーブル）をグリッド表示し、
 * ドラッグ&ドロップによる並び替えやフォルダへの移動機能を提供します。
 */
export function FolderLayout({ item }: FolderLayoutProps) {
  // item.childrenをソート済み配列としてメモ化
  const serverChildren = useMemo(
    () =>
      item.children ? [...item.children].sort((a, b) => a.order - b.order) : [],
    [item.children]
  );

  const [sortedChildren, setSortedChildren] = useState(serverChildren);
  const [preventClick, setPreventClick] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeItem = useMemo(
    () => sortedChildren.find((item) => item.id === activeId),
    [sortedChildren, activeId]
  );

  const dropTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentOverIdRef = useRef<string | null>(null);

  // サーバーからの更新を検出してローカル状態に反映
  useEffect(() => {
    setSortedChildren(serverChildren);
  }, [serverChildren]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (dropTimeoutRef.current) {
        clearTimeout(dropTimeoutRef.current);
      }
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
    })
  );

  const clearDropState = useCallback(() => {
    if (dropTimeoutRef.current) {
      clearTimeout(dropTimeoutRef.current);
      dropTimeoutRef.current = null;
    }
    currentOverIdRef.current = null;
    setDropTargetId(null);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setPreventClick(true);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        clearDropState();
        return;
      }

      const overItem = sortedChildren.find((child) => child.id === over.id);
      if (!overItem || !ITEM_CONFIGS[overItem.type].droppable) {
        clearDropState();
        return;
      }

      const overId = over.id as string;
      if (currentOverIdRef.current === overId) return;

      clearDropState();
      currentOverIdRef.current = overId;
      dropTimeoutRef.current = setTimeout(() => {
        setDropTargetId(overId);
      }, DROP_DELAY_MS);
    },
    [sortedChildren, clearDropState]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const targetId = dropTargetId;

      clearDropState();
      setActiveId(null);
      setTimeout(() => setPreventClick(false), CLICK_DELAY_MS);

      const activeId = active.id as string;

      // フォルダへのドロップ
      if (targetId && targetId !== activeId) {
        const previousChildren = sortedChildren;
        setSortedChildren((prev) =>
          prev.filter((child) => child.id !== activeId)
        );

        // 移動先フォルダの既存の子アイテムを取得
        const targetFolder = sortedChildren.find((c) => c.id === targetId);
        const targetChildren = targetFolder?.children || [];

        // 移動するアイテムを先頭に配置し、既存アイテムの順序を1ずつずらす
        const reorderedSiblings = [
          { id: activeId, order: 0 },
          ...targetChildren.map((child, index) => ({
            id: child.id,
            order: index + 1,
          })),
        ];

        const result = await reorderItems({
          itemId: activeId,
          newParentId: targetId,
          reorderedSiblings,
        });

        if (!result.success) {
          // エラー時はロールバック
          setSortedChildren(previousChildren);
        }
        return;
      }

      if (!over || active.id === over.id) return;

      const overId = over.id as string;

      // 並び替え
      const oldIndex = sortedChildren.findIndex((c) => c.id === activeId);
      const newIndex = sortedChildren.findIndex((c) => c.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const previousChildren = sortedChildren;
      const newChildren = arrayMove(sortedChildren, oldIndex, newIndex);
      setSortedChildren(newChildren);

      const result = await reorderItems({
        itemId: activeId,
        newParentId: item.id,
        reorderedSiblings: newChildren.map((child, index) => ({
          id: child.id,
          order: index,
        })),
      });

      if (!result.success) {
        // エラー時はロールバック
        setSortedChildren(previousChildren);
      }
    },
    [sortedChildren, dropTargetId, item.id, clearDropState]
  );

  const handleDragCancel = useCallback(() => {
    clearDropState();
    setActiveId(null);
    setTimeout(() => setPreventClick(false), CLICK_DELAY_MS);
  }, [clearDropState]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{item.name}</h1>
      </div>

      <div className="mb-6 flex items-center justify-end">
        <CreateItemButton parentId={item.id} />
      </div>

      {sortedChildren.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={sortedChildren.map((child) => child.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sortedChildren.map((child) => (
                <SortableItemCard
                  key={child.id}
                  item={child}
                  isDropTarget={dropTargetId === child.id}
                  preventClick={preventClick}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={dropAnimation}>
            {activeItem ? (
              <ItemCardContent item={activeItem} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">アイテムがありません</p>
          <p className="text-sm text-muted-foreground mt-2">
            「新規作成」ボタンから新しいアイテムを作成できます
          </p>
        </div>
      )}
    </div>
  );
}
