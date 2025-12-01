import Link from 'next/link';
import type { UserRole } from '@prisma/client';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { hasRole } from '@/lib/permissions';

import type { MainMenuItem } from '../../types';

type MainMenuProps = {
  items: MainMenuItem[];
  userRole: UserRole;
};

/**
 * メインメニューコンポーネント
 * ユーザーのロールに応じてメニュー項目をフィルタリング
 */
export function MainMenu({ items, userRole }: MainMenuProps) {
  // ロールに応じてアクセス可能なメニュー項目をフィルタリング
  const visibleItems = items.filter((item) => {
    if (!item.requiredRole) return true;
    return hasRole(userRole, item.requiredRole);
  });

  return (
    <SidebarGroup>
      <SidebarMenu>
        {visibleItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild>
              <Link href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export type { MainMenuItem } from '../../types';
export { mainMenuItems } from './items';
