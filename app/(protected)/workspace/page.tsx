import Link from 'next/link';
import { getItems } from '@/features/item/api';

export const dynamic = 'force-dynamic';

export default async function WorkspacePage() {
  const folders = await getItems();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ワークスペース</h1>
      </div>

      <div className="grid gap-4">
        {folders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`/${folder.id}`}
                className="block rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <h2 className="font-semibold mb-2">{folder.name}</h2>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    作成者: {folder.createdBy.name || folder.createdBy.email}
                  </p>
                  {folder._count && (
                    <p>子フォルダ数: {folder._count.children}</p>
                  )}
                  <p>
                    作成日時:{' '}
                    {new Date(folder.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">ワークスペースがありません</p>
            <p className="text-sm text-muted-foreground mt-2">
              サイドバーの「ワークスペース」から新しいワークスペースを作成できます
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
