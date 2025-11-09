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
import { getFolders } from '@/features/folder/api';

type AppSidebarProps = {
  userName: string;
};

export async function AppSidebar({ userName }: AppSidebarProps) {
  const folders = await getFolders();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-base font-bold text-primary-foreground">
              L
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold">Lowcode Platform</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <MainMenu items={mainMenuItems} />
        <WorkspaceMenu folders={folders} />
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
