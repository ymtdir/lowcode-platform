'use client';

import { useState } from 'react';
import { Ellipsis } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RenameAssetOption } from './rename-asset-option';
import { DeleteAssetOption } from './delete-asset-option';

/**
 * アセット編集ボタンのProps型
 */
type EditAssetButtonProps = {
  assetName: string;
  onRename: (newName: string) => void;
  onDelete: () => void;
};

/**
 * アセット編集ボタンコンポーネント
 */
export function EditAssetButton({
  assetName,
  onRename,
  onDelete,
}: EditAssetButtonProps) {
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
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          className="opacity-0 group-hover/asset:opacity-100 flex items-center justify-center size-5 shrink-0 rounded hover:bg-primary/10 transition-opacity outline-none"
        >
          <Ellipsis />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4}>
        <RenameAssetOption
          currentName={assetName}
          onRename={onRename}
          onOpenChange={setOpen}
        />
        <DeleteAssetOption
          assetName={assetName}
          onDelete={onDelete}
          onOpenChange={setOpen}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
