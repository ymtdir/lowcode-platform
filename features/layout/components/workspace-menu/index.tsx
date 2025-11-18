'use client';

import { SidebarGroup } from '@/components/ui/sidebar';

import { WorkspaceItemsWrapper } from './items';
import type { Item } from '@/features/item/types';

type WorkspaceMenuProps = {
  items: Item[];
};

export function WorkspaceMenu({ items }: WorkspaceMenuProps) {
  return (
    <SidebarGroup>
      <WorkspaceItemsWrapper items={items} />
    </SidebarGroup>
  );
}
