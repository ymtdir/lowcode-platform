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

    // 競合状態を防ぐためのフラグ
    let cancelled = false;

    const fetchItemType = async () => {
      try {
        const item = await getItemById(itemId);
        // コンポーネントがアンマウントされた、または新しいitemIdでリクエストが開始された場合は状態更新しない
        if (!cancelled) {
          setItemType(item?.type ?? null);
        }
      } catch (error) {
        // エラー時も競合状態チェック
        if (!cancelled) {
          console.error('Failed to fetch item type:', error);
          setItemType(null);
        }
      }
    };

    fetchItemType();

    // クリーンアップ: 新しいitemIdでリクエストが開始されたら古いリクエストの結果を無視
    return () => {
      cancelled = true;
    };
  }, [itemId, pathname]);

  if (!pageType) {
    return null;
  }

  return <ItemOptionsButton pageType={pageType} itemId={itemId} />;
}
