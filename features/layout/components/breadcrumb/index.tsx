'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import {
  Breadcrumb as BreadcrumbUI,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

/**
 * パンくずリストアイテムの型
 */
type BreadcrumbItemType = {
  label: string;
  href: string;
};

/**
 * BreadcrumbコンポーネントのProps型
 */
type BreadcrumbProps = {
  items?: BreadcrumbItemType[];
};

/**
 * パンくずリストコンポーネント
 * プレゼンテーションコンポーネント：親からitemsを受け取り表示するだけ
 */
export function Breadcrumb({ items = [] }: BreadcrumbProps) {
  // 先頭に「ホーム」を自動追加
  const allItems: BreadcrumbItemType[] = [
    { label: 'ホーム', href: '/' },
    ...items,
  ];

  return (
    <BreadcrumbUI>
      <BreadcrumbList>
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <Fragment key={`${item.href}-${index}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbUI>
  );
}
