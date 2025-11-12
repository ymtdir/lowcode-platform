'use client';

import { Ellipsis } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RenameFolderItem } from './rename-folder-item';
import { DeleteFolderItem } from './delete-folder-item';

type EditItemButtonProps = {
  folderId: string;
  folderName: string;
};

export function EditItemButton({ folderId, folderName }: EditItemButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="opacity-0 group-hover/item:opacity-100 pointer-events-none group-hover/item:pointer-events-auto flex items-center justify-center size-5 shrink-0 rounded hover:bg-primary/10 cursor-pointer transition-opacity outline-none focus:outline-none"
        >
          <Ellipsis className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4}>
        <RenameFolderItem folderId={folderId} currentName={folderName} />
        <DeleteFolderItem folderId={folderId} folderName={folderName} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
