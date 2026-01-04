'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getItemIcon } from '@/features/item/utils';
import { ITEM_CONFIGS } from '@/features/item/constants';
import { reorderItems } from '@/features/item/api';
import { CreateItemButton } from '@/features/item/components';
import type { Item } from '@/features/item/types';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DROP_DELAY_MS = 800;
const CLICK_DELAY_MS = 300;
const DRAG_ACTIVATION_DISTANCE = 8;

type FolderLayoutProps = {
  item: Item & { type: 'FOLDER' };
};

const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0
    ? pointerCollisions
    : rectIntersection(args);
};

function SortableGridItem({
  child,
  Icon,
  DefaultIcon,
  preventClick,
  isDropTarget,
}: {
  child: Item;
  Icon: React.ComponentType<{ className?: string }>;
  DefaultIcon: React.ComponentType<{ className?: string }>;
  preventClick: boolean;
  isDropTarget: boolean;
}) {
  const router = useRouter();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: child.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!preventClick && !isDragging) {
      router.push(`/${child.id}`);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none cursor-pointer"
      onClick={handleClick}
    >
      <Card
        className={`flex flex-col h-full p-4 ${isDropTarget ? 'bg-primary/10' : ''}`}
      >
        <div className="flex justify-end mb-2">
          <Badge variant="secondary" className="flex items-center">
            <DefaultIcon className="size-5!" />
          </Badge>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Icon className="size-12 text-primary" />
        </div>
        <div className="text-center mt-2">
          <h2 className="font-semibold text-lg line-clamp-2">{child.name}</h2>
        </div>
      </Card>
    </div>
  );
}

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

  const handleDragStart = useCallback(() => {
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
      setTimeout(() => setPreventClick(false), CLICK_DELAY_MS);

      if (!over || active.id === over.id) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // フォルダへのドロップ
      if (targetId === overId) {
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
              {sortedChildren.map((child) => {
                const Icon = getItemIcon(child);
                const DefaultIcon = ITEM_CONFIGS[child.type].icon;
                return (
                  <SortableGridItem
                    key={child.id}
                    child={child}
                    Icon={Icon}
                    DefaultIcon={DefaultIcon}
                    preventClick={preventClick}
                    isDropTarget={dropTargetId === child.id}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">このフォルダは空です</p>
          <p className="text-sm text-muted-foreground mt-2">
            サイドバーの「ワークスペース」から新しいアイテムを作成できます
          </p>
        </div>
      )}
    </div>
  );
}
