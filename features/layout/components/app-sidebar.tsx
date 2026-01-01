import type { UserRole } from '@prisma/client';
import Image from 'next/image';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { UserMenu } from './user-menu';
import { MainMenu, mainMenuItems } from './main-menu';
import { WorkspaceMenu } from './workspace-menu';
import { getItems } from '@/features/item/api';

/**
 * アプリケーションサイドバーのProps型
 */
type AppSidebarProps = {
  userName: string;
  userRole: UserRole;
};

/**
 * アプリケーションサイドバーコンポーネント
 */
export async function AppSidebar({ userName, userRole }: AppSidebarProps) {
  const items = await getItems();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden">
            <Image
              src="/system/app-icon.png"
              alt="App Icon"
              width={28}
              height={28}
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold">Lowcode Platform</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <MainMenu items={mainMenuItems} userRole={userRole} />
        <WorkspaceMenu items={items} userRole={userRole} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu userName={userName} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
