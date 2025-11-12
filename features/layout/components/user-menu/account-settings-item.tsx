'use client';

import { UserCog } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { ThemeSelector } from '@/features/theme/components/theme-selector';
import { ColorSelector } from '@/features/theme/components/color-selector';

export function AccountSettingsItem() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="cursor-pointer"
        >
          <UserCog />
          <span>アカウント設定</span>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="bg-card [&>button]:cursor-pointer">
        <DialogHeader>
          <DialogTitle>アカウント設定</DialogTitle>
          <Separator className="my-4" />
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">テーマ</h3>
            <ThemeSelector />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">カラー</h3>
            <ColorSelector />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
