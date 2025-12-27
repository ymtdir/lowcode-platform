'use client';

import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import type { ItemType } from '@prisma/client';
import { getItemById } from '@/features/item/api';
import { ItemOptionsButton } from './index';

/**
 * ページタイプ（Itemタイプまたは特定のページ）
 */
export type PageType = ItemType | 'USERS' | 'GROUPS';

/**
 * ItemOptionsButtonのコンテナコンポーネント
 * パスまたはルートパラメータからページタイプを判定してボタンを表示
 */
export function ItemOptionsButtonContainer() {
  const params = useParams();
  const pathname = usePathname();
  const itemId = params?.itemId as string | undefined;
  const [itemType, setItemType] = useState<ItemType | null>(null);

  // パスベースでページタイプを判定
  const pageType = useMemo<PageType | null>(() => {
    if (pathname === '/users') {
      return 'USERS';
    }
    if (pathname === '/groups') {
      return 'GROUPS';
    }
    // itemIdがある場合のみitemTypeを返す（TABLE/FOLDERなど）
    if (itemId && itemType) {
      return itemType;
    }
    return null;
  }, [pathname, itemId, itemType]);

  useEffect(() => {
    // パスベースのページの場合はアイテムタイプ取得不要
    if (pathname === '/users' || pathname === '/groups') {
      return;
    }

    // itemIdがない場合は何もしない（stateはnullのまま）
    if (!itemId) {
      return;
    }

    const fetchItemType = async () => {
      const item = await getItemById(itemId);
      setItemType(item?.type ?? null);
    };

    fetchItemType();
  }, [itemId, pathname]);

  if (!pageType) {
    return null;
  }

  return <ItemOptionsButton pageType={pageType} />;
}
