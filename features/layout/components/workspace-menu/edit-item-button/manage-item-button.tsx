'use client';

import { Settings2 } from 'lucide-react';
import Link from 'next/link';
import type { ItemType } from '@prisma/client';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

/**
 * アイテム管理ボタンのProps型
 */
type ManageItemButtonProps = {
  itemId: string;
  itemType: ItemType;
};

/**
 * アイテム管理ボタンコンポーネント
 * アイテムタイプに応じて管理画面へのリンクを表示
 */
export function ManageItemButton({ itemId, itemType }: ManageItemButtonProps) {
  // TABLEの場合のみ表示
  if (itemType !== 'TABLE') {
    return null;
  }

  return (
    <DropdownMenuItem asChild>
      <Link href={`/${itemId}/edit`} className="cursor-pointer">
        <Settings2 className="size-4" />
        テーブル管理
      </Link>
    </DropdownMenuItem>
  );
}
