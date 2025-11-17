'use client';

import type { Item as ItemType } from '@/features/item/types';
import { Item } from './item';

type DropPosition = 'before' | 'after' | 'inside';

type WorkspaceItemsProps = {
  items: ItemType[];
  overId: string | null;
  dropPosition: DropPosition;
  insideTargetId: string | null;
  activeItem: ItemType | null;
};

export function WorkspaceItems({
  items,
  overId,
  dropPosition,
  insideTargetId,
  activeItem,
}: WorkspaceItemsProps) {
  return (
    <>
      {items.map((item) => (
        <Item
          key={item.id}
          item={item}
          overId={overId}
          dropPosition={dropPosition}
          insideTargetId={insideTargetId}
          activeItem={activeItem}
        />
      ))}
    </>
  );
}
