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

/**
 * アイテム作成ボタンのProps型
 */
type CreateItemButtonProps = {
  parentId: string;
};

/**
 * アイテム作成ボタンコンポーネント
 */
export function CreateItemButton({ parentId }: CreateItemButtonProps) {
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
        <CreateFolderButton parentId={parentId} onOpenChange={setOpen} />
        <CreateTableButton parentId={parentId} onOpenChange={setOpen} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
