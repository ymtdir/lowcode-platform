'use client';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';

import { WorkspaceItems } from './items';
import { CreateWorkspaceButton } from '@/features/folder/components';
import type { Folder } from '@/features/folder/types';

type WorkspaceMenuProps = {
  folders: Folder[];
};

export function WorkspaceMenu({ folders }: WorkspaceMenuProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>ワークスペース</SidebarGroupLabel>
      <CreateWorkspaceButton />
      <SidebarMenu>
        <WorkspaceItems folders={folders} />
      </SidebarMenu>
    </SidebarGroup>
  );
}
