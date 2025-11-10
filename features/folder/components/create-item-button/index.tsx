'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { CreateFolderItem } from './create-folder-item';
import { CreateTableItem } from './create-table-item';

type CreateItemButtonProps = {
  workspaceId: string;
};

export function CreateItemButton({ workspaceId }: CreateItemButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus />
          新規作成
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <CreateFolderItem workspaceId={workspaceId} />
        <CreateTableItem workspaceId={workspaceId} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { CreateFolderItem } from './create-folder-item';
export { CreateTableItem } from './create-table-item';
