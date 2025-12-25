'use client';

import { Ellipsis, FileOutput, FileInput } from 'lucide-react';
import type { ItemType } from '@prisma/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

/**
 * アイテムオプションボタンのProps型
 */
type ItemOptionsButtonProps = {
  itemType: ItemType;
};

/**
 * アイテムオプションボタンコンポーネント
 * アイテムタイプに応じてインポート/エクスポートオプションを表示
 */
export function ItemOptionsButton({ itemType }: ItemOptionsButtonProps) {
  // TABLEのみボタンを表示
  if (itemType !== 'TABLE') {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Ellipsis />
          <span className="sr-only">オプション</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <FileInput />
          インポート
        </DropdownMenuItem>
        <DropdownMenuItem>
          <FileOutput />
          エクスポート
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
