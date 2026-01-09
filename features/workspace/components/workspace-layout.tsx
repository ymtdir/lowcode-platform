'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { CreateItemButton } from '@/features/item/components';
import { SortableItemCard, ItemCardContent } from '@/features/item/components';
import type { Item } from '@/features/item/types';
import { ITEM_CONFIGS } from '@/features/item/constants';
import { reorderItems } from '@/features/item/api';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  MeasuringStrategy,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
  DragStartEvent,
  CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

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

type WorkspaceLayoutProps = {
  items: Item[];
};

const customCollisionDetection: CollisionDetection = (args) => {
  // ポインタがアイテムの上に確実にある場合のみ反応させる（誤検知防止）
  return pointerWithin(args);
};

/**
 * ワークスペースレイアウトコンポーネント
 *
 * ワークスペースのルート階層にあるアイテム（フォルダ、テーブル）をグリッド表示し、
 * ドラッグ&ドロップによる並び替えやフォルダへの移動機能を提供します。
 */
export function WorkspaceLayout({ items }: WorkspaceLayoutProps) {
  // サーバーからのアイテムをOrder順にソート（念のため）してメモ化
  const serverItems = useMemo(
    () => [...items].sort((a, b) => a.order - b.order),
    [items]
  );

  const [sortedItems, setSortedItems] = useState(serverItems);
  const [preventClick, setPreventClick] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeItem = useMemo(
    () => sortedItems.find((item) => item.id === activeId),
    [sortedItems, activeId]
  );

  const dropTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentOverIdRef = useRef<string | null>(null);

  useEffect(() => {
    setSortedItems(serverItems);
  }, [serverItems]);

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

      const overItem = sortedItems.find((item) => item.id === over.id);
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
    [sortedItems, clearDropState]
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
        const previousItems = sortedItems;
        setSortedItems((prev) => prev.filter((item) => item.id !== activeId));

        const result = await reorderItems({
          itemId: activeId,
          newParentId: targetId,
          reorderedSiblings: [],
        });

        if (!result.success) {
          setSortedItems(previousItems);
        }
        return;
      }

      if (!over || active.id === over.id) return;

      const overId = over.id as string;

      // 並び替え（ルートレベル）
      const oldIndex = sortedItems.findIndex((c) => c.id === activeId);
      const newIndex = sortedItems.findIndex((c) => c.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const previousItems = sortedItems;
      const newItems = arrayMove(sortedItems, oldIndex, newIndex);
      setSortedItems(newItems);

      const result = await reorderItems({
        itemId: activeId,
        newParentId: null, // ルートなのでnull
        reorderedSiblings: newItems.map((item, index) => ({
          id: item.id,
          order: index,
        })),
      });

      if (!result.success) {
        setSortedItems(previousItems);
      }
    },
    [sortedItems, dropTargetId, clearDropState]
  );

  const handleDragCancel = useCallback(() => {
    clearDropState();
    setActiveId(null);
    setTimeout(() => setPreventClick(false), CLICK_DELAY_MS);
  }, [clearDropState]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ワークスペース</h1>
      </div>

      <div className="mb-6 flex items-center justify-end">
        <CreateItemButton parentId="" />
      </div>

      {sortedItems.length > 0 ? (
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
            items={sortedItems.map((item) => item.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sortedItems.map((item) => (
                <SortableItemCard
                  key={item.id}
                  item={item}
                  isDropTarget={dropTargetId === item.id}
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
