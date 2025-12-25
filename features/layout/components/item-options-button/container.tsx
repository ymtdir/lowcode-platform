'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ItemType } from '@prisma/client';
import { getItemById } from '@/features/item/api';
import { ItemOptionsButton } from './index';

/**
 * ItemOptionsButtonのコンテナコンポーネント
 * ルートパラメータからitemIdを取得し、アイテム情報を取得してボタンを表示
 */
export function ItemOptionsButtonContainer() {
  const params = useParams();
  const itemId = params?.itemId as string | undefined;
  const [itemType, setItemType] = useState<ItemType | null>(null);

  useEffect(() => {
    if (!itemId) {
      return;
    }

    const fetchItemType = async () => {
      const item = await getItemById(itemId);
      setItemType(item?.type ?? null);
    };

    fetchItemType();
  }, [itemId]);

  // itemIdがない、またはitemTypeがない場合はnullを返す
  if (!itemId || !itemType) {
    return null;
  }

  return <ItemOptionsButton itemType={itemType} />;
}
