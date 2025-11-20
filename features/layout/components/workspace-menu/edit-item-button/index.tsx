'use client';

import { useState } from 'react';
import { Ellipsis } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RenameFolderItem } from './rename-item-button';
import { DeleteFolderItem } from './delete-item-button';

/**
 * アイテム編集ボタンのProps型
 */
type EditItemButtonProps = {
  itemId: string;
  itemName: string;
};

/**
 * アイテム編集ボタンコンポーネント
 */
export function EditItemButton({ itemId, itemName }: EditItemButtonProps) {
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
          className="opacity-0 group-hover/item:opacity-100 pointer-events-none group-hover/item:pointer-events-auto flex items-center justify-center size-5 shrink-0 rounded hover:bg-primary/10  transition-opacity outline-none focus:outline-none"
        >
          <Ellipsis className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4}>
        <RenameFolderItem
          folderId={itemId}
          currentName={itemName}
          onOpenChange={setOpen}
        />
        <DeleteFolderItem
          folderId={itemId}
          folderName={itemName}
          onOpenChange={setOpen}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
