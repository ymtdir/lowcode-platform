'use client';

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
      <SidebarGroupLabel className="group/workspace hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer">
        ワークスペース
        <CreateItemButton workspaceId="" variant="workspace" />
      </SidebarGroupLabel>
      <SidebarMenu>
        <WorkspaceItems folders={folders} />
      </SidebarMenu>
    </SidebarGroup>
  );
}
