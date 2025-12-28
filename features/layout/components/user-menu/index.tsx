import { ChevronUp, User2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton } from '@/components/ui/sidebar';

import { AccountSettingsOption } from './account-settings-option';
import { LogoutOption } from './logout-option';

/**
 * ユーザーメニューのProps型
 */
type UserMenuProps = {
  userName: string;
};

/**
 * ユーザーメニューコンポーネント
 */
export function UserMenu({ userName }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton>
          <User2 /> {userName}
          <ChevronUp className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="py-1.5">
        <AccountSettingsOption />
        <LogoutOption />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { AccountSettingsOption } from './account-settings-option';
export { LogoutOption } from './logout-option';
