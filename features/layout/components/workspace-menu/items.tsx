'use client';

import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';
import Link from 'next/link';
import { SidebarGroupLabel, SidebarMenu } from '@/components/ui/sidebar';
import type { Folder as FolderType } from '@/features/folder/types';
import { WorkspaceItems } from './workspace-items';
import { Folder } from 'lucide-react';
import { CreateItemButton } from './create-item-button';
import { useMenuDrag } from './use-menu-drag';
import { useFolderDrag } from '@/features/layout/hooks/use-folder-drag';
import {
  customCollisionDetection,
  WORKSPACE_ROOT_ID,
} from '@/features/layout/utils/collision-detection';

type WorkspaceItemsWrapperProps = {
  folders: FolderType[];
};

export function WorkspaceItemsWrapper({ folders }: WorkspaceItemsWrapperProps) {
  // メニュー固有のUI状態管理
  const {
    sensors,
    overId,
    dropPosition,
    insideTargetId,
    activeFolder,
    handleDragStart,
    handleDragOver,
    handleDragCancel,
    clearDragState,
  } = useMenuDrag(folders);

  // 汎用的なドラッグロジック（現在の状態を渡す）
  const { handleDragEnd: handleFolderDragEnd } = useFolderDrag({
    folders,
    insideTargetId,
    overId,
    dropPosition,
  });

  // ドラッグ終了時の処理
  const handleDragEnd = async (
    event: Parameters<typeof handleFolderDragEnd>[0]
  ) => {
    await handleFolderDragEnd(event);
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

  if (folders.length === 0) {
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
            <CreateItemButton workspaceId="" />
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
          <CreateItemButton workspaceId="" />
        </div>
      </SidebarGroupLabel>
      <SidebarMenu ref={setWorkspaceMenuRef} className="min-h-[200px]">
        <WorkspaceItems
          folders={folders}
          overId={overId}
          dropPosition={dropPosition}
          insideTargetId={insideTargetId}
          activeFolder={activeFolder}
        />
      </SidebarMenu>
      <DragOverlay>
        {activeFolder ? (
          <div className="flex items-center gap-2 bg-sidebar-accent text-sidebar-accent-foreground px-2 py-1.5 rounded-md shadow-lg">
            <Folder className="size-4" />
            <span className="text-sm font-medium">{activeFolder.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
