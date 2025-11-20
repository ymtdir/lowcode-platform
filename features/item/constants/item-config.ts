import { Folder, Table } from 'lucide-react';
import type { ItemType } from '@prisma/client';

/**
 * アイテムタイプごとの設定
 */
type ItemConfig = {
  icon: typeof Folder | typeof Table;
  draggable: boolean;
  droppable: boolean;
  canHaveChildren: boolean;
  showAddButton: boolean;
  showChevron: boolean; // ホバー時にChevronRightを表示するか
};

/**
 * アイテムタイプの設定（Config-Driven UI）
 */
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
