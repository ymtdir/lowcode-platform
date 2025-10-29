'use client';

import { UserCog } from 'lucide-react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AccountSettingsDialog } from './account-settings-dialog';

export function AccountSettingsItem() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <UserCog className="h-4 w-4" />
          <span>アカウント設定</span>
        </DropdownMenuItem>
      </DialogTrigger>
      <AccountSettingsDialog />
    </Dialog>
  );
}
