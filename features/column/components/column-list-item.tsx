'use client';

import { useState } from 'react';
import { GripVertical, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Column } from '../types/column';
import { COLUMN_CONFIGS } from '../constants';
import { EditColumnItem } from './edit-column-item';
import { DeleteColumnItem } from './delete-column-item';

type ColumnListItemProps = {
  itemId: string;
  column: Column;
};

/**
 * カラムリストアイテムコンポーネント
 */
export function ColumnListItem({ itemId, column }: ColumnListItemProps) {
  const [open, setOpen] = useState(false);
  const config = COLUMN_CONFIGS[column.type];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
      {/* ドラッグハンドル（将来実装） */}
      <div className="cursor-grab text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* アイコン */}
      <div className="flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* カラム情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium truncate">{column.name}</div>
          {column.validation?.required && (
            <span className="text-xs text-destructive">*</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">{config.label}</div>
      </div>

      {/* アクションメニュー */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">メニューを開く</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <EditColumnItem
            itemId={itemId}
            column={column}
            onOpenChange={setOpen}
          />
          <DeleteColumnItem
            itemId={itemId}
            column={column}
            onOpenChange={setOpen}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
