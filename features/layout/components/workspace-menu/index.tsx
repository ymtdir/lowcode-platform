'use client';

import { SidebarGroup } from '@/components/ui/sidebar';

import { WorkspaceItemsWrapper } from './items';
import type { Folder } from '@/features/folder/types';

type WorkspaceMenuProps = {
  folders: Folder[];
};

export function WorkspaceMenu({ folders }: WorkspaceMenuProps) {
  return (
    <SidebarGroup>
      <WorkspaceItemsWrapper folders={folders} />
    </SidebarGroup>
  );
}
