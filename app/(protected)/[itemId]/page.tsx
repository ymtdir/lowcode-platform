import { getItemById } from '@/features/item/api';
import type { Item } from '@/features/item/types';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type ItemPageProps = {
  params: Promise<{ itemId: string }>;
};

export default async function ItemPage({ params }: ItemPageProps) {
  const { itemId } = await params;

  const item = await getItemById(itemId);

  if (!item) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{item.name}</h1>
      </div>

      <div className="grid gap-4">
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">
            {item.type === 'FOLDER' ? 'フォルダ情報' : 'テーブル情報'}
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">ID</dt>
              <dd className="mt-1 text-sm">{item.id}</dd>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              作成者: {item.createdBy.name || item.createdBy.email}
            </p>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {item.type === 'FOLDER' ? '子フォルダ数' : '子アイテム数'}
              </dt>
              <dd className="mt-1 text-sm">{item._count?.children || 0}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                作成日時
              </dt>
              <dd className="mt-1 text-sm">
                {new Date(item.createdAt).toLocaleString('ja-JP')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                更新日時
              </dt>
              <dd className="mt-1 text-sm">
                {new Date(item.updatedAt).toLocaleString('ja-JP')}
              </dd>
            </div>
          </dl>
        </div>

        {item.children && item.children.length > 0 && (
          <div className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">
              {item.type === 'FOLDER' ? '子フォルダ' : '子アイテム'}
            </h2>
            <div className="grid gap-2">
              {item.children.map((child: Item) => (
                <div
                  key={child.id}
                  className="flex items-center gap-2 rounded-md border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{child.name}</p>
                    <p className="text-sm text-muted-foreground">
                      作成者: {child.createdBy.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!item.children || item.children.length === 0) && (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">
              {item.type === 'FOLDER'
                ? 'このフォルダには子アイテムがありません'
                : 'このテーブルには子アイテムがありません'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
