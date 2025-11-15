import { useState, useRef, useMemo } from 'react';
import {
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { Folder as FolderType } from '@/features/folder/types';
import { WORKSPACE_ROOT_ID } from '@/features/layout/utils/collision-detection';

type DropPosition = 'before' | 'after' | 'inside';

/**
 * workspace-menu固有のドラッグUI状態管理
 * ホバー時の表示制御など、UI関連のロジックを扱う
 */
export function useMenuDrag(folders: FolderType[]) {
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

    const activeFolder = flattenedFolders.find((f) => f.id === active.id);

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

    const overFolder = flattenedFolders.find((f) => f.id === overIdString);

    if (!activeFolder || !overFolder) return;

    const isSameParent = activeFolder.parentId === overFolder.parentId;

    const isDescendantOfInsideTarget = (
      folderId: string,
      targetId: string | null
    ): boolean => {
      if (!targetId) return false;
      if (folderId === targetId) return true;
      const folder = flattenedFolders.find((f) => f.id === folderId);
      if (!folder || !folder.parentId) return false;
      return isDescendantOfInsideTarget(folder.parentId, targetId);
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

  const activeFolder = activeId
    ? (flattenedFolders.find((f) => f.id === activeId) ?? null)
    : null;

  return {
    sensors,
    activeId,
    overId,
    dropPosition,
    insideTargetId,
    activeFolder,
    handleDragStart,
    handleDragOver,
    handleDragCancel,
    clearDragState,
  };
}
