'use client';

import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';
import Link from 'next/link';
import { SidebarGroupLabel, SidebarMenu } from '@/components/ui/sidebar';
import type { Item as ItemType } from '@/features/item/types';
import { Item } from './item';
import { CreateItemButton } from './create-item-button';
import { useMenuDrag } from './use-menu-drag';
import { useItemDrag } from '@/features/layout/hooks/use-item-drag';
import {
  customCollisionDetection,
  WORKSPACE_ROOT_ID,
} from '@/features/layout/utils/collision-detection';
import { ITEM_CONFIGS } from '@/features/item/constants';

type WorkspaceItemsWrapperProps = {
  items: ItemType[];
};

export function WorkspaceItemsWrapper({ items }: WorkspaceItemsWrapperProps) {
  // メニュー固有のUI状態管理
  const {
    sensors,
    overId,
    dropPosition,
    insideTargetId,
    activeItem,
    handleDragStart,
    handleDragOver,
    handleDragCancel,
    clearDragState,
  } = useMenuDrag(items);

  // 汎用的なドラッグロジック（現在の状態を渡す）
  const { handleDragEnd: handleItemDragEnd } = useItemDrag({
    items,
    insideTargetId,
    overId,
    dropPosition,
  });

  // ドラッグ終了時の処理
  const handleDragEnd = async (
    event: Parameters<typeof handleItemDragEnd>[0]
  ) => {
    await handleItemDragEnd(event);
    clearDragState();
  };

  const { setNodeRef: setWorkspaceRootRef } = useDroppable({
    id: WORKSPACE_ROOT_ID,
    data: {
      type: 'workspace-root',
    },
  });

  const { setNodeRef: setWorkspaceMenuRef } = useDroppable({
    id: 'workspace-menu',
    data: {
      type: 'workspace-menu',
    },
  });

  const isWorkspaceRootOver =
    (overId === WORKSPACE_ROOT_ID || overId === 'workspace-menu') &&
    dropPosition === 'inside';

  if (items.length === 0) {
    return (
      <>
        <SidebarGroupLabel
          ref={setWorkspaceRootRef}
          asChild
          className={isWorkspaceRootOver ? 'bg-primary/20' : ''}
        >
          <div className="flex items-center w-full group/workspace hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ">
            <Link href="/workspace" className="flex-1">
              <span>ワークスペース</span>
            </Link>
            <CreateItemButton parentId="" />
          </div>
        </SidebarGroupLabel>
        <SidebarMenu ref={setWorkspaceMenuRef}>
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
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SidebarGroupLabel
        ref={setWorkspaceRootRef}
        asChild
        className={isWorkspaceRootOver ? 'bg-primary/20' : ''}
      >
        <div className="flex items-center w-full group/workspace hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ">
          <Link href="/workspace" className="flex-1">
            <span>ワークスペース</span>
          </Link>
          <CreateItemButton parentId="" />
        </div>
      </SidebarGroupLabel>
      <SidebarMenu ref={setWorkspaceMenuRef} className="min-h-[200px]">
        {items.map((item) => (
          <Item
            key={item.id}
            item={item}
            overId={overId}
            dropPosition={dropPosition}
            insideTargetId={insideTargetId}
            activeItem={activeItem}
          />
        ))}
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
