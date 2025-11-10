'use client';

import { Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateFolderItem } from './create-folder-item';
import { CreateTableItem } from './create-table-item';

type CreateItemButtonProps = {
  workspaceId: string;
  variant?: 'item' | 'workspace';
};

export function CreateItemButton({
  workspaceId,
  variant = 'item',
}: CreateItemButtonProps) {
  const buttonClassName =
    variant === 'workspace'
      ? 'hidden group-hover/workspace:flex items-center justify-center size-5 shrink-0 rounded hover:bg-primary/10 cursor-pointer transition-colors ml-auto outline-none focus:outline-none'
      : 'opacity-0 group-hover/item:opacity-100 pointer-events-none group-hover/item:pointer-events-auto flex items-center justify-center size-5 shrink-0 rounded hover:bg-primary/10 cursor-pointer transition-opacity outline-none focus:outline-none';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={buttonClassName}
        >
          <Plus className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4}>
        <CreateFolderItem workspaceId={workspaceId} />
        <CreateTableItem workspaceId={workspaceId} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
