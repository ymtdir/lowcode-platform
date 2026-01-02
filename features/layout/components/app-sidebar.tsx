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
          {settings.hideAppName ? (
            <div className="flex items-center h-7">
              <Image
                src={settings.appIcon}
                alt="App Icon"
                width={0}
                height={28}
                sizes="100vw"
                style={{ width: 'auto', height: '28px' }}
                className="object-contain"
              />
            </div>
          ) : (
            <>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden shrink-0">
                <Image
                  src={settings.appIcon}
                  alt="App Icon"
                  width={28}
                  height={28}
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold">
                  {settings.appName}
                </span>
              </div>
            </>
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
