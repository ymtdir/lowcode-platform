import { ChevronUp, User2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton } from '@/components/ui/sidebar';

import { AccountSettingsItem } from './account-settings-item';
import { LogoutItem } from './logout-item';

type UserMenuProps = {
  userName: string;
};

export function UserMenu({ userName }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton>
          <User2 /> {userName}
          <ChevronUp className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top">
        <AccountSettingsItem />
        <LogoutItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { AccountSettingsItem } from './account-settings-item';
export { LogoutItem } from './logout-item';
