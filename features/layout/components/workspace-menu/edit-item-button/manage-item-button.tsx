'use client';

import { Settings } from 'lucide-react';
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
  // FOLDERとTABLEの場合のみ表示
  if (itemType !== 'TABLE' && itemType !== 'FOLDER') {
    return null;
  }

  const label = itemType === 'TABLE' ? 'テーブル管理' : 'フォルダ管理';

  return (
    <DropdownMenuItem asChild>
      <Link href={`/${itemId}/edit`} className="cursor-pointer">
        <Settings />
        {label}
      </Link>
    </DropdownMenuItem>
  );
}
