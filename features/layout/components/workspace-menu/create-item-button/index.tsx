'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateFolderButton } from './create-folder-button';
import { CreateTableButton } from './create-table-button';

type CreateItemButtonProps = {
  workspaceId: string;
};

export function CreateItemButton({ workspaceId }: CreateItemButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="opacity-0 group-hover/item:opacity-100 group-hover/workspace:opacity-100 pointer-events-none group-hover/item:pointer-events-auto group-hover/workspace:pointer-events-auto flex items-center justify-center size-5 shrink-0 rounded hover:bg-primary/10  transition-opacity outline-none focus:outline-none"
        >
          <Plus className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4}>
        <CreateFolderButton workspaceId={workspaceId} onOpenChange={setOpen} />
        <CreateTableButton workspaceId={workspaceId} onOpenChange={setOpen} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
