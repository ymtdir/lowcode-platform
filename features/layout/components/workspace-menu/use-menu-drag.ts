import { useState, useRef, useMemo } from 'react';
import {
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { Item as ItemType } from '@/features/item/types';
import { WORKSPACE_ROOT_ID } from '@/features/layout/utils/collision-detection';

type DropPosition = 'before' | 'after' | 'inside';

/**
 * workspace-menu固有のドラッグUI状態管理
 * ホバー時の表示制御など、UI関連のロジックを扱う
 */
export function useMenuDrag(items: ItemType[]) {
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition>('after');
  const [insideTargetId, setInsideTargetId] = useState<string | null>(null);
  const dropIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentOverIdRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over, delta } = event;

    if (!over || active.id === over.id) {
      if (!over) {
        console.log('❌ No over detected in handleDragOver - fallback to root');

        if (currentOverIdRef.current !== WORKSPACE_ROOT_ID) {
          currentOverIdRef.current = WORKSPACE_ROOT_ID;
          setOverId(WORKSPACE_ROOT_ID);
          setDropPosition('inside');
          setInsideTargetId(WORKSPACE_ROOT_ID);
        }

        if (dropIndicatorTimeoutRef.current) {
          clearTimeout(dropIndicatorTimeoutRef.current);
          dropIndicatorTimeoutRef.current = null;
        }
      }
      return;
    }

    const overIdString = over.id as string;
    console.log('🔍 handleDragOver:', overIdString);
    setOverId(overIdString);

    const activeItem = flattenedItems.find((i) => i.id === active.id);

    if (
      overIdString === WORKSPACE_ROOT_ID ||
      overIdString === 'workspace-menu'
    ) {
      console.log('🟡 Over workspace root/menu', overIdString);
      if (currentOverIdRef.current !== overIdString) {
        currentOverIdRef.current = overIdString;
        setInsideTargetId(null);

        if (dropIndicatorTimeoutRef.current) {
          clearTimeout(dropIndicatorTimeoutRef.current);
        }

        setDropPosition('inside');
        setInsideTargetId(WORKSPACE_ROOT_ID);
        console.log('🟢 Set insideTargetId to WORKSPACE_ROOT_ID');
      }
      return;
    }

    const overItem = flattenedItems.find((i) => i.id === overIdString);

    if (!activeItem || !overItem) return;

    const isSameParent = activeItem.parentId === overItem.parentId;

    const isDescendantOfInsideTarget = (
      itemId: string,
      targetId: string | null
    ): boolean => {
      if (!targetId) return false;
      if (itemId === targetId) return true;
      const item = flattenedItems.find((i) => i.id === itemId);
      if (!item || !item.parentId) return false;
      return isDescendantOfInsideTarget(item.parentId, targetId);
    };

    if (
      insideTargetId &&
      isDescendantOfInsideTarget(overIdString, insideTargetId)
    ) {
      return;
    }

    if (currentOverIdRef.current !== overIdString) {
      currentOverIdRef.current = overIdString;
      setInsideTargetId(null);

      if (dropIndicatorTimeoutRef.current) {
        clearTimeout(dropIndicatorTimeoutRef.current);
      }

      const newPosition: DropPosition = delta.y < 0 ? 'before' : 'after';
      setDropPosition(newPosition);

      dropIndicatorTimeoutRef.current = setTimeout(() => {
        setDropPosition('inside');
        setInsideTargetId(overIdString);
      }, 800);
    } else {
      if (isSameParent && dropPosition !== 'inside') {
        const newPosition: DropPosition = delta.y < 0 ? 'before' : 'after';
        setDropPosition(newPosition);
      }
    }
  };

  const handleDragCancel = () => {
    if (dropIndicatorTimeoutRef.current) {
      clearTimeout(dropIndicatorTimeoutRef.current);
      dropIndicatorTimeoutRef.current = null;
    }

    currentOverIdRef.current = null;
    setActiveId(null);
    setOverId(null);
    setDropPosition('after');
    setInsideTargetId(null);
  };

  const clearDragState = () => {
    if (dropIndicatorTimeoutRef.current) {
      clearTimeout(dropIndicatorTimeoutRef.current);
      dropIndicatorTimeoutRef.current = null;
    }

    currentOverIdRef.current = null;
    setActiveId(null);
    setOverId(null);
    setDropPosition('after');
    setInsideTargetId(null);
  };

  const activeItem = activeId
    ? (flattenedItems.find((i) => i.id === activeId) ?? null)
    : null;

  return {
    sensors,
    activeId,
    overId,
    dropPosition,
    insideTargetId,
    activeItem,
    handleDragStart,
    handleDragOver,
    handleDragCancel,
    clearDragState,
  };
}
