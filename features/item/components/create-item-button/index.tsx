'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateFolderOption } from './create-folder-option';
import { CreateTableOption } from './create-table-option';

/**
 * アイテム作成ボタンのProps型
 */
type CreateItemButtonProps = {
  parentId?: string;
};

/**
 * アイテム作成ボタンコンポーネント
 */
export function CreateItemButton({ parentId }: CreateItemButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus />
          新規作成
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <CreateFolderOption parentId={parentId} onOpenChange={setOpen} />
        <CreateTableOption parentId={parentId} onOpenChange={setOpen} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
