'use client';

import { ChevronRight, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Folder as FolderType } from '@/features/folder/types';

type WorkspaceItemsProps = {
  folders: FolderType[];
};

export function WorkspaceItems({ folders }: WorkspaceItemsProps) {
  if (folders.length === 0) {
    return (
      <div className="px-2 py-4">
        <p className="text-sm text-muted-foreground">
          ワークスペースがありません
        </p>
      </div>
    );
  }

  return (
    <>
      {folders.map((folder) => {
        return (
          <Collapsible
            key={folder.id}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <div className="flex w-full items-center">
                <SidebarMenuButton asChild className="flex-1">
                  <Link href={`/${folder.id}`}>
                    <LayoutDashboard />
                    <span>{folder.name}</span>
                  </Link>
                </SidebarMenuButton>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="h-auto w-auto p-1 hover:bg-transparent">
                    <ChevronRight className="cursor-pointer h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {folder.children && folder.children.length > 0 ? (
                    folder.children.map((child: FolderType) => {
                      return (
                        <SidebarMenuSubItem key={child.id}>
                          <Link href={`/${child.id}`}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>{child.name}</span>
                          </Link>
                        </SidebarMenuSubItem>
                      );
                    })
                  ) : (
                    <SidebarMenuSubItem></SidebarMenuSubItem>
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        );
      })}
    </>
  );
}
