'use client';

import type { UserRole } from '@prisma/client';
import { SidebarGroup } from '@/components/ui/sidebar';

import { WorkspaceItemsWrapper } from './workspace-items';
import type { Item } from '@/features/item/types';

/**
 * ワークスペースメニューのProps型
 */
type WorkspaceMenuProps = {
  items: Item[];
  userRole: UserRole;
};

/**
 * ワークスペースメニューコンポーネント
 */
export function WorkspaceMenu({ items, userRole }: WorkspaceMenuProps) {
  return (
    <SidebarGroup>
      <WorkspaceItemsWrapper items={items} userRole={userRole} />
    </SidebarGroup>
  );
}
