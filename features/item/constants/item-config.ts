import { Folder, Table } from 'lucide-react';
import type { ItemType } from '@prisma/client';

type ItemConfig = {
  icon: typeof Folder | typeof Table;
  draggable: boolean;
  droppable: boolean;
  canHaveChildren: boolean;
  showAddButton: boolean;
  showChevron: boolean; // ホバー時にChevronRightを表示するか
};

export const ITEM_CONFIGS: Record<ItemType, ItemConfig> = {
  FOLDER: {
    icon: Folder,
    draggable: true,
    droppable: true,
    canHaveChildren: true,
    showAddButton: true,
    showChevron: true,
  },
  TABLE: {
    icon: Table,
    draggable: true,
    droppable: false,
    canHaveChildren: false,
    showAddButton: false,
    showChevron: false,
  },
} as const;
