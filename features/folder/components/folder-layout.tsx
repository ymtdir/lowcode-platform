'use client';

import Link from 'next/link';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getItemIcon } from '@/features/item/utils';
import { ITEM_CONFIGS } from '@/features/item/constants';
import type { Item } from '@/features/item/types';

/**
 * FolderLayoutのProps型
 */
type FolderLayoutProps = {
  item: Item & { type: 'FOLDER' };
};

/**
 * フォルダレイアウトコンポーネント
 */
export function FolderLayout({ item }: FolderLayoutProps) {
  // order順にソート
  const sortedChildren = item.children
    ? [...item.children].sort((a, b) => a.order - b.order)
    : [];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{item.name}</h1>
        <Link href={`/${item.id}/edit`}>
          <Button variant="outline">
            <Settings2 className="size-4" />
            フォルダ管理
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {sortedChildren.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedChildren.map((child) => {
              const Icon = getItemIcon(child);
              const DefaultIcon = ITEM_CONFIGS[child.type].icon;
              return (
                <Link key={child.id} href={`/${child.id}`}>
                  <Card className="cursor-pointer flex flex-col h-full p-4">
                    <div className="flex justify-end mb-2">
                      <Badge variant="secondary" className="flex items-center">
                        <DefaultIcon className="size-5!" />
                      </Badge>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <Icon className="size-12 text-primary" />
                    </div>
                    <div className="text-center mt-2">
                      <h2 className="font-semibold text-lg line-clamp-2">
                        {child.name}
                      </h2>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">このフォルダは空です</p>
            <p className="text-sm text-muted-foreground mt-2">
              サイドバーの「ワークスペース」から新しいアイテムを作成できます
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
