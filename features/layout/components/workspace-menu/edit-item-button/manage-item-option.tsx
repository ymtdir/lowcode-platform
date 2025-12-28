'use client';

import { Settings } from 'lucide-react';
import Link from 'next/link';
import type { ItemType } from '@prisma/client';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

/**
 * アイテム管理オプションのProps型
 */
type ManageItemOptionProps = {
  itemId: string;
  itemType: ItemType;
};

/**
 * アイテム管理オプションコンポーネント
 * アイテムタイプに応じて管理画面へのリンクを表示
 */
export function ManageItemOption({ itemId, itemType }: ManageItemOptionProps) {
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
