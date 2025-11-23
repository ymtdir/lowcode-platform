'use client';

import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Breadcrumb } from '.';
import {
  getItemBreadcrumb,
  type BreadcrumbItem as BreadcrumbItemType,
} from '@/features/item/api';

/**
 * ページ名のマッピング
 */
const PAGE_NAMES: Record<string, string> = {
  '/': 'ホーム',
  '/users': 'ユーザー管理',
  '/workspace': 'ワークスペース',
  '/groups': 'グループ管理',
};

/**
 * パンくずリストコンテナコンポーネント
 * クライアントサイドでパンくずリストのデータを取得し、
 * プレゼンテーションコンポーネントに渡す
 */
export function BreadcrumbContainer() {
  const params = useParams();
  const pathname = usePathname();
  const itemId = params?.itemId as string | undefined;
  const [ancestors, setAncestors] = useState<BreadcrumbItemType[]>([]);

  useEffect(() => {
    if (!itemId) {
      return;
    }

    let cancelled = false;

    const fetchAncestors = async () => {
      const result = await getItemBreadcrumb(itemId);
      if (!cancelled) {
        setAncestors(result);
      }
    };

    fetchAncestors();

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  // パンくずリストアイテムを構築
  const breadcrumbItems: Array<{ label: string; href: string }> = [];

  // itemIdがある場合（ワークスペース内のアイテム）
  if (itemId && ancestors.length > 0) {
    // 最後のアイテム以外をbreadcrumbItemsに追加
    ancestors.slice(0, -1).forEach((item) => {
      breadcrumbItems.push({
        label: item.name,
        href: `/${item.id}`,
      });
    });

    // 最後のアイテム（現在のページ）を追加
    const currentItem = ancestors[ancestors.length - 1];
    if (currentItem) {
      breadcrumbItems.push({
        label: currentItem.name,
        href: `/${currentItem.id}`,
      });
    }
  } else {
    // itemIdがない場合（固定ページ）
    const pageName = PAGE_NAMES[pathname || ''];
    if (pageName) {
      // ホーム画面の場合は何も追加しない（Breadcrumbで自動追加される）
      if (pathname !== '/') {
        breadcrumbItems.push({
          label: pageName,
          href: pathname,
        });
      }
    }
  }

  return <Breadcrumb items={breadcrumbItems} />;
}
