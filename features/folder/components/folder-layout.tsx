import type { Item } from '@/features/item/types';

/**
 * FolderLayoutのProps型
 */
type FolderLayoutProps = {
  item: Item;
};

/**
 * フォルダ画面のレイアウトコンポーネント
 */
export function FolderLayout({ item }: FolderLayoutProps) {
  return (
    <div className="w-full p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{item.name}</h1>
      </div>

      <div className="grid gap-4">
        {/* フォルダ情報 */}
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">フォルダ情報</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">ID</dt>
              <dd className="mt-1 text-sm">{item.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                子フォルダ数
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

        {/* 子アイテム一覧 */}
        {item.children && item.children.length > 0 && (
          <div className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">子フォルダ</h2>
            <div className="grid gap-2">
              {item.children.map((child: Item) => (
                <div
                  key={child.id}
                  className="flex items-center gap-2 rounded-md border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{child.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 子アイテムがない場合 */}
        {(!item.children || item.children.length === 0) && (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">
              このフォルダには子アイテムがありません
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
