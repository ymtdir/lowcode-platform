'use client';

import Link from 'next/link';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        {item.children && item.children.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {item.children.map((child) => (
              <Link
                key={child.id}
                href={`/${child.id}`}
                className="block rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <h2 className="font-semibold mb-2">{child.name}</h2>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    タイプ: {child.type === 'FOLDER' ? 'フォルダ' : 'テーブル'}
                  </p>
                  {child._count && <p>子アイテム数: {child._count.children}</p>}
                  <p>
                    作成日時:{' '}
                    {new Date(child.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              </Link>
            ))}
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
