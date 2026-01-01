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
import { getSettings } from '@/features/setting/api';

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
  const settings = await getSettings();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-1">
          <div
            className={`flex items-center justify-start rounded-lg overflow-hidden ${
              settings.showTitleInIcon ? 'h-7 w-full' : 'h-7 w-7'
            }`}
          >
            <Image
              src={settings.appIcon}
              alt="App Icon"
              width={settings.showTitleInIcon ? 200 : 28}
              height={28}
              className="object-contain object-left"
            />
          </div>
          {!settings.showTitleInIcon && (
            <div className="flex flex-col">
              <span className="text-base font-semibold">
                {settings.appTitle}
              </span>
            </div>
          )}
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
