'use client';

import { useState } from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import Link from 'next/link';
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

type FolderItemProps = {
  folder: FolderType;
  level?: number;
};

export function FolderItem({ folder, level = 0 }: FolderItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;

  // Workspace Menu Item
  if (level === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <div className="flex items-center w-full group/item">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="flex items-center justify-center shrink-0 rounded hover:bg-primary/10 cursor-pointer"
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
              <FolderItem key={child.id} folder={child} level={level + 1} />
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  }

  // Workspace Menu Sub Item
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>
        <div className="flex items-center w-full group/item">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="flex items-center justify-center shrink-0 rounded hover:bg-primary/10 cursor-pointer"
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
            <FolderItem key={child.id} folder={child} level={level + 1} />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuSubItem>
  );
}
