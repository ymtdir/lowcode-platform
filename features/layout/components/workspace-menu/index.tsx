'use client';

import { SidebarGroup } from '@/components/ui/sidebar';

import { WorkspaceItemsWrapper } from './workspace-items';
import type { Item } from '@/features/item/types';

/**
 * ワークスペースメニューのProps型
 */
type WorkspaceMenuProps = {
  items: Item[];
};

/**
 * ワークスペースメニューコンポーネント
 */
export function WorkspaceMenu({ items }: WorkspaceMenuProps) {
  return (
    <SidebarGroup>
      <WorkspaceItemsWrapper items={items} />
    </SidebarGroup>
  );
}
