'use client';

import { useState } from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import Link from 'next/link';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { CreateItemButton } from './create-item-button';
import { EditItemButton } from './edit-item-button';
import type { Folder as FolderType } from '@/features/folder/types';

type DropPosition = 'before' | 'after' | 'inside';

type FolderItemProps = {
  folder: FolderType;
  level?: number;
  overId?: string | null;
  dropPosition?: DropPosition;
  insideTargetId?: string | null;
  isUnderInsideTarget?: boolean;
  activeFolder?: FolderType | null;
};

export function FolderItem({
  folder,
  level = 0,
  overId,
  dropPosition,
  insideTargetId,
  isUnderInsideTarget = false,
  activeFolder,
}: FolderItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const isOver = overId === folder.id;

  const isInsideTarget = insideTargetId === folder.id;
  const shouldHighlight = isInsideTarget || isUnderInsideTarget;

  // 同じ親を持つかチェック（青いラインを表示するかの判定用）
  const isSameParent =
    activeFolder && isOver ? activeFolder.parentId === folder.parentId : false;
  const shouldShowLine = isOver && isSameParent && dropPosition !== 'inside';

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: folder.id,
    data: {
      type: 'folder',
      folder,
    },
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: folder.id,
    data: {
      type: 'folder',
      folder,
    },
  });

  // refを結合
  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  const style = {
    opacity: isDragging ? 0.5 : 1,
  };

  // Workspace Menu Item
  if (level === 0) {
    return (
      <SidebarMenuItem ref={setNodeRef} style={style}>
        {/* ドロップインジケーター - 前 */}
        {shouldShowLine && dropPosition === 'before' && (
          <div className="h-0.5 bg-primary -mt-1 mb-1 rounded-full" />
        )}

        <SidebarMenuButton
          asChild
          className={
            shouldHighlight && dropPosition === 'inside' ? 'bg-primary/20' : ''
          }
        >
          <div
            {...attributes}
            {...listeners}
            className="flex items-center w-full group/item touch-none"
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="flex items-center justify-center shrink-0 rounded hover:bg-primary/10"
            >
              <Folder className="size-4 group-hover/item:hidden" />
              <ChevronRight
                className={`size-4 hidden group-hover/item:block transition-transform duration-200 ${
                  isOpen ? 'rotate-90' : ''
                }`}
              />
            </button>
            <Link href={`/${folder.id}`} className="flex-1">
              <span>{folder.name}</span>
            </Link>
            <EditItemButton folderId={folder.id} folderName={folder.name} />
            <CreateItemButton workspaceId={folder.id} />
          </div>
        </SidebarMenuButton>

        {hasChildren && isOpen && (
          <SidebarMenuSub className="mr-0 pr-0">
            {folder.children!.map((child) => (
              <FolderItem
                key={child.id}
                folder={child}
                level={level + 1}
                overId={overId}
                dropPosition={dropPosition}
                insideTargetId={insideTargetId}
                isUnderInsideTarget={
                  shouldHighlight && dropPosition === 'inside'
                }
                activeFolder={activeFolder}
              />
            ))}
          </SidebarMenuSub>
        )}

        {/* ドロップインジケーター - 後（子なしまたは折りたたみ済み） */}
        {shouldShowLine &&
          dropPosition === 'after' &&
          (!hasChildren || !isOpen) && (
            <div className="h-0.5 bg-primary mt-1 -mb-1 rounded-full" />
          )}
        {/* ドロップインジケーター - 後（子が表示されている場合） */}
        {shouldShowLine &&
          dropPosition === 'after' &&
          hasChildren &&
          isOpen && (
            <div className="h-0.5 bg-primary mt-2 -mb-1 rounded-full" />
          )}
      </SidebarMenuItem>
    );
  }

  // Workspace Menu Sub Item
  return (
    <SidebarMenuSubItem ref={setNodeRef} style={style}>
      {/* ドロップインジケーター - 前 */}
      {shouldShowLine && dropPosition === 'before' && (
        <div className="h-0.5 bg-primary -mt-1 mb-1 rounded-full" />
      )}

      <SidebarMenuSubButton
        asChild
        className={
          shouldHighlight && dropPosition === 'inside' ? 'bg-primary/20' : ''
        }
      >
        <div
          {...attributes}
          {...listeners}
          className="flex items-center w-full group/item touch-none"
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="flex items-center justify-center shrink-0 rounded hover:bg-primary/10"
          >
            <Folder className="size-4 group-hover/item:hidden" />
            <ChevronRight
              className={`size-4 hidden group-hover/item:block transition-transform duration-200 ${
                isOpen ? 'rotate-90' : ''
              }`}
            />
          </button>
          <Link href={`/${folder.id}`} className="flex-1">
            <span>{folder.name}</span>
          </Link>
          <EditItemButton folderId={folder.id} folderName={folder.name} />
          <CreateItemButton workspaceId={folder.id} />
        </div>
      </SidebarMenuSubButton>

      {hasChildren && isOpen && (
        <SidebarMenuSub className="mr-0 pr-0">
          {folder.children!.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              overId={overId}
              dropPosition={dropPosition}
              insideTargetId={insideTargetId}
              isUnderInsideTarget={shouldHighlight && dropPosition === 'inside'}
              activeFolder={activeFolder}
            />
          ))}
        </SidebarMenuSub>
      )}

      {/* ドロップインジケーター - 後（子なしまたは折りたたみ済み） */}
      {shouldShowLine &&
        dropPosition === 'after' &&
        (!hasChildren || !isOpen) && (
          <div className="h-0.5 bg-primary mt-1 -mb-1 rounded-full" />
        )}
      {/* ドロップインジケーター - 後（子が表示されている場合） */}
      {shouldShowLine && dropPosition === 'after' && hasChildren && isOpen && (
        <div className="h-0.5 bg-primary mt-2 -mb-1 rounded-full" />
      )}
    </SidebarMenuSubItem>
  );
}
