'use client';

import type { Folder as FolderType } from '@/features/folder/types';
import { FolderItem } from './folder-item';

type DropPosition = 'before' | 'after' | 'inside';

type WorkspaceItemsProps = {
  folders: FolderType[];
  overId: string | null;
  dropPosition: DropPosition;
  insideTargetId: string | null;
  activeFolder: FolderType | null;
};

export function WorkspaceItems({
  folders,
  overId,
  dropPosition,
  insideTargetId,
  activeFolder,
}: WorkspaceItemsProps) {
  return (
    <>
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          overId={overId}
          dropPosition={dropPosition}
          insideTargetId={insideTargetId}
          activeFolder={activeFolder}
        />
      ))}
    </>
  );
}
