'use client';

import type { Folder as FolderType } from '@/features/folder/types';
import { FolderItem } from './folder-item';

type WorkspaceItemsProps = {
  folders: FolderType[];
};

export function WorkspaceItems({ folders }: WorkspaceItemsProps) {
  if (folders.length === 0) {
    return (
      <div className="px-2 py-4">
        <p className="text-sm text-muted-foreground">
          ワークスペースがありません
        </p>
      </div>
    );
  }

  return (
    <>
      {folders.map((folder) => (
        <FolderItem key={folder.id} folder={folder} />
      ))}
    </>
  );
}
