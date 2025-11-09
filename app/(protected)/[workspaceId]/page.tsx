import { getFolderById } from '@/features/folder/api';
import { notFound } from 'next/navigation';

type WorkspacePageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params;

  const workspace = await getFolderById(workspaceId);

  if (!workspace) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{workspace.name}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          作成者: {workspace.createdBy.name || workspace.createdBy.email}
        </p>
      </div>

      <div className="grid gap-4">
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-semibold mb-4">ワークスペース情報</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                ワークスペースID
              </dt>
              <dd className="mt-1 text-sm">{workspace.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                子フォルダ数
              </dt>
              <dd className="mt-1 text-sm">
                {workspace._count?.children || 0}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                作成日時
              </dt>
              <dd className="mt-1 text-sm">
                {new Date(workspace.createdAt).toLocaleString('ja-JP')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                更新日時
              </dt>
              <dd className="mt-1 text-sm">
                {new Date(workspace.updatedAt).toLocaleString('ja-JP')}
              </dd>
            </div>
          </dl>
        </div>

        {workspace.children && workspace.children.length > 0 && (
          <div className="rounded-lg border p-4">
            <h2 className="text-xl font-semibold mb-4">子フォルダ</h2>
            <div className="grid gap-2">
              {workspace.children.map((child) => (
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

        {(!workspace.children || workspace.children.length === 0) && (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">
              このワークスペースには子フォルダがありません
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
