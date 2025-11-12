'use client';

import Link from 'next/link';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';

import { WorkspaceItems } from './items';
import { CreateItemButton } from './create-item-button';
import type { Folder } from '@/features/folder/types';

type WorkspaceMenuProps = {
  folders: Folder[];
};

export function WorkspaceMenu({ folders }: WorkspaceMenuProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel asChild>
        <div className="flex items-center w-full group/workspace hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ">
          <Link href="/workspace" className="flex-1">
            <span>ワークスペース</span>
          </Link>
          <CreateItemButton workspaceId="" />
        </div>
      </SidebarGroupLabel>
      <SidebarMenu>
        <WorkspaceItems folders={folders} />
      </SidebarMenu>
    </SidebarGroup>
  );
}
