'use client';

import { useState, useCallback, useMemo } from 'react';
import type { UserRole } from '@prisma/client';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import Link from 'next/link';
import { SidebarGroupLabel, SidebarMenu } from '@/components/ui/sidebar';
import { canManageStructure } from '@/lib/permissions';
import type { Item as ItemType } from '@/features/item/types';
import { SortableTreeItem } from './sortable-tree-item';
import { CreateItemButton } from './create-item-button';
import { ITEM_CONFIGS } from '@/features/item/constants';
import { reorderItems } from '@/features/item/api';
import { toast } from 'sonner';
import {
  flattenTree,
  getProjection,
  getChildrenIds,
} from '@/features/layout/utils/sortable-tree-utils';
import { useLocalStorage } from '@/hooks/use-local-storage';

// インデント幅（ピクセル）
const INDENTATION_WIDTH = 20;

/**
 * ワークスペースアイテムラッパーのProps型
 */
type WorkspaceItemsWrapperProps = {
  items: ItemType[];
  userRole: UserRole;
};

/**
 * ワークスペースアイテムラッパーコンポーネント
 */
export function WorkspaceItemsWrapper({
  items,
  userRole,
}: WorkspaceItemsWrapperProps) {
  const canEdit = canManageStructure(userRole);

  // ドラッグ状態
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  // 初期の全展開IDリストを生成
  const initialExpandedIds = useMemo(() => {
    const allFolderIds: string[] = [];
    const collectFolderIds = (items: ItemType[]) => {
      items.forEach((item) => {
        if (ITEM_CONFIGS[item.type].canHaveChildren) {
          allFolderIds.push(item.id);
        }
        if (item.children) {
          collectFolderIds(item.children);
        }
      });
    };
    collectFolderIds(items);
    return allFolderIds;
  }, [items]);

  // 展開状態（LocalStorageで永続化）
  const [expandedIds, setExpandedIds] = useLocalStorage<string[]>(
    'workspace-expanded-items',
    initialExpandedIds
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // ツリーをフラット化
  const flattenedItems = useMemo(() => {
    const flattened = flattenTree(items);
    // 展開されていないフォルダの子は非表示
    return flattened.filter(
      (item) => item.parentId === null || expandedIds.includes(item.parentId)
    );
  }, [items, expandedIds]);

  // ソート用のIDリスト
  const sortedIds = useMemo(
    () => flattenedItems.map((item) => item.id),
    [flattenedItems]
  );

  // 投影（移動先の計算）
  const projected = useMemo(() => {
    if (!activeId || !overId) return null;
    return getProjection(
      flattenedItems,
      activeId,
      overId,
      offsetLeft,
      INDENTATION_WIDTH
    );
  }, [flattenedItems, activeId, overId, offsetLeft]);

  // アクティブなアイテム
  const activeItem = useMemo(
    () => flattenedItems.find((item) => item.id === activeId),
    [flattenedItems, activeId]
  );

  // フォルダの展開/折りたたみ
  const handleToggleExpand = useCallback(
    (id: string) => {
      setExpandedIds((prev) => {
        if (prev.includes(id)) {
          // 閉じる場合は子孫のIDも削除
          const childrenIds = getChildrenIds(flattenedItems, id);
          return prev.filter(
            (expandedId) =>
              expandedId !== id && !childrenIds.includes(expandedId)
          );
        } else {
          return [...prev, id];
        }
      });
    },
    [flattenedItems, setExpandedIds]
  );

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      if (!canEdit) return;
      const activeIdStr = active.id as string;
      setActiveId(activeIdStr);
      setOverId(activeIdStr);

      // ドラッグ中のアイテムとその子を閉じる
      const childrenIds = getChildrenIds(flattenedItems, activeIdStr);
      setExpandedIds((prev) =>
        prev.filter((id) => id !== activeIdStr && !childrenIds.includes(id))
      );
    },
    [canEdit, flattenedItems, setExpandedIds]
  );

  const handleDragMove = useCallback(({ delta }: DragMoveEvent) => {
    setOffsetLeft(delta.x);
  }, []);

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    setOverId((over?.id as string) ?? null);
  }, []);

  const handleDragEnd = useCallback(
    async ({ active, over }: DragEndEvent) => {
      // 状態をリセット
      setActiveId(null);
      setOverId(null);
      setOffsetLeft(0);

      if (!over || !projected) {
        return;
      }

      const { parentId: newParentId, depth } = projected;
      const activeIdStr = active.id as string;
      const overIdStr = over.id as string;

      // 移動処理
      const clonedItems = [...flattenedItems];
      const overIndex = clonedItems.findIndex((item) => item.id === overIdStr);
      const activeIndex = clonedItems.findIndex(
        (item) => item.id === activeIdStr
      );

      if (overIndex === -1 || activeIndex === -1) {
        return;
      }

      const activeTreeItem = clonedItems[activeIndex];

      // 自分自身の子孫には移動できない
      const childrenIds = getChildrenIds(clonedItems, activeIdStr);
      if (newParentId && childrenIds.includes(newParentId)) {
        toast.error('子孫フォルダには移動できません');
        return;
      }

      // テーブルの子にはなれない
      if (newParentId) {
        const parentItem = clonedItems.find((item) => item.id === newParentId);
        if (parentItem && !ITEM_CONFIGS[parentItem.type].droppable) {
          toast.error('テーブルにはアイテムを移動できません');
          return;
        }
      }

      // アイテムの親と深さを更新
      clonedItems[activeIndex] = {
        ...activeTreeItem,
        parentId: newParentId,
        depth,
      };

      // 配列を並び替え
      const sortedItems = [...clonedItems];
      const [removed] = sortedItems.splice(activeIndex, 1);
      sortedItems.splice(overIndex, 0, removed);

      // 新しい親の兄弟アイテムを取得してorder計算
      const newSiblings = sortedItems.filter(
        (item) => item.parentId === newParentId
      );
      const reorderedSiblings = newSiblings.map((s, index) => ({
        id: s.id,
        order: index,
      }));

      const result = await reorderItems({
        itemId: activeIdStr,
        newParentId,
        reorderedSiblings,
      });

      if (!result.success) {
        toast.error(result.error || 'アイテムの移動に失敗しました');
      } else {
        // 新しい親が閉じている場合は開く
        if (newParentId && !expandedIds.includes(newParentId)) {
          setExpandedIds((prev) => [...prev, newParentId]);
        }
      }
    },
    [projected, expandedIds, setExpandedIds, flattenedItems]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverId(null);
    setOffsetLeft(0);
  }, []);

  if (items.length === 0) {
    return (
      <>
        <SidebarGroupLabel asChild>
          <div className="flex items-center w-full group/workspace hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
            <Link href="/workspace" className="flex-1">
              <span>ワークスペース</span>
            </Link>
            {canEdit && <CreateItemButton parentId="" />}
          </div>
        </SidebarGroupLabel>
        <SidebarMenu>
          <div className="px-2 py-4">
            <p className="text-sm text-muted-foreground">
              ワークスペースがありません
            </p>
          </div>
        </SidebarMenu>
      </>
    );
  }

  return (
    <DndContext
      sensors={canEdit ? sensors : []}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SidebarGroupLabel asChild>
        <div className="flex items-center w-full group/workspace hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
          <Link href="/workspace" className="flex-1">
            <span>ワークスペース</span>
          </Link>
          {canEdit && <CreateItemButton parentId="" />}
        </div>
      </SidebarGroupLabel>
      <SidebarMenu className="min-h-[200px]">
        <SortableContext
          items={sortedIds}
          strategy={verticalListSortingStrategy}
        >
          {flattenedItems.map((item) => (
            <SortableTreeItem
              key={item.id}
              item={item}
              depth={item.depth}
              projected={
                activeId === item.id && projected ? projected : undefined
              }
              isExpanded={expandedIds.includes(item.id)}
              onToggleExpand={handleToggleExpand}
              userRole={userRole}
              indentationWidth={INDENTATION_WIDTH}
            />
          ))}
        </SortableContext>
      </SidebarMenu>
      <DragOverlay>
        {activeItem ? (
          <div className="flex items-center gap-2 bg-sidebar-accent text-sidebar-accent-foreground px-2 py-1.5 rounded-md shadow-lg">
            {(() => {
              const Icon = ITEM_CONFIGS[activeItem.type].icon;
              return <Icon className="size-4" />;
            })()}
            <span className="text-sm font-medium">{activeItem.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
